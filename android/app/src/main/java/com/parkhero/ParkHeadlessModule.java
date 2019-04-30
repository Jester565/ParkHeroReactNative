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

public class ParkHeadlessModule extends ReactContextBaseJavaModule {
  class ReactCredentials implements AWSSessionCredentials {
    private String sessionToken;
    private String accessKey;
    private String secretKey;

    public ReactCredentials(String sessionToken, String accessKey, String secretKey) {
      this.sessionToken = sessionToken;
      this.accessKey = accessKey;
      this.secretKey = secretKey;
    }

    @Override
    public String getSessionToken() {
      return sessionToken;
    }

    @Override
    public String getAWSAccessKeyId() {
      return accessKey;
    }

    @Override
    public String getAWSSecretKey() {
      return secretKey;
    }
  }

  class ReactCredentialsProvider implements AWSCredentialsProvider {
    ReactCredentials credentials;

    public ReactCredentialsProvider(ReactCredentials credentials) {
      this.credentials = credentials;
    }

    @Override
    public AWSCredentials getCredentials() {
      return credentials;
    }

    public void setCredentials(ReactCredentials credentials) {
      this.credentials = credentials;
    }

    @Override
    public void refresh() {
      Log.d("PARKHEADLESS", "REFRESH CREDS CALLED");
    }
  }

  private ReactApplicationContext reactContext;
  private ReactCredentialsProvider credentialsProvider;
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
    this.credentialsProvider = new ReactCredentialsProvider(null);
    AmazonS3Client s3Client = new AmazonS3Client(this.credentialsProvider);
    this.transferUtility = TransferUtility.builder().context(this.reactContext.getApplicationContext()).s3Client(s3Client).defaultBucket("disneyapp3").build();
  }

  @ReactMethod
  public void updateCredentials(final String accessKey, final String secretKey, final String sessionToken) {
    this.credentialsProvider.setCredentials(new ReactCredentials(sessionToken, accessKey, secretKey));

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
}