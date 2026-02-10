import React, { useRef, useState, useEffect, memo } from "react";
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

const CameraContainer = ({
  loading,
  cameraReady,
  onUserMedia,
  ref,
  onUserMediaError,
  faceDetected,
  isBackCamera,
  setFaceDetected,
  isModalOpen,
  canvasRef,
  lastBoxRef,
  selectedDeviceId
}) => {
  const [videoConstraints, setVideoConstraints] = useState({
    facingMode: isBackCamera ? "environment" : "user",
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
  });
  const [mirrored, setMirrored] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    // Function to set up the camera constraints
    const setupCamera = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setVideoConstraints({
          facingMode: isBackCamera ? "environment" : "user",
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        });
        setMirrored(!isBackCamera);
      });
    };

    setupCamera();
  }, [isBackCamera]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.stop();
      setCameraStream(null);
    }
  };

  useEffect(() => {
    stopCamera();
  }, [selectedDeviceId]);

  // Set up face detection when component mounts
  useEffect(() => {
    if (!ref.current) return;
    const faceDetectionInstance = new FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetectionInstance.setOptions({
      model: "short",
      minDetectionConfidence: 0.6,
    });

    faceDetectionInstance.onResults(onResults);

    if (ref.current && !cameraStream) {
      const camera = new Camera(ref.current.video, {
        onFrame: async () => {
          await faceDetectionInstance.send({
            image: ref?.current?.video,
          });
        },
        width: 640,
        height: 480,
      });

      camera.start();
      setCameraStream(camera);
    }

    return () => {
      stopCamera();
    };
  }, [videoConstraints, cameraStream, ref]);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = 640;
    canvas.height = 531;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.detections?.length > 0) {
      const box = results.detections[0].boundingBox;
      setFaceDetected(true);
      lastBoxRef.current = box;

      // Auto zoom based on face width
      const dynamicZoom = Math.min(Math.max(1.4 - box.width, 1), 1.8);
      setZoom(dynamicZoom);

      const scaleFactor = 2; // Adjust this value to control the size of the box

      // Draw bounding box around the detected face (with scaling)
      const x =
        box.xCenter * canvas.width -
        (box.width * canvas.width * scaleFactor) / 2;
      let y =
        box.yCenter * canvas.height -
        (box.height * canvas.height * scaleFactor) / 2;
      const moveUpAmount = canvas.height * 0.1;
      y -= moveUpAmount;

      const w = box.width * canvas.width * scaleFactor;
      const h = box.height * canvas.height * scaleFactor;

      if (y < 0) {
        y = 0;
      }

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    } else {
      setFaceDetected(false);
      lastBoxRef.current = null;
      setZoom(1);
    }
  };

  return (
    <div
      className={`${!loading && cameraReady ? "video-wrapper" : ''}`}
      style={{
        visibility: !loading && cameraReady ? "" : "hidden",
        position: "relative",
        zIndex: 9999,
      }}
    >
      <div >
        <Webcam
          ref={ref}
          muted
          {...{
            onUserMedia,
            onUserMediaError,
            // videoConstraints,
          }}
          videoConstraints={{
            ...videoConstraints,
             deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
          }}
          audio={false}
          screenshotFormat="image/png"
          style={{
            visibility: !loading && cameraReady ? "" : "hidden",
            transform: `scale(${zoom})`,
            transformOrigin: "center",
            transition: "transform 0.3s ease",
            zIndex: 10,
          }}
          mirrored={mirrored}
        />
        {!loading && cameraReady && (
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 15,
              transform: mirrored ? "scaleX(1)" : '',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default memo(CameraContainer);
