import React, { useState, useEffect, useRef } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Camera } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Amplify, API, Auth, Analytics } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react-native";

import { toByteArray } from "react-native-quick-base64";

import {
  Predictions,
  AmazonAIPredictionsProvider,
} from "@aws-amplify/predictions";

import awsconfig from "./src/aws-exports";

Amplify.configure(awsconfig);
Analytics.disable();
Predictions.addPluggable(new AmazonAIPredictionsProvider());

const CameraComponent = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [imageUri, setImageUri] = useState(null);
  const cameraRef = useRef(null); // Ref for the camera component

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const resizeImage = async (uri, width, height) => {
    const resizedPhoto = await manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      { format: SaveFormat.JPEG, compress: 0.6, base64: true }
    );
    return resizedPhoto;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.7, base64: true };
      const photo = await cameraRef.current.takePictureAsync(options);

      const bytes = await toByteArray(photo.base64);
      console.log(photo.base64);

      try {
        await Predictions.identify({
          text: {
            source: { bytes },
          },
        });
      } catch (error) {
        console.log("AAA", error);
      }
    }
  };

  const refocusCamera = () => {
    // Refocus the camera by taking another picture
    takePicture();
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef} // Set the camera ref
        style={{ flex: 1 }}
        type={cameraType}
      >
        {/* Circular button for refocusing */}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={refocusCamera}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: "#E97E91",
            }}
          />
        </TouchableOpacity>
      </Camera>
      {imageUri && <Image source={{ uri: imageUri }} style={{ flex: 1 }} />}
    </View>
  );
};

export default withAuthenticator(CameraComponent);
