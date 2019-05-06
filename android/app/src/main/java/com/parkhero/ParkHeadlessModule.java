package com.parkhero;

import android.widget.Toast;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Map;
import java.util.HashMap;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.AWSSessionCredentials;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferObserver;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferType;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility;
import com.amazonaws.services.s3.AmazonS3Client;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.File;
import java.util.List;
import java.net.URI;
import java.net.URISyntaxException;
import android.content.Intent;
import android.os.Build;


public class ParkHeadlessModule extends ReactContextBaseJavaModule {
  private ReactApplicationContext reactContext;
  private AwsSessionCredentialProvider credentialsProvider;
  private TransferUtility transferUtility;

  public ParkHeadlessModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "ParkHeadless";
  }

  @ReactMethod
  public void init() {
    this.credentialsProvider = new AwsSessionCredentialProvider(null);
    AmazonS3Client s3Client = new AmazonS3Client(this.credentialsProvider);
    this.transferUtility = TransferUtility.builder().context(this.reactContext.getApplicationContext()).s3Client(s3Client).defaultBucket("disneyapp3").build();
  }

  @ReactMethod
  public void updateCredentials(final String accessKey, final String secretKey, final String sessionToken) {
    this.credentialsProvider.setCredentials(new AwsSessionCredentials(sessionToken, accessKey, secretKey));

    List<TransferObserver> observers = this.transferUtility.getTransfersWithType(TransferType.UPLOAD);
    for (TransferObserver observer : observers) {
      // May have to check for state here
      Log.d("PARKHEADLESS", observer.getKey() + ": " + observer.getState().name() + ": " + observer.getAbsoluteFilePath());
      this.transferUtility.resume(observer.getId());
    }
  }

  @ReactMethod
  public void uploadFile(String key, String uri) {
    try {
      this.transferUtility.upload(key, new File(new URI(uri)));
    } catch (URISyntaxException e) {
        e.printStackTrace();
    }
  }

  @ReactMethod
  public String getUploads() {
    try {
      JSONObject uploads = new JSONObject();
      List<TransferObserver> transferObservers = transferUtility.getTransfersWithType(TransferType.UPLOAD);
      for (TransferObserver observer : transferObservers) {

        JSONObject fileProgress = new JSONObject();
        fileProgress.put("state", observer.getState().name());
        fileProgress.put("transferred", observer.getBytesTransferred());
        fileProgress.put("total", observer.getBytesTotal());
        fileProgress.put("path", observer.getAbsoluteFilePath());
        uploads.put(observer.getKey(), fileProgress);
      }
      return uploads.toString();
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return null;
  }

  @ReactMethod
  public void startRideRec() {
    Intent serviceIntent = new Intent(this.reactContext.getApplicationContext(), RideRecService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      this.reactContext.getApplicationContext().startForegroundService(serviceIntent);
    } else {
      this.reactContext.getApplicationContext().startService(serviceIntent);
    }
  }

  @ReactMethod
  public void uploadRideRec(String fileName, String userID, String vidUri, String startMillisStr) {
    String vidFileName = null;
    try {  
      vidFileName = new URI(vidUri).getPath();
    } catch (Exception e) { }
    Long startMillis = Long.parseLong(startMillisStr);
    Intent intent = new Intent();
    intent.setAction(RideRecService.UPLOAD_ACTION);
    intent.putExtra("vidPath", vidFileName);
    intent.putExtra("startMillis", startMillis);
    intent.putExtra("fileName", fileName);
    intent.putExtra("userID", userID);
    AWSSessionCredentials credentials = this.credentialsProvider.getSessionCredentials();
    if (credentials != null) {
      intent.putExtra("accessKey", credentials.getAWSAccessKeyId());
      intent.putExtra("secretKey", credentials.getAWSSecretKey());
      intent.putExtra("sessionToken", credentials.getSessionToken());
    }
    this.reactContext.getApplicationContext().sendBroadcast(intent);
  }
}