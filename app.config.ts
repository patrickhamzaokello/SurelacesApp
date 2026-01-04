import { ConfigContext, ExpoConfig } from "@expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.pkasemer.Surelaces.dev";
  }
  if (IS_PREVIEW) {
    return "com.pkasemer.Surelaces.preview";
  }
  return "com.pkasemer.Surelaces";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Surelaces Dev";
  }
  if (IS_PREVIEW) {
    return "Surelaces prev";
  }

  return "Surelaces";
};

export default ({config}: ConfigContext): ExpoConfig => ({
    ...config,
    name:  getAppName(),
    slug: "Surelaces",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/ios-dark.png",
    scheme: "surelaces",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      icon: {
        dark: "./assets/icons/ios-dark.png",
        light: "./assets/icons/ios-light.png",
        tinted: "./assets/icons/ios-tinted.png",
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        monochromeImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#6001D1"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: getUniqueIdentifier(),
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.1031020224121-trmppfnusv7kp4690idkku75jbh0os1h",
        },
      ],
      [
        "expo-notifications",
       {
          icon: "./assets/icons/notification_logo_black.png",
          color: "#6001D1",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: true
        }
      ],
      [
        "expo-splash-screen",
        {
          "image":"./assets/icons/splash-icon-dark.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#6001D1",
          "dark": {
            image: "./assets/icons/splash-icon-light.png",
            backgroundColor: "#6001D1",
          }
        }
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "ab50398e-f15f-44c1-b13e-e0b6359cb1b0"
      }
    },
    "owner": "pkasemer"
  });
