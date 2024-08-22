// File generated by FlutterFire CLI.
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Example:
/// ```dart
/// import 'firebase_options.dart';
/// // ...
/// await Firebase.initializeApp(
///   options: DefaultFirebaseOptions.currentPlatform,
/// );
/// ```
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCepLgvcQS7AuYe1lomz0QKChExsmWt674',
    appId: '1:347067709871:web:882304f5a8b7fe97cad75a',
    messagingSenderId: '347067709871',
    projectId: 'travel-a86f8',
    authDomain: 'travel-a86f8.firebaseapp.com',
    storageBucket: 'travel-a86f8.appspot.com',
    measurementId: 'G-LVN6R8168T',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCONin0Wz73H3PBFRsSQZitzSLtSj9lZgQ',
    appId: '1:347067709871:android:570b713012126179cad75a',
    messagingSenderId: '347067709871',
    projectId: 'travel-a86f8',
    storageBucket: 'travel-a86f8.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDtIMs1t1YNuvWw839EbikAHsYa4cURKgc',
    appId: '1:347067709871:ios:44a8a1be4b88ac5dcad75a',
    messagingSenderId: '347067709871',
    projectId: 'travel-a86f8',
    storageBucket: 'travel-a86f8.appspot.com',
    iosBundleId: 'com.example.travel',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDtIMs1t1YNuvWw839EbikAHsYa4cURKgc',
    appId: '1:347067709871:ios:44a8a1be4b88ac5dcad75a',
    messagingSenderId: '347067709871',
    projectId: 'travel-a86f8',
    storageBucket: 'travel-a86f8.appspot.com',
    iosBundleId: 'com.example.travel',
  );
}
