package com.parkhero

import android.util.Log
import com.amazonaws.auth.AWSCredentials
import com.amazonaws.auth.AWSCredentialsProvider
import com.amazonaws.auth.AWSSessionCredentials

class AwsSessionCredentialProvider(var credentials: AWSSessionCredentials?) : AWSCredentialsProvider {
    override fun getCredentials(): AWSCredentials? {
        return credentials
    }

    fun getSessionCredentials(): AWSSessionCredentials? {
        return credentials
    }

    fun setCredentials(credentials: AwsSessionCredentials?) {
        this.credentials = credentials
    }

    override fun refresh() {
        Log.d("PARKHEADLESS", "REFRESH CREDS CALLED")
    }
}