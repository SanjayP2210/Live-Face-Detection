import { FaceDetection } from "@mediapipe/face_detection";
import { IconCircleXFilled } from "@tabler/icons-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
    Button, Card,
    CardBody, CardTitle, Modal, ModalBody
} from "reactstrap";
import "../App.css";
import ActionButtons from "./ActionButtons";
import { CameraError } from "./CameraError";
import CameraLoader from "./CameraLoader";
import DownloadButtons from "./DownloadButtons";
import CameraActionButtons from './CameraActionButtons';
import ImageDisplay from './ImageDisplay'

const FaceCapture = ({
    image,
    onImageChange,
    enableDownload = true,
    enableBase64Viewer = true,
    //   modalOpen,
    //   setModalOpen,
    title,
    isUserCamera = false,
    onCapture,
}) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const lastBoxRef = useRef(null);
    const autoTimerRef = useRef(null);
    const smoothBoxRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [faceDetected, setFaceDetected] = useState(true);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [webcamKey, setWebcamKey] = useState(0);
    const [isBackCamera, setIsBackCamera] = useState(!isUserCamera);
    const [fade, setFade] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [faceBox, setFaceBox] = useState(null);
    const [fullImage, setFullImage] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [showBase64, setShowBase64] = useState(false);

    // -----------------------------
    // DETECT CAMERAS (HD SAFE)
    // -----------------------------
    const detectAvailableCameras = async () => {
        try {
            setLoading(true);
            // Minimal permission request (prevents 640x480 lock)
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1920, height: 1080 },
            });
            tempStream.getTracks().forEach((track) => track.stop());
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            if (!videoInputs.length) {
                setCameraError("No camera devices found.");
                setLoading(false);
                return;
            }
            setVideoDevices(videoInputs);
            const preferred =
                videoInputs.find((d) => d.label.toLowerCase().includes("back")) ||
                videoInputs[0];
            setSelectedDeviceId(preferred.deviceId);
            setWebcamKey((prev) => prev + 1); // force clean mount
        } catch (err) {
            console.error(err);
            setCameraError("Unable to access camera.");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // SWITCH CAMERA (SMOOTH)
    // -----------------------------
    const handleSwitchCamera = () => {
        if (!videoDevices.length) return;
        setFade(true);
        setCameraReady(false);
        setShowScanner(false);
        setIsSwitching(true);
        const currentIndex = videoDevices.findIndex(
            (device) => device.deviceId === selectedDeviceId,
        );
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        setTimeout(() => {
            setSelectedDeviceId(videoDevices[nextIndex].deviceId);
            // 🔥 Force Webcam re-mount (VERY IMPORTANT)
            setWebcamKey((prev) => prev + 1);
            setFade(false);
            setIsBackCamera((prevState) => !prevState);
        }, 300);
    };

    const checkSharpness = (video) => {
        if (!video) return false;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
        );
        const data = imageData.data;

        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            sum += data[i];
        }
        const avg = sum / (data.length / 4);

        if (avg < 80) {
            return false;
        } else {
            return true;
        }
    };

    // -----------------------------
    // FACE DETECTION
    // -----------------------------
    useEffect(() => {
        if (!cameraReady) return;

        let animationId;
        let faceDetection;
        setTimeout(() => {
            setShowScanner(cameraReady);
        }, 200);
        const startDetection = async () => {
            const video = webcamRef.current?.video;
            if (!video) return;

            // ⭐ WAIT FOR VIDEO READY (CRITICAL FIX)
            if (video.readyState < 2) {
                animationId = requestAnimationFrame(startDetection);
                return;
            }

            faceDetection = new FaceDetection({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
            });

            faceDetection.setOptions({
                model: "short",
                minDetectionConfidence: 0.6,
            });

            faceDetection.onResults((results) => {
                const canvas = canvasRef.current;
                const video = webcamRef.current?.video;
                if (!canvas || !video) return;

                const ctx = canvas.getContext("2d");

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.detections?.length > 0) {
                const box = results.detections[0].boundingBox;
                lastBoxRef.current = box;
                setFaceDetected(true);

                const x = box.xCenter * canvas.width - (box.width * canvas.width) / 2;
                const y =
                    box.yCenter * canvas.height - (box.height * canvas.height) / 2;
                const w = box.width * canvas.width;
                const h = box.height * canvas.height;

                ctx.strokeStyle = "lime";
                ctx.lineWidth = 3;
                 const lerp = (start, end, t) => start + (end - start) * t;

                smoothBoxRef.current.x = lerp(smoothBoxRef.current.x, x, 0.2);
                smoothBoxRef.current.y = lerp(smoothBoxRef.current.y, y, 0.2);
                smoothBoxRef.current.w = lerp(smoothBoxRef.current.w, w, 0.2);
                smoothBoxRef.current.h = lerp(smoothBoxRef.current.h, h, 0.2);

                ctx.lineWidth = 2;
                ctx.strokeStyle = faceDetected ? "#00ff88" : "#00ff88";
                ctx.shadowColor = faceDetected ? "#00ff88" : "transparent";
                ctx.shadowBlur = faceDetected ? 40 : 0;

                ctx.strokeRect(
                    smoothBoxRef.current.x,
                    smoothBoxRef.current.y,
                    smoothBoxRef.current.w,
                    smoothBoxRef.current.h
                );
                // ctx.strokeRect(x, y, w, h);
                } else {
                setFaceDetected(false);
                lastBoxRef.current = null;
                }
            });

            const detectFrame = async () => {
                if (webcamRef.current?.video) {
                    await faceDetection.send({
                        image: webcamRef.current.video,
                    });
                }
                animationId = requestAnimationFrame(detectFrame);
            };

            detectFrame();
        };

        startDetection();

        return () => {
            cancelAnimationFrame(animationId);
            faceDetection?.close();
        };
    }, [cameraReady, webcamKey]);

    // -----------------------------
    // CAPTURE PHOTO
    // -----------------------------
    const capturePhoto = useCallback(async () => {
        if (!lastBoxRef.current) return;

        const video = webcamRef?.current?.video; // The video element (streaming)
        const box = lastBoxRef.current; // The bounding box (green box)

        // Get the dimensions of the canvas where the bounding box is drawn
        const canvas = canvasRef.current;
        const videoWidth = canvas.width;
        const videoHeight = canvas.height;

        // Apply zoom factor to the bounding box coordinates
        const scaleFactor = 2; // The scaling factor used in the detection (you can adjust this if needed)
        const x =
            box.xCenter * videoWidth - (box.width * videoWidth * scaleFactor) / 2;
        let y =
            box.yCenter * videoHeight - (box.height * videoHeight * scaleFactor) / 2;
        let w = box.width * videoWidth * scaleFactor;
        let h = box.height * videoHeight * scaleFactor;

        // Adjust the y-position to move the box upwards if needed
        const moveUpAmount = videoHeight * 0.1; // Move up by 10% of the canvas height
        y -= moveUpAmount;

        // Ensure that the box does not go out of bounds
        if (y < 0) y = 0;
        if (x + w > videoWidth) w = videoWidth - x;
        if (y + h > videoHeight) h = videoHeight - y;

        // Create a canvas to capture just the face region inside the green bounding box
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width = w; // The width of the face crop (bounding box width)
        faceCanvas.height = h; // The height of the face crop (bounding box height)
        const faceCtx = faceCanvas.getContext("2d");

        // If the mirrored flag is true, apply horizontal flip to the context
        if (!isBackCamera) {
            faceCtx.translate(w, 0); // Move the origin to the far right of the canvas
            faceCtx.scale(-1, 1); // Flip horizontally
        }

        // Draw the video feed portion inside the bounding box onto the face canvas
        faceCtx.drawImage(
            video,
            x,
            y,
            w,
            h, // Source: coordinates (x, y) and width and height (w, h) for cropping
            0,
            0,
            w,
            h, // Destination: draw to the faceCanvas starting at (0, 0)
        );
        // Set the captured face image as base64
        const faceImageBase64 = faceCanvas.toDataURL("image/png");
        setCapturedImage(faceImageBase64);
        setCropImage(faceImageBase64);
        setPreviewMode(true);
        
        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;

        setFullImage(screenshot);
    }, [webcamRef, isBackCamera]);

    /* ---------------- CAPTURE ---------------- */
    const capture = async () => {
        if (!webcamRef.current) return;

        // Flash animation
        const flash = document.createElement("div");
        flash.className = "capture-flash";
        document.querySelector(".camera-wrapper")?.appendChild(flash);

        setTimeout(() => flash.remove(), 300);

        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;

        setFullImage(screenshot);

        const cropped = await cropFace(screenshot);
        setCapturedImage(cropped);
        setCropImage(cropped);

        setPreviewMode(true);
    };

    const handleOk = () => {
        if (photo && onImageChange) {
            onImageChange(photo);
            setModalOpen(false);
        }
    };

    // -----------------------------
    // LIFECYCLE
    // -----------------------------
    useEffect(() => {
        if (modalOpen) detectAvailableCameras();
    }, [modalOpen]);

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleUserMedia = () => {
        setCameraReady(true);
        setLoading(false);
        setIsSwitching(false);
    };

    const handleUserMediaError = (error) => {
        console.error("Camera Error:", error);
        setCameraReady(false);
        setCameraError("Unable to access camera.");
        setLoading(false);
    };

    const handleRetake = () => {
        setPhoto(null);
        setCameraReady(false);
    };

    /* ---------------- AUTO ZOOM CROP ---------------- */
    const cropFace = (base64) => {
        const img = new Image();
        img.src = base64;

        return new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const padding = 80;

                const x =
                    faceBox.xCenter * img.width -
                    (faceBox.width * img.width) / 2 -
                    padding;
                const y =
                    faceBox.yCenter * img.height -
                    (faceBox.height * img.height) / 2 -
                    padding;

                const w = faceBox.width * img.width + padding * 2;
                const h = faceBox.height * img.height + padding * 2;

                // canvas.width = w;
                // canvas.height = h;
                const size = Math.max(w, h);
                canvas.width = size;
                canvas.height = size;

                ctx.drawImage(
                    img,
                    x,
                    y,
                    w,
                    h,
                    (size - w) / 2,
                    (size - h) / 2,
                    w,
                    h
                );

                // ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg"));
            };
        });
    };
    const convertFormat = (base64, type = "image/jpeg") => {
        return base64.replace(/^data:image\/[^;]+/, `data:${type}`);
    };

    /* ---------------- MODAL TOGGLE ---------------- */
    const toggle = () => {
        setModalOpen(!modalOpen);
        setFaceDetected(false);
        setPreviewMode(false);
        autoTimerRef.current = null;
        setCameraReady(false)
        setFullImage(null);
        setCropImage(null);
        // stopStream();
    };

    /* Download Helper */
    const downloadImage = (base64, filename) => {
        const link = document.createElement("a");
        link.href = base64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    /* Download JPG */
    const downloadJpg = (type = "cropped") => {
        const img = type === "full" ? fullImage : capturedImage;
        if (!img) return;

        downloadImage(convertFormat(img, "image/jpeg"), `${type}-face.jpg`);
    };

    /* Download PNG */
    const downloadPng = (type = "cropped") => {
        const img = type === "full" ? fullImage : capturedImage;
        if (!img) return;

        downloadImage(convertFormat(img, "image/png"), `${type}-face.png`);
    };
    const retake = () => {
        setPreviewMode(false);
        setCapturedImage(null);
        detectAvailableCameras();
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
    };

    const confirmImage = () => {
        setModalOpen(false);
        setPreviewMode(false);
        onCapture({
            cropImage,
            fullImage
        })
    };

    const removeCapturedImage = () => {
        setCapturedImage(null);
        setFullImage(null);
        setShowBase64(false);
    };

    const isCameraLoadig = !cameraError && (isSwitching || loading || !cameraReady);

    return (
        <>
            <div className="face-page">
                <Card className="face-card shadow-lg p-4 border-0">
                    <CardBody>
                        <h3>✨ Smart Face Capture ✨</h3>
                        {!capturedImage ? (
                            <Button className="start-btn" onClick={toggle}>
                                Start Capture
                            </Button>
                        ) : (
                            <>
                                <div className="saved-image-container">
                                    <div className="saved-image-wrapper">
                                        <img
                                            src={capturedImage}
                                            className="saved-face"
                                            alt="face"
                                        />
                                    </div>

                                    <button
                                        className="remove-btn-premium"
                                        onClick={removeCapturedImage}
                                        aria-label="Remove image"
                                    >
                                        <span className="close-icon"></span>
                                    </button>
                                </div>

                                <DownloadButtons
                                    {...{
                                        enableDownload,
                                        enableBase64Viewer,
                                        showBase64,
                                        setShowBase64,
                                        capturedImage,
                                        downloadPng,
                                        downloadJpg
                                    }}
                                />
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
            <Modal
                isOpen={modalOpen}
                toggle={handleCloseModal}
                // size={capturedImage ? "lg" : ""}
                fullscreen={!capturedImage}
                centered
                backdrop="static"
            >
                <ModalBody
                    className="camera-modal-body"
                    style={{
                        background: !photo ? "#000" : "#fff",
                    }}
                >
                    {/* 🔥 CLOSE BUTTON */}
                    <div className="camera-modal-close-btn">
                        <IconCircleXFilled
                            size={40}
                            color={photo ? "#666666b3" : "#fff"}
                            onClick={() => setModalOpen(false)}
                        />
                    </div>

                    {/* 🔥 LOADER */}
                    {isCameraLoadig && (
                        <div className="emirate-loader">
                            {" "}
                            <CameraLoader msg={isSwitching ? 'Switching' : 'Initializing'} />
                        </div>
                    )}
                    {cameraError && 
                    <div className="emirate-loader">
                            {" "}
                    <CameraError error={cameraError} />
                    </div>
                    }
                    {!previewMode && !cameraError && !photo && (
                        <div className="camera-video-container"
                            style={{
                                height: isCameraLoadig ? "0" : "100dvh",
                            }}
                        >
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
                            <canvas
                                ref={canvasRef}
                                className="camera-canvas"
                                style={{
                                    visibility: showScanner ? "visible" : "hidden",
                                    transform: !isBackCamera ? "scaleX(-1)" : "",
                                }}
                            />
                            {cameraReady && faceDetected && (
                                <div className="face-badge">
                                    Face Detected ✅
                                </div>
                            )}
                        </div>
                    )}
                    {capturedImage && (
                        <div style={{ padding: "50px" }}>
                            <ImageDisplay photo={capturedImage} mirrored={!isBackCamera} />
                        </div>
                    )}
                    {!loading && cameraReady && !cameraError && (
                        <CameraActionButtons
                            photo={capturedImage}
                            capturePhoto={capturePhoto}
                            faceDetected={faceDetected}
                            handleOk={confirmImage}
                            retakePhoto={retake}
                            handleSwitchCamera={handleSwitchCamera}
                        />
                    )}
                </ModalBody>
            </Modal>
        </>
    );
};
export default memo(FaceCapture);
