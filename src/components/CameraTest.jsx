import React, { useState } from "react";
import { useCallback } from "react";
import { useRef } from "react";
import Webcam from "react-webcam";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

export default function WebcamCapture() {
  const webcamRef = useRef(null);

  const [facingMode, setFacingMode] = useState(FACING_MODE_USER);

  let videoConstraints = {
    facingMode: facingMode,
    width: 270,
    height: 480
  };

  const handleClick = useCallback(() => {
    setFacingMode((prevState) =>
      prevState === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  }, []);

  console.log(facingMode + videoConstraints);

  return (
    <>
      <div className="webcam-container">
        <div className="webcam-img">
            <Webcam
              className="webcam"
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              screenshotQuality={1}
            />
        </div>
        <button onClick={handleClick}>Switch camera</button>
      </div>
    </>
  );
}
