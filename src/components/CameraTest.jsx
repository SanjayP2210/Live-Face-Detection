import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as FaceDetection from "@mediapipe/face_detection";

export default function WebcamCapture() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [isFaceCentered, setIsFaceCentered] = useState(false);

  /* ---------------- GET CAMERAS ---------------- */
  useEffect(() => {
    const getDevices = async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput"
      );

      setDevices(videoDevices);
    };

    getDevices();
  }, []);

  const deviceId =
    devices.length > 0
      ? devices[currentDeviceIndex]?.deviceId
      : null;

  const videoConstraints = {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    width: 480,
    height: 640,
  };

  /* ---------------- SWITCH CAMERA ---------------- */
  const handleSwitchCamera = () => {
    if (devices.length <= 1) return;

    setCurrentDeviceIndex((prevIndex) =>
      prevIndex + 1 >= devices.length ? 0 : prevIndex + 1
    );
  };

  /* ---------------- FACE DETECTION ---------------- */
  useEffect(() => {
  if (!deviceId) return;

  let animationFrameId;
  let faceDetection;

  const startDetection = async () => {
    const video = webcamRef.current?.video;

    if (!video) return;

    // Wait until video is ready
    await new Promise((resolve) => {
      if (video.readyState === 4) {
        resolve();
      } else {
        video.onloadeddata = () => resolve();
      }
    });

    faceDetection = new FaceDetection.FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.7,
    });

    faceDetection.onResults((results) => {
      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.detections.length) {
        setIsFaceCentered(false);
        return;
      }

      const bbox = results.detections[0].boundingBox;

      const x =
        bbox.xCenter * canvas.width -
        (bbox.width * canvas.width) / 2;
      const y =
        bbox.yCenter * canvas.height -
        (bbox.height * canvas.height) / 2;

      const width = bbox.width * canvas.width;
      const height = bbox.height * canvas.height;

      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "lime";
      ctx.stroke();

      const isCentered =
        bbox.xCenter > 0.4 &&
        bbox.xCenter < 0.6 &&
        bbox.yCenter > 0.4 &&
        bbox.yCenter < 0.6;

      setIsFaceCentered(isCentered);
    });

    const detect = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        await faceDetection.send({
          image: webcamRef.current.video,
        });
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    detect();
  };

  startDetection();

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (faceDetection) {
      faceDetection.close();
    }
  };
}, [deviceId]);

  return (
    <div className="camera-container">
      <div className="camera-wrapper">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam"
          onUserMedia={() => console.log("Camera ready")}
        />
        <canvas ref={canvasRef} className="overlay" />
      </div>

      <button className="switch-btn" onClick={handleSwitchCamera}>
        🔄 Switch Camera
      </button>

      {isFaceCentered ? (
        <p style={{ color: "lime" }}>Face Centered ✔</p>
      ) : (
        <p style={{ color: "orange" }}>Align face in center</p>
      )}
    </div>
  );
}