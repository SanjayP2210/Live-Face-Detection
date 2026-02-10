import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import * as FaceDetection from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

export default function WebcamCapture() {
  const webcamRef = useRef(null);
  const faceDetectorRef = useRef(null);
const canvasRef = useRef(null);
  const [facingMode, setFacingMode] = useState(FACING_MODE_USER);
  const [isFaceCentered, setIsFaceCentered] = useState(false);

  const videoConstraints = {
    facingMode,
    width: 480,
    height: 640
  };

  /* ---------------- SWITCH CAMERA ---------------- */
  const handleClick = useCallback(() => {
    setFacingMode(prev =>
      prev === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  }, []);

  /* ---------------- APPLY AUTO FOCUS ---------------- */
  const applyAutoFocus = async () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const stream = video.srcObject;
    const track = stream?.getVideoTracks()[0];

    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [
          { focusMode: "continuous" }
        ]
      });
      console.log("Auto focus applied");
    } catch (err) {
      console.log("Focus not supported:", err);
    }
  };

  /* ---------------- FACE DETECTION INIT ---------------- */
  useEffect(() => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const faceDetection = new FaceDetection.FaceDetection({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.7
    });

    faceDetection.onResults(results => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  const video = webcamRef.current.video;

  if (!canvas || !video) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.detections.length) {
    setIsFaceCentered(false);
    return;
  }

  const detection = results.detections[0];
  const bbox = detection.boundingBox;

  const x = bbox.xCenter * canvas.width - (bbox.width * canvas.width) / 2;
  const y = bbox.yCenter * canvas.height - (bbox.height * canvas.height) / 2;
  const width = bbox.width * canvas.width;
  const height = bbox.height * canvas.height;

  // 🔥 DRAW GREEN BOX
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "lime";
  ctx.stroke();

  // 🎯 CENTER CHECK
  const isCentered =
    bbox.xCenter > 0.4 &&
    bbox.xCenter < 0.6 &&
    bbox.yCenter > 0.4 &&
    bbox.yCenter < 0.6;

  setIsFaceCentered(isCentered);
});

    const camera = new Camera(video, {
      onFrame: async () => {
        await faceDetection.send({ image: video });
      },
      width: 480,
      height: 640
    });

    camera.start();

    faceDetectorRef.current = faceDetection;

    return () => {
      camera.stop();
      faceDetection.close();
    };
  }, [facingMode]);

  return (
    <div className="webcam-container">
      <div className="webcam-img">
       <div className="camera-wrapper">
  <Webcam
    className="webcam"
    audio={false}
    ref={webcamRef}
    screenshotFormat="image/jpeg"
    videoConstraints={videoConstraints}
  />

  <canvas ref={canvasRef} className="overlay" />
</div>
      </div>

      <button onClick={handleClick}>Switch camera</button>

      {isFaceCentered ? (
        <p style={{ color: "green" }}>Face Centered ✔ Autofocusing...</p>
      ) : (
        <p style={{ color: "orange" }}>Align your face in center</p>
      )}
    </div>
  );
}