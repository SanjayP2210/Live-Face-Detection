import React from 'react'
import Webcam from 'react-webcam'

const DesktopCamera = ({
    webcamKey,
    webcamRef,
    isBackCamera,
    selectedDeviceId,
    handleUserMedia,
    handleUserMediaError,
    fade
}) => {
    return (
        <Webcam
            key={webcamKey}
            ref={webcamRef}
            audio={false}
            screenshotQuality={1}
            videoConstraints={{
                facingMode: isBackCamera ? "environment" : "user",
                deviceId: selectedDeviceId
                    ? { exact: selectedDeviceId }
                    : undefined,

                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
            }}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            mirrored={!isBackCamera}
            className="camera-video-tag"
            style={{
                opacity: fade ? 0 : 1,
            }}
        />
    )
}

export default DesktopCamera