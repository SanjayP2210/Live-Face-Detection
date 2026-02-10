import React from 'react'
import { Button } from 'reactstrap'

const ActionButtons = ({
    previewMode,
    retake,
    confirmImage,
    toggle,
    faceDetected,
    capture, isBackCamera,
    loadingCamera, videoDevices,
    switchCamera
}) => {
    return (
        <> {previewMode ? (
            <>
                <Button color="warning" onClick={retake}>
                    Retake
                </Button>
                <Button color="success" onClick={confirmImage}>
                    OK
                </Button>
            </>
        ) : (
            <>
                <Button color="secondary" onClick={toggle}>
                    Close
                </Button>

                {faceDetected && (
                    <>
                        <Button
                            color="info"
                            onClick={switchCamera}
                        // disabled={videoDevices.length < 2 || loadingCamera}
                        >
                            Switch Camera
                            {/* {loadingCamera
                                ? "Switching..."
                                : isBackCamera
                                    ? "Use Front Camera"
                                    : "Use Back Camera"} */}
                        </Button>

                        <Button color="primary" onClick={capture}>
                            Capture
                        </Button>
                    </>
                )}
            </>
        )}</>
    )
}

export default ActionButtons
