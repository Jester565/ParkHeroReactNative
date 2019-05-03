package com.parkhero

import com.amazonaws.auth.AWSSessionCredentials

class AwsSessionCredentials(
    private val sessionToken: String?,
    private val accessKey: String?,
    private val secretKey: String?
) : AWSSessionCredentials {

    override fun getSessionToken(): String? {
        return sessionToken
    }

    override fun getAWSAccessKeyId(): String? {
        return accessKey
    }

    override fun getAWSSecretKey(): String? {
        return secretKey
    }
}