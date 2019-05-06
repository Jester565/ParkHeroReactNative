package com.parkhero

import acceleration.Acceleration
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.net.Uri
import android.opengl.Matrix
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.provider.MediaStore
import android.support.v4.app.NotificationCompat
import android.util.Log
import com.amazonaws.mobileconnectors.s3.transferutility.TransferListener
import com.amazonaws.mobileconnectors.s3.transferutility.TransferState
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility
import com.amazonaws.services.s3.AmazonS3Client
import com.github.hiteshsondhi88.libffmpeg.ExecuteBinaryResponseHandler
import com.github.hiteshsondhi88.libffmpeg.FFmpeg
import com.github.hiteshsondhi88.libffmpeg.FFmpegExecuteResponseHandler
import com.github.hiteshsondhi88.libffmpeg.FFmpegLoadBinaryResponseHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.io.OutputStreamWriter
import java.util.*
import kotlin.collections.ArrayList
import kotlin.collections.HashMap
import kotlin.concurrent.fixedRateTimer
import kotlin.coroutines.resume

class RideRecService : Service() {
    companion object {
        const val REC_CHANNEL_ID = "RecAccel"
        const val ACCEL_RATE = 30L
        const val SMART_WINDOW_SIZE = 800L
        const val SMART_SIZE_CHANGE_LIMIT = 3
        const val SMART_ACCEL_MIN = 10000
        const val ACCEL_MULT = 32726.0f/10.0f
        const val MAX_ACCEL_DIST = 10
        const val MAX_POINT_DIFF = 20
        const val BUCKET_NAME = "disneyapp3"
        const val UPLOAD_FOLDER = "vids/"
        const val UPLOAD_ACTION = "ACCEL_UPLOAD"
    }

    //Data structures for calculations the netAcceleration
    private var r = FloatArray(16, {0.0f})
    private var rinv = FloatArray(16, {0.0f})
    private var trueAcceleration = FloatArray(4, {0.0f})
    private var gravity: FloatArray? = null
    private var geoMagnetic: FloatArray? = null
    private var linearAcceleration = FloatArray(4,  {0.0f})
    private var netAcceleration = FloatArray(3, {0.0f})
    private var netAccelCount: Int = 0

    private lateinit var sensorManager: SensorManager
    private lateinit var gravitySensor: Sensor
    private lateinit var geoMagneticSensor: Sensor
    private lateinit var linearAccelerationSensor: Sensor

    private var running = false

    private var activeMillis = ArrayList<Long>()
    private var activeAccels = arrayOf(ArrayList<Int>(), ArrayList<Int>(), ArrayList<Int>())

    private var millis = ArrayList<Long>()
    private var accels = arrayOf(ArrayList<Int>(), ArrayList<Int>(), ArrayList<Int>())

    private var ridePacks: Acceleration.RidePacks? = null

    private lateinit var dataUpdateReceiver: DataUpdateReceiver


    private fun accelToInt(accel: Float): Int {
        return (accel * RideRecService.ACCEL_MULT).toInt()
    }

    private var sensorListener = object: SensorEventListener2 {
        override fun onAccuracyChanged(p0: Sensor?, p1: Int) { }

        override fun onFlushCompleted(p0: Sensor?) { }

        override fun onSensorChanged(evt: SensorEvent?) {
            if (evt != null) {
                when (evt.sensor.type) {
                    Sensor.TYPE_GRAVITY -> {
                        gravity = evt.values
                    }
                    Sensor.TYPE_MAGNETIC_FIELD -> {
                        geoMagnetic = evt.values
                    }
                    Sensor.TYPE_LINEAR_ACCELERATION -> {
                        linearAcceleration[0] = evt.values[0]
                        linearAcceleration[1] = evt.values[1]
                        linearAcceleration[2] = evt.values[2]
                        linearAcceleration[3] = 0f
                    }
                }
                try {
                    if (gravity != null && geoMagnetic != null && linearAcceleration != null) {
                        SensorManager.getRotationMatrix(r, null, gravity, geoMagnetic);
                        Matrix.invertM(rinv, 0, r, 0)
                        Matrix.multiplyMV(trueAcceleration, 0, rinv, 0, linearAcceleration, 0)
                        synchronized(netAcceleration) {
                            netAccelCount++
                            var i = 0
                            while (i < 3) {
                                netAcceleration[i] = netAcceleration[i] * (netAccelCount - 1) / (netAccelCount) + trueAcceleration[i] / netAccelCount
                                i++
                            }
                        }
                    }
                } catch(ex: Exception) {
                    Log.e("STATE", "EX: " + ex.message)
                }
            }
        }
    }

    private fun startCollection() {
        Log.d("ACCEL", "Starting collection")

        loadRidePacks()
        resetAccels()

        sensorManager.registerListener(sensorListener, gravitySensor, SensorManager.SENSOR_DELAY_FASTEST)
        sensorManager.registerListener(sensorListener, geoMagneticSensor, SensorManager.SENSOR_DELAY_FASTEST)
        sensorManager.registerListener(sensorListener, linearAccelerationSensor, SensorManager.SENSOR_DELAY_FASTEST)

        running = true

        //Adds to accelerations every 30 ms
        fixedRateTimer(period = ACCEL_RATE, action = {
            if (!running) {
                cancel()
            }

            synchronized(netAcceleration) {
                netAccelCount = 0
                activeMillis.add(Date().time)
                activeAccels.forEachIndexed { i, arr ->
                    arr.add(accelToInt(netAcceleration[i]))
                }
            }
        })
    }

    private fun loadRidePacks() {
        val res = resources
        val in_s = res.openRawResource(R.raw.packs)

        val b = ByteArray(in_s.available())
        in_s.read(b)
        ridePacks = Acceleration.RidePacks.parseFrom(b)
    }

    private fun resetAccels() {
        millis.clear()
        for (arr in accels) {
            arr.clear()
        }

        //Clear accelerations already added, out of order times would mess up smartAverage
        synchronized(activeAccels) {
            activeMillis.clear()
            activeAccels.forEach { arr->
                arr.clear()
            }
        }
    }

    private class DataUpdateReceiver(var rideRecService: RideRecService): BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == UPLOAD_ACTION) {
                var vidPath = intent.extras.getString("vidPath")
                var startMillis = intent.extras.getLong("startMillis")
                var fileName = intent.extras.getString("fileName")
                var userID = intent.extras.getString("userID")
                var accessKey = intent.extras.getString("accessKey")
                var secretKey = intent.extras.getString("secretKey")
                var sessionToken = intent.extras.getString("sessionToken")
                rideRecService.runMatch(vidPath, startMillis, fileName, userID, accessKey, secretKey, sessionToken)
            }
        }
    }

    data class PackMatchResult(val distance: Int, val packName: String, val pointAccelIs: Map<String, Int>)

    fun runMatch(vidPath: String, realMillis: Long, fileName: String, userID: String, accessKey: String?, secretKey: String?, sessionToken: String?) {
        var smartAvgs = transferAccelsToSmartAverages()
        var smartAvgTransitions = toTransitionArr(smartAvgs)
        var matchResult = matchPack(smartAvgTransitions, smartAvgs.size, ridePacks!!)
        Log.d("RIDE_REC_TEST", "MatchPack Result: " + matchResult?.pointAccelIs?.toString())
        if (matchResult != null) {
            var pointTimeMatches = HashMap<String, Long>()
            var startMillis = millis[0]
            matchResult.pointAccelIs.forEach { pointName, accelI ->
                pointTimeMatches[pointName] = startMillis + (accelI + 1) * (SMART_WINDOW_SIZE / 2)
            }
            uploadMatch(fileName, pointTimeMatches, userID, accessKey, secretKey, sessionToken)
            var vidFile = File(vidPath)
            GlobalScope.async(Dispatchers.Main) {
                edit(vidFile, realMillis, pointTimeMatches)
            }
        }
    }

    private fun transferAccelsToSmartAverages(): ArrayList<Int> {
        //Prevent one from modifying and one from reading
        synchronized(netAcceleration) {
            millis.addAll(activeMillis)
            activeMillis.clear()
            accels.forEachIndexed { i, arr ->
                arr.addAll(activeAccels[i])
                activeAccels[i].clear()
            }
        }
        return createSmartAverage(millis, accels, RideRecService.SMART_WINDOW_SIZE, RideRecService.SMART_SIZE_CHANGE_LIMIT, RideRecService.SMART_ACCEL_MIN)
    }

    //Removes noise from acceleration using moving average and sign changes
    private fun createSmartAverage(millisArr: ArrayList<Long>,
                                   accelArrs: Array<ArrayList<Int>>,
                                   millisWindowSize: Long,
                                   signChangeLimit: Int,
                                   limit: Int): ArrayList<Int> {
        //The window used to calculate moving average
        var windowAccel = ArrayList<Int>()
        //Holds number of acceleration sign changes for the window
        var signChangeWindow = ArrayList<Int>()
        //Resulting smartAvg
        var smartAvgs = ArrayList<Int>()
        accelArrs.forEachIndexed { arrIdx, arr ->
            windowAccel.add(0)
            signChangeWindow.add(0)
        }
        var startI = 0
        var endI = 0
        var currentMillis = millisArr.get(0)
        while (true) {
            currentMillis += millisWindowSize / 2
            while (millisArr[startI] < currentMillis - millisWindowSize / 2) {
                accelArrs.forEachIndexed { arrIdx, arr ->
                    windowAccel[arrIdx] -= arr[startI]
                    if (startI > 0 && arr[startI] * arr[startI - 1] < 0) {
                        signChangeWindow[arrIdx] -= 1
                    }
                }
                startI++
            }
            while (millisArr[endI] < currentMillis + millisWindowSize / 2) {
                accelArrs.forEachIndexed { arrIdx, arr ->
                    windowAccel[arrIdx] += arr[endI]
                    if (endI > 0 && arr[endI] * arr[endI - 1] < 0) {
                        signChangeWindow[arrIdx] += 1
                    }
                }
                endI++
                if (endI >= millisArr.size) {
                    return smartAvgs
                }
            }
            var avgSum = 0.0
            windowAccel.forEachIndexed { arrIdx, a ->
                var a2 = a/(endI - startI + 1)
                if (signChangeWindow[arrIdx] <= signChangeLimit) {
                    avgSum += a2 * a2
                }
            }
            if (kotlin.math.sqrt(avgSum) >= limit) {
                smartAvgs.add(1)
            } else {
                smartAvgs.add(0)
            }
        }
    }

    private fun toTransitionArr(arr: ArrayList<Int>): ArrayList<Int> {
        var transitions = ArrayList<Int>()
        for (i in 1 until arr.size) {
            if (arr[i] != arr[i - 1]) {
                transitions.add(i)
            }
        }
        return transitions
    }

    data class AccelMatchResult(val distance: Int, val matchedAccelIs: ArrayList<Int>)

    private fun matchPack(accelTransitions: ArrayList<Int>, maxAccelI: Int, ridePacks: Acceleration.RidePacks): PackMatchResult? {
        var distMap = HashMap<String, AccelMatchResult>()
        var minAccelMatch: AccelMatchResult? = null
        var minPack: Acceleration.RidePacks.Pack? = null
        for (pack in ridePacks.packsList) {
            var accelMatch = getAccelMatchForPoints(accelTransitions, 0, maxAccelI - pack.duration, pack.pointsList, distMap)
            if (accelMatch != null && (minAccelMatch == null || accelMatch.distance < minAccelMatch.distance)) {
                minAccelMatch = accelMatch
                minPack = pack
            }
        }
        if (minPack != null && minAccelMatch != null) {
            var pointAccelIs = HashMap<String, Int>()
            minPack.pointsList.forEachIndexed { i, point ->
                var matchAccelI = minAccelMatch.matchedAccelIs[i]
                pointAccelIs[point.name] = matchAccelI
            }
            return PackMatchResult(minAccelMatch.distance, minPack.name, pointAccelIs)
        }
        return null
    }

    private fun getAccelMatchForPoints(accelTransitions: ArrayList<Int>, startAccelI: Int, endAccelI: Int, ridePoints: List<Acceleration.RidePacks.Pack.Point>, distMap: HashMap<String, AccelMatchResult>): AccelMatchResult? {
        var minDist: Int? = null
        var minMatches: ArrayList<Int>? = null
        var targetAccelI = startAccelI
        var transitionI = 0
        while (true) {
            if (targetAccelI > endAccelI) {
                break
            }
            while (true) {
                if (transitionI >= accelTransitions.size || accelTransitions[transitionI] >= targetAccelI) {
                    break
                }
                transitionI++
            }
            var distance: Int
            var matches = arrayListOf(targetAccelI)
            var distKey = ridePoints[0].name + "--" + targetAccelI.toString()
            var storedDistResult = distMap[distKey]
            if (storedDistResult == null) {
                distance = getAccelDistanceFromPoint(accelTransitions, ridePoints[0].transitionsList, targetAccelI, transitionI)
                if (ridePoints.size > 1) {
                    var nextPointAccelI = targetAccelI + ridePoints[0].duration + ridePoints[1].dist
                    var matchResult = getAccelMatchForPoints(accelTransitions,
                        nextPointAccelI - MAX_POINT_DIFF,
                        nextPointAccelI + MAX_POINT_DIFF,
                        ridePoints.subList(1, ridePoints.size),
                        distMap)
                    if (matchResult == null) {
                        continue
                    }
                    distance += matchResult.distance
                    matches.addAll(matchResult.matchedAccelIs)
                }
                distMap[distKey] = AccelMatchResult(distance, matches)
            } else {
                distance = storedDistResult.distance
                matches = storedDistResult.matchedAccelIs
            }
            if (minDist == null || distance < minDist) {
                minDist = distance
                minMatches = matches
            }
            targetAccelI++
        }
        if (minDist != null && minMatches != null) {
            return AccelMatchResult(minDist, minMatches)
        }
        return null
    }

    private fun getAccelDistanceFromPoint(accelTransitions: List<Int>, rideTransitions: List<Int>, accelStartI: Int, accelTranStartI: Int): Int {
        var accelTranI = 0
        var rideTranI = 0
        var distance = 0
        while (true) {
            while (rideTranI < rideTransitions.size && (accelTranI + accelTranStartI >= accelTransitions.size || rideTransitions[rideTranI] < accelTransitions[accelTranI + accelTranStartI] - accelStartI)) {
                var distResult = getAccelDistance(accelTransitions, rideTransitions, accelTranI + accelTranStartI, rideTranI, accelStartI, 0)
                distance += distResult.first
                rideTranI++
            }
            if (rideTranI >= rideTransitions.size) {
                break
            }
            var distResult = getAccelDistance(rideTransitions, accelTransitions, rideTranI, accelTranI + accelTranStartI, 0, accelStartI)
            distance += distResult.first
            accelTranI++
        }
        return distance
    }

    private fun getAccelDistance(bigArr: List<Int>, subArr: List<Int>, highI: Int, midI: Int, bigOff: Int = 0, subOff: Int = 0, blockLow: Boolean = false, blockHigh: Boolean = false): Pair<Int, Boolean> {
        var lowDist = MAX_ACCEL_DIST
        var highDist = MAX_ACCEL_DIST
        if (highI > 0 && highI <= bigArr.size && midI < subArr.size) {
            lowDist = (subArr[midI] - subOff) - (bigArr[highI - 1] - bigOff)
        }
        if (highI >= 0 && highI < bigArr.size && midI < subArr.size) {
            highDist = (bigArr[highI] - bigOff) - (subArr[midI] - subOff)
        }
        var minDist = 0
        var isHigh = false
        if (lowDist <= highDist && !blockLow) {
            minDist = lowDist
        } else if (!blockHigh) {
            minDist = highDist
            isHigh = true
        }
        return Pair(offsetAccelDistance(minDist), isHigh)
    }

    private fun offsetAccelDistance(accelDist: Int): Int {
        if (accelDist <= MAX_ACCEL_DIST) {
            return accelDist
        }
        return MAX_ACCEL_DIST
    }

    private fun createTransferUtility(accessKey: String?, secretKey: String?, sessionToken: String?): TransferUtility {
        var credProvider = AwsSessionCredentialProvider(AwsSessionCredentials(sessionToken, accessKey, secretKey))
        var s3Client = AmazonS3Client(credProvider)
        return TransferUtility.builder().context(applicationContext).s3Client(s3Client).defaultBucket(BUCKET_NAME).build()
    }

    private fun uploadMatch(fileName: String, pointTimeMatches: Map<String, Long>, userID: String, accessKey: String?, secretKey: String?, sessionToken: String?) {
        var jObj = JSONObject()
        pointTimeMatches.forEach { pointName, millis ->
            jObj.put(pointName, millis)
        }
        var fileData = jObj.toString()
        var file = writeToFile(fileName, fileData, applicationContext)
        if (file != null) {
            var transferUtility = createTransferUtility(accessKey, secretKey, sessionToken)
            transferUtility.upload(UPLOAD_FOLDER + userID + "/" + fileName, file)
        }
    }

    private fun writeToFile(fileName: String, data: String, context: Context): File? {
        try {
            var file = File(context.filesDir, fileName)
            val outputStreamWriter = OutputStreamWriter(file.outputStream())
            outputStreamWriter.write(data)
            outputStreamWriter.close()
            return file
        } catch (e: IOException) {
            Log.e("Exception", "File write failed: " + e.toString())
        }
        return null
    }

    private fun stopCollection() {
        Log.d("ACCEL", "Stopping recognition")
        running = false
        sensorManager.unregisterListener(sensorListener)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        Log.d("RIDE_REC", "Starting")
        registerReceiver()
        createNotification()

        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager

        gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY)
        geoMagneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
        linearAccelerationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION)

        Log.d("RIDE_REC", "Checking extras")
        var testObjKey = intent?.extras?.getString("testObjKey")
        if (testObjKey == null) {
            startCollection()
        } else {
            var startTestMillis = intent?.extras?.getLong("startMillis")
            var accessKey = intent?.extras?.getString("accessKey")
            var secretKey = intent?.extras?.getString("secretKey")
            var sessionToken = intent?.extras?.getString("sessionToken")
            startTestCollection(testObjKey, startTestMillis!!, accessKey!!, secretKey!!, sessionToken!!)
        }

        return START_NOT_STICKY
    }

    private fun registerReceiver() {
        dataUpdateReceiver = DataUpdateReceiver(this)
        var intentFilter = IntentFilter(UPLOAD_ACTION)
        registerReceiver(dataUpdateReceiver, intentFilter)
    }

    private fun createNotification() {
        createNotificationChannel(REC_CHANNEL_ID, "Recognition", "Recongizes Rides")
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            val notification = Notification.Builder(applicationContext, REC_CHANNEL_ID)
                .setContentTitle("Recognition")
                .setContentText("Monitoring Acceleration")
                .build()
            startForeground(101, notification)
        } else {
            val notification = NotificationCompat.Builder(this)
                .setContentTitle("ACCEL")
                .setContentText("Monitoring Acceleration")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build()
            startForeground(101, notification)
        }
    }

    private fun createNotificationChannel(id: String, name: String, desc: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create the NotificationChannel
            val importance = NotificationManager.IMPORTANCE_HIGH
            val mChannel = NotificationChannel(id, name, importance)
            mChannel.description = desc
            // Register the channel with the system; you can't change the importance
            // or other notification behaviors after this
            val notificationManager = getSystemService(
                Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(mChannel)
        }
    }

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopCollection()
        unregisterReceiver(dataUpdateReceiver)
    }

    private fun startTestCollection(testObjKey: String, startMillis: Long, accessKey: String, secretKey: String, sessionToken: String) {
        Log.d("RIDE_REC_TEST", "Initializing test with objKey: " + testObjKey)
        var transferUtility = createTransferUtility(accessKey, secretKey, sessionToken)
        var file = File(applicationContext.filesDir, "test.accel")
        var observer = transferUtility.download(testObjKey, file)
        observer.setTransferListener(object: TransferListener {
            override fun onProgressChanged(id: Int, bytesCurrent: Long, bytesTotal: Long) {

            }

            override fun onStateChanged(id: Int, state: TransferState?) {
                if (state == TransferState.COMPLETED) {
                    var accelPack = Acceleration.AccelerationData.parseFrom(FileInputStream(file))
                    var testAccels = arrayOf(ArrayList<Int>(), ArrayList<Int>(), ArrayList<Int>())
                    accelPack.xList.forEachIndexed { i, x ->
                        testAccels[0].add(accelPack.xList[i])
                        testAccels[1].add(accelPack.yList[i])
                        testAccels[2].add(accelPack.zList[i])
                    }
                    runTestAccels(testAccels, accelPack.millisList, startMillis)
                }
            }

            override fun onError(id: Int, ex: java.lang.Exception?) {
                Log.e("DOWNLOAD ERR: ", ex.toString())
            }
        })
    }

    private fun runTestAccels( testAccels: Array<ArrayList<Int>>, testMillisArr: List<Long>, testStartMillis: Long) {
        Log.d("RIDE_REC_TEST", "Running test")
        loadRidePacks()
        resetAccels()

        sensorManager.registerListener(sensorListener, gravitySensor, SensorManager.SENSOR_DELAY_FASTEST)
        sensorManager.registerListener(sensorListener, geoMagneticSensor, SensorManager.SENSOR_DELAY_FASTEST)
        sensorManager.registerListener(sensorListener, linearAccelerationSensor, SensorManager.SENSOR_DELAY_FASTEST)

        running = true

        testAccels.forEachIndexed { index, arr ->
            activeAccels[index].addAll(arr)
        }
        for (tMillis in testMillisArr) {
            activeMillis.add(tMillis - testMillisArr[0] + testStartMillis)
        }
        Log.d("RIDE_REC_TEST", "Test data outputted")
    }

    private suspend fun edit(videoFile: File, epochMillis: Long, pointMillis: Map<String, Long>) {
        var ffmpeg = loadBinary()

        val videoElmStr = resources.openRawResource(R.raw.thunder)
            .bufferedReader().use { it.readText() }

        var maxPosition = -1
        var videoFiles = HashMap<Int, String>()
        var musicFiles = HashMap<Int, String>()
        var videoElms = JSONArray(videoElmStr)
        for (i in 0 until videoElms.length()) {
            var videoElm = videoElms.getJSONObject(i)
            if (videoElm.has("accel")) {
                var accelMillis = pointMillis[videoElm.getString("accel")]!!
                var startMillis = accelMillis + videoElm.getLong("start") - epochMillis
                var fileName = "/tmp/${videoElm.getInt("position")}.mp4"
                //var tempFileName = "/tmp/${videoElm.getInt("position")}${if (videoElm.has("dbOff")) "d" else ""}.mp4"
                trimVideo(ffmpeg, videoFile.absolutePath, fileName, startMillis, videoElm.getLong("duration"))
                /*
                if (videoElm.has("dbOff") != null) {
                    adjustVolume(ffmpeg, tempFileName, fileName, videoElm.getInt("dbOff"))
                    deleteMediaFile(tempFileName)
                }
                */
                videoFiles[videoElm.getInt("position")] = fileName
            }
            else if (videoElm.has("file")) {
                var fileName = videoElm.getString("file")
                var filePostfix = fileName.substring(fileName.lastIndexOf('.') + 1)
                if (filePostfix == "mp3") {
                    musicFiles[videoElm.getInt("position")] = fileName
                } else {
                    videoFiles[videoElm.getInt("position")] = fileName
                }
            } else {
                Log.d("RIDE_REC_EDIT", "Bad json " + i)
            }
            if (videoElm.getInt("position") > maxPosition) {
                maxPosition = videoElm.getInt("position")
            }
        }

        var concatFiles = ArrayList<String>()
        var musicOffsets = HashMap<Int, String>()
        for (i in 0..maxPosition) {
            if (musicFiles.containsKey(i)) {
                var fileName = "/tmp/ag${i}.mp4"
                concatVidFiles(ffmpeg, fileName, concatFiles)
                var duration = getVideoDuration(ffmpeg, fileName)
                if (duration != null) {
                    musicOffsets[i] = duration
                } else {
                    Log.d("RIDE_REC_EDIT", "DURATION NULL")
                }
            }
            if (videoFiles.containsKey(i)) {
                concatFiles.add(videoFiles[i]!!)
            }
        }

        var resultFileName = "/tmp/out.mp4"
        concatVidFiles(ffmpeg, resultFileName, concatFiles)
        var i = 0
        for ((position, offset) in musicOffsets) {
            var musicFile = musicFiles[position]
            var newResultFileName = "/tmp/out${position}.mp4"
            addAudioToVideo(ffmpeg, resultFileName, musicFile!!, offset, newResultFileName)
            //deleteMediaFile(resultFileName)
            resultFileName = newResultFileName
            i++
        }
        var finalFile = File(getFilePath(resultFileName))
        var publicDirectory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        var generated = File(publicDirectory, "generated.mp4")
        try {
            finalFile.copyTo(generated, true)
        } catch (e: Exception) {
            Log.d("RIDE_REC_EDIT", "EXCEPTION: " + e.toString())
        }
        Log.d("RIDE_REC_EDIT", "Done")
        /*
        var stableFileName = "/tmp/stable.mp4"
        stabalizeVideo(ffmpeg, resultFileName, stableFileName)
        var stableFile = File(getFilePath(stableFileName))
        var stableGen = File(publicDirectory, "stable.mp4")
        try {
            stableFile.copyTo(stableGen, true)
        } catch (e: Exception) {
            Log.d("RIDE_REC_EDIT", "EXCEPTION: " + e.toString())
        }
        */
        this.stopSelf()
    }

    private suspend fun loadBinary(): FFmpeg = suspendCancellableCoroutine { cont ->
        var ffmpeg = FFmpeg.getInstance(this)
        ffmpeg.loadBinary(object : FFmpegLoadBinaryResponseHandler {
            override fun onFinish() {
                Log.d("RIDE_REC_EDIT", "FFMPEG LOAD FINISHED")
            }

            override fun onSuccess() {
                Log.d("RIDE_REC_EDIT", "FFMPEG LOAD SUCCESS")
                cont.resume(ffmpeg)
            }

            override fun onFailure() {
                Log.e("RIDE_REC_EDIT", "FFMPEG LOAD FAILURE")
            }

            override fun onStart() {
                Log.d("RIDE_REC_EDIT", "FFMPEG START")
            }
        })
    }

    private suspend fun executeFFmpegCommand(ffmpeg: FFmpeg, command: String): String? {
        Log.d("RIDE_REC_EDIT", "FFmpeg command started: " + command)
        var args = command.split("\\s".toRegex())
        for (arg in args) {
            Log.d("RIDE_REC_EDIT", "E: " + arg)
        }
        return executeFFmpegCommand(ffmpeg, args.toTypedArray())
    }

    private suspend fun executeFFmpegCommand(ffmpeg: FFmpeg, commands: Array<String>): String? = suspendCancellableCoroutine { cont ->
        ffmpeg.execute(commands, object: ExecuteBinaryResponseHandler() {
            override fun onFinish() {

            }

            override fun onSuccess(message: String?) {
                Log.d("RIDE_REC_EDIT", "FFmpeg Success: " + message)
                cont.resume(message)
            }

            override fun onFailure(message: String?) {
                Log.d("RIDE_REC_EDIT", "FFmpeg Failure: " + message)
                cont.resume(message)
            }

            override fun onProgress(message: String?) {
                Log.d("RIDE_REC_EDIT", message)
            }

            override fun onStart() {

            }
        })
    }

    private fun getFilePath(filePath: String): String {
        if (filePath.substring(0, "/tmp/".length) == "/tmp/") {
            var name = filePath.substring(filePath.lastIndexOf('/') + 1)
            var file = File(applicationContext.filesDir, name)
            return file.absolutePath
        } else if (filePath.indexOf("/") < 0) {
            val idField = getResId(filePath.substring(0, filePath.indexOf(".")), R.raw::class.java)
            var inputStream = resources.openRawResource(idField)
            var outFile = File(applicationContext.filesDir, filePath)
            var outputStream = outFile.outputStream()
            inputStream.use { input ->
                outputStream.use { fileOut ->
                    input.copyTo(fileOut)
                }
            }
            return outFile.absolutePath
        } else {
            return filePath
        }
    }

    private fun getResId(resName: String, c: Class<*>): Int {
        try {
            val idField = c.getDeclaredField(resName)
            return idField.getInt(idField)
        } catch (e: Exception) {
            e.printStackTrace()
            return -1
        }
    }

    private suspend fun trimVideo(ffmpeg: FFmpeg, inFileRelvName: String, outFileRelvName: String, startMillis: Long, durationMillis: Long) {
        var inFileName = getFilePath(inFileRelvName)
        var outFileName = getFilePath(outFileRelvName)
        var startStr = durationToStr(startMillis);
        var endStr = durationToStr(durationMillis);
        var command = "-y -ss ${startStr} -i ${inFileName} -t ${endStr} -r 25 -s 1920x1080 -c:v libx264 -preset ultrafast -b:v 4M -strict 2 -movflags faststart -copyinkf -async 1 ${outFileName}"
        executeFFmpegCommand(ffmpeg, command)
    }

    private suspend fun adjustVolume(ffmpeg: FFmpeg, inFileRelvName: String, outFileRelvName: String, dbOff: Int) {
        /*
        var inFileName = getFilePath(inFileRelvName)
        var outFileName = getFilePath(outFileRelvName)
        var command = "-y -i ${inFileName} -vcodec copy -af \"volume=${dbOff}dB\" ${outFileName}";
        executeFFmpegCommand(ffmpeg, command)
        */

    }

    private suspend fun concatVidFiles(ffmpeg: FFmpeg, outFileRelvName: String, concatFileRelvNames: List<String>) {
        var tsFileNames = ArrayList<String>()
        var concatStr = "concat:"
        concatFileRelvNames.forEachIndexed { i, fileName ->
            Log.d("RIDE_REC_EDIT", "RUNCON: " + fileName)
            var tsFileRelvName = "/tmp/${fileName.substring(0, fileName.lastIndexOf('.'))}.ts"
            if (fileName.lastIndexOf('/') >= 0) {
                tsFileRelvName = "/tmp${fileName.substring(fileName.lastIndexOf('/'), fileName.lastIndexOf('.'))}.ts"
            }
            if (concatFileRelvNames.size == 1) {
                tsFileRelvName = outFileRelvName
            }
            Log.d("RIDE_REC_EDIT", "FILERELVNAME: " + tsFileRelvName)
            var tsFileName = getFilePath(tsFileRelvName)
            Log.d("RIDE_REC_EDIT", "FILENAME: " + tsFileName)
            toMpeg2(ffmpeg, fileName, tsFileName)
            Log.d("RIDE_REC_EDIT", "MPEG2 Done")
            deleteMediaFile(fileName)
            concatStr += tsFileName
            if (i != concatFileRelvNames.size - 1) {
                concatStr += "|"
            }
            tsFileNames.add(tsFileName)
        }
        if (concatFileRelvNames.size > 1) {
            Log.d("RIDE_REC_EDIT", "Loop done")
            var outFileName = getFilePath(outFileRelvName)
            /*
            executeFFmpegCommand(ffmpeg, "-y -i \"${concatStr}\" -c copy -bsf:a aac_adtstoasc ${outFileName}")
            for (tsFileName in tsFileNames) {
                deleteMediaFile(tsFileName)
            }
            */

            var outFile = File(outFileName)
            var outputStream = outFile.outputStream()
            for (tsFileName in tsFileNames) {
                var tsFile = File(tsFileName)
                var inputStream = tsFile.inputStream()
                inputStream.copyTo(outputStream)
                inputStream.close()
                tsFile.delete()
            }
            outputStream.close()
        }
    }

    private suspend fun toMpeg2(ffmpeg: FFmpeg, inFileRelvName: String, outFileRelvName: String) {
        Log.d("RIDE_REC_EDIT", "MPEG2 INVOKED: " + inFileRelvName + " -- " + outFileRelvName)
        var inFileName = getFilePath(inFileRelvName)
        Log.d("RIDE_REC_EDIT", "IN: " + inFileName)
        var outFileName = getFilePath(outFileRelvName)
        Log.d("RIDE_REC_EDIT", "IN: " + outFileName)
        executeFFmpegCommand(ffmpeg, "-y -i ${inFileName} -c copy -bsf:v h264_mp4toannexb -f mpegts ${outFileName}")
    }

    private suspend fun getVideoDuration(ffmpeg: FFmpeg, inFileRelvName: String): String? {
        var fileName = getFilePath(inFileRelvName)
        var description = executeFFmpegCommand(ffmpeg, "-i ${fileName} -f null -")
        if (description != null) {
            var timeIdx = description.indexOf("Duration: ")
            if (timeIdx >= 0) {
                var timeStr = description.substring(timeIdx + "Duration: ".length)
                timeStr = timeStr.substring(0, timeStr.indexOf(','))
                return timeStr
            }
        }
        return null
    }

    private suspend fun addAudioToVideo(ffmpeg: FFmpeg, vidFileRelvName: String, audioRelvFileName: String, offset: String, outFileRelvName: String) {
        var vidFileName = getFilePath(vidFileRelvName)
        var outFileName = getFilePath(outFileRelvName)
        var audioFileName = getFilePath(audioRelvFileName)

        var combineVideoCommand = "-y -i ${vidFileName} -i ${audioFileName} -filter_complex amix -c:v copy -c:a aac -async 1 ${outFileName}"
        executeFFmpegCommand(ffmpeg, combineVideoCommand)
    }

    private suspend fun stabalizeVideo(ffmpeg: FFmpeg, vidFileRelvName: String, outFileRelvName: String) {
        var vidFileName = getFilePath(vidFileRelvName)
        var outFileName = getFilePath(outFileRelvName)
        executeFFmpegCommand(ffmpeg, "-y -i ${vidFileName} -vf deshake -preset ultrafast ${outFileName}")
    }

    private fun durationToStr(durationMillis: Long): String {
        var hour = durationMillis / (60 * 60 * 1000)
        var minute = (durationMillis / (60 * 1000)) % 60
        var second = (durationMillis / 1000) % 60
        var millis = durationMillis % 1000

        return "${iToStr(hour)}:${iToStr(minute)}:${iToStr(second)}.${iToStr(millis, 3)}"
    }

    private fun iToStr(i: Long, minStrSize: Int = 2): String {
        var numStr = i.toString()
        for (i in numStr.length until minStrSize) {
            numStr = "0$numStr"
        }
        return numStr
    }

    private fun deleteMediaFile(fileName: String) {
        var filePath = getFilePath(fileName)
        var file = File(filePath)
        file.delete()
    }
}
