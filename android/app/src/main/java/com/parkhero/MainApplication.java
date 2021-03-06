package com.parkhero;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.github.yamill.orientation.OrientationPackage;
import com.rnimmersive.RNImmersivePackage;
import org.reactnative.camera.RNCameraPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.imagepicker.ImagePickerPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.horcrux.svg.SvgPackage;
import com.amazonaws.RNAWSCognitoPackage;
import co.apptailor.googlesignin.RNGoogleSigninPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.github.wuxudong.rncharts.MPAndroidChartPackage;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.ReadableNativeMap;
import com.corbt.keepawake.KCKeepAwakePackage;

import java.util.Arrays;
import java.util.List;
import com.parkhero.ParkHeadlessPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new OrientationPackage(),
            new RNImmersivePackage(),
            new RNCameraPackage(),
            new PickerPackage(),
            new ReactNativePushNotificationPackage(),
            new ImagePickerPackage(),
            new RNFetchBlobPackage(),
            new SvgPackage(),
            new RNAWSCognitoPackage(),
            new RNGoogleSigninPackage(),
            new RNGestureHandlerPackage(),
            new VectorIconsPackage(),
            new FastImageViewPackage(),
            new MPAndroidChartPackage(),
            new ParkHeadlessPackage(),
            new KCKeepAwakePackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    ReadableNativeArray.setUseNativeAccessor(true);
    ReadableNativeMap.setUseNativeAccessor(true);
  }
}
