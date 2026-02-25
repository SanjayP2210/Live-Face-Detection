import { memo } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
    facingMode: "user"
};
const MobileCamera = ({
    webcamRef,
    facingMode,
    handleUserMedia,
    handleUserMediaError,
    isBackCamera,
    fade
}) => {
    return (
        <Webcam
            ref={webcamRef}
            audio={false}
            // screenshotQuality={1}
            videoConstraints={{
                ...videoConstraints,
                facingMode
            }}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            mirrored={!isBackCamera}
            className="camera-video-tag"
            style={{
                opacity: fade ? 0 : 1,
            }}
        />
    );
};
export default memo(MobileCamera);
