import React, { useRef, useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Card,
    CardBody,
    CardTitle
} from "reactstrap";
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import "../App.css";
import ActionButtons from "./ActionButtons";
import DownloadButtons from "./DownloadButtons";
import CameraLoader from './CameraLoader';
import { CameraError } from './CameraError';

const FaceCapture = ({
    enableDownload = true,
    enableBase64Viewer = true,
    onCapture
}) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const autoTimerRef = useRef(null);
    const lastBoxRef = useRef(null);
    const smoothBoxRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const [modal, setModal] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceBox, setFaceBox] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [fullImage, setFullImage] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [showBase64, setShowBase64] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isBackCamera, setIsBackCamera] = useState(false);
    const [loadingCamera, setLoadingCamera] = useState(false);
    const mediaPipeCameraRef = useRef(null);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [stream, setStream] = useState(null);
    const faceDetectionRef = useRef(null);
    const [webcamKey, setWebcamKey] = useState(0);
    const [fade, setFade] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    // -----------------------------
    // FACE DETECTION
    // -----------------------------
    useEffect(() => {
        if (!cameraReady) return;

        // let animationId;
        // let faceDetection;
        setTimeout(() => {
            setShowScanner(cameraReady);
        }, 200);
        // const startDetection = async () => {
        //   const video = webcamRef.current?.video;
        //   if (!video) return;

        //   // ⭐ WAIT FOR VIDEO READY (CRITICAL FIX)
        //   if (video.readyState < 2) {
        //     animationId = requestAnimationFrame(startDetection);
        //     return;
        //   }

        //   faceDetection = new FaceDetection({
        //     locateFile: (file) =>
        //       `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        //   });

        //   faceDetection.setOptions({
        //     model: "short",
        //     minDetectionConfidence: 0.6,
        //   });

        //   faceDetection.onResults((results) => {
        //     const canvas = canvasRef.current;
        //     const video = webcamRef.current?.video;
        //     if (!canvas || !video) return;

        //     const ctx = canvas.getContext("2d");

        //     canvas.width = video.videoWidth;
        //     canvas.height = video.videoHeight;

        //     ctx.clearRect(0, 0, canvas.width, canvas.height);

        //     if (results.detections?.length > 0) {
        //       const box = results.detections[0].boundingBox;
        //       lastBoxRef.current = box;
        //       setFaceDetected(true);

        //       const x = box.xCenter * canvas.width - (box.width * canvas.width) / 2;
        //       const y =
        //         box.yCenter * canvas.height - (box.height * canvas.height) / 2;
        //       const w = box.width * canvas.width;
        //       const h = box.height * canvas.height;

        //       ctx.strokeStyle = "lime";
        //       ctx.lineWidth = 3;
        //       ctx.strokeRect(x, y, w, h);
        //     } else {
        //       setFaceDetected(false);
        //       lastBoxRef.current = null;
        //     }
        //   });

        //   const detectFrame = async () => {
        //     if (webcamRef.current?.video) {
        //       await faceDetection.send({
        //         image: webcamRef.current.video,
        //       });
        //     }
        //     animationId = requestAnimationFrame(detectFrame);
        //   };

        //   detectFrame();
        // };

        // startDetection();

        loadFaceAPI();

        return () => {
            //   cancelAnimationFrame(animationId);
            //   faceDetection?.close();
        };
    }, [cameraReady, webcamKey]);

    // Function to initialize the camera
    // -----------------------------
    // DETECT CAMERAS (HD SAFE)
    // -----------------------------
    const detectAvailableCameras = async () => {
        try {
            setLoadingCamera(true);
            // Minimal permission request (prevents 640x480 lock)
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1920, height: 1080 },
            });
            tempStream.getTracks().forEach((track) => track.stop());
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            if (!videoInputs.length) {
                setCameraError("No camera devices found.");
                setLoadingCamera(false);
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
            setLoadingCamera(false);
        }
    };

    // useEffect(() => {
    //     const checkScreen = () => {
    //         setIsMobile(window.innerWidth <= 768);
    //     };

    //     checkScreen();
    //     window.addEventListener("resize", checkScreen);

    //     return () => window.removeEventListener("resize", checkScreen);
    // }, []);

    const loadFaceAPI = async () => {
        if (!webcamRef.current?.video) return;

        if (!faceDetectionRef.current) {
            faceDetectionRef.current = new FaceDetection({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
            });

            faceDetectionRef.current.setOptions({
                model: "short",
                minDetectionConfidence: 0.7
            });

            faceDetectionRef.current.onResults(onResult);
        }

        const camera = new Camera(webcamRef.current.video, {
            onFrame: async () => {
                await faceDetectionRef.current.send({
                    image: webcamRef.current.video
                });
            },
            width: 480,
            height: 360
        });

        mediaPipeCameraRef.current = camera;
        await camera.start();
    };

    const stopStream = () => {
        // 🔥 Stop MediaPipe camera
        if (mediaPipeCameraRef.current) {
            mediaPipeCameraRef.current.stop();
            mediaPipeCameraRef.current = null;
        }

        // Stop video tracks
        if (webcamRef.current) {
            const video = webcamRef.current.video;

            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        }

        setStream(null);
    };

    useEffect(() => {
        if (capturedImage) return;
        if (modal) {
            detectAvailableCameras();
            // toggleCamera();
        } else {
            stopStream();
        }
        return () => {
            stopStream();
        };
    }, [modal]);

    /* ---------------- FACE DETECTION ---------------- */
    // useEffect(() => {
    //     if (!stream || !webcamRef.current) return;

    //     const video = webcamRef.current.video;

    //     video.srcObject = stream;
    //     video.onloadedmetadata = () => {
    //         video.play();
    //         loadFaceAPI();
    //     };
    // }, [stream]);

    const onResult = (results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const video = webcamRef.current?.video;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!canvas || !video) return;
        if (results.detections.length > 0) {
            const box = results.detections[0].boundingBox;

            let x =
                box.xCenter * canvas.width - (box.width * canvas.width) / 2;
            let y =
                box.yCenter * canvas.height - (box.height * canvas.height) / 2;
            let w = box.width * canvas.width;
            let h = box.height * canvas.height;
            const paddingX = isMobile ? 0.9 : 0;
            const paddingY = isMobile ? 0.45 : 0;
            // Add padding
            const padW = w * paddingX;
            const padH = h * paddingY;

            x -= padW / 2;
            y -= padH / 2;
            w += padW;
            h += padH;

            // Keep inside canvas bounds
            x = Math.max(0, x);
            y = Math.max(0, y);
            w = Math.min(canvas.width - x, w);
            h = Math.min(canvas.height - y, h);

            const faceArea = w * h;
            const minFaceArea = 25000;

            setFaceDetected(true);
            setFaceBox(box);

            // Draw yellow box initially
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#00ff88";
            // Smooth animation
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

            const sharp = checkSharpness(video);

            // Stability check
            if (lastBoxRef.current) {
                const dx = Math.abs(lastBoxRef.current.x - x);
                const dy = Math.abs(lastBoxRef.current.y - y);
                const isStable = dx < 10 && dy < 10;

                if (isStable && sharp && faceArea > minFaceArea) {
                    // Turn green when stable
                    ctx.strokeStyle = "#00ff88";
                    // Smooth animation
                    const lerp = (start, end, t) => start + (end - start) * t;

                    smoothBoxRef.current.x = lerp(smoothBoxRef.current.x, x, 0.2);
                    smoothBoxRef.current.y = lerp(smoothBoxRef.current.y, y, 0.2);
                    smoothBoxRef.current.w = lerp(smoothBoxRef.current.w, w, 0.2);
                    smoothBoxRef.current.h = lerp(smoothBoxRef.current.h, h, 0.2);

                    ctx.lineWidth = 3;
                    ctx.strokeStyle = faceDetected ? "#00ff88" : "#ffcc00";
                    ctx.shadowColor = faceDetected ? "#00ff88" : "transparent";
                    ctx.shadowBlur = faceDetected ? 20 : 0;

                    ctx.strokeRect(
                        smoothBoxRef.current.x,
                        smoothBoxRef.current.y,
                        smoothBoxRef.current.w,
                        smoothBoxRef.current.h
                    );

                    if (!autoTimerRef.current) {
                        autoTimerRef.current = setTimeout(() => {
                            capture();
                        }, 2000);
                    }
                } else {
                    clearTimeout(autoTimerRef.current);
                    autoTimerRef.current = null;
                }
            }

            lastBoxRef.current = { x, y };
        } else {
            setFaceDetected(false);
            clearTimeout(autoTimerRef.current);
            autoTimerRef.current = null;
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
            setIsSwitching(false);
            setIsBackCamera((prevState) => !prevState);
        }, 300);
    };


    const onUserMedia = async () => {
        console.log("Camera ready");

        // Stop old mediapipe camera
        if (mediaPipeCameraRef.current) {
            mediaPipeCameraRef.current.stop();
            mediaPipeCameraRef.current = null;
        }

        await loadFaceAPI();
        setCameraReady(true);
        setLoadingCamera(false);
        alert('User Medaia Call');
    };

    const onUserMediaError = (error) => {
        console.error("Camera error:", error);
        setLoadingCamera(false);
        setCameraReady(false);
        setCameraError("Unable to access camera.");
    };

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

    /* ---------------- MODAL TOGGLE ---------------- */
    const toggle = () => {
        setModal(!modal);
        setFaceDetected(false);
        setPreviewMode(false);
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
        setCameraReady(false)
        setFullImage(null);
        setCropImage(null);
        stopStream();
    };

    /* ---------------- SHARPNESS CHECK ---------------- */
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
        setModal(false);
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

    const isCameraLoadig = isSwitching || loadingCamera || !cameraReady;


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
                isOpen={modal}
                fullscreen={!capturedImage}
                toggle={toggle}>
                {/* <ModalHeader toggle={toggle}>
                    {previewMode ? "Preview" : "Capture Your Face"}
                </ModalHeader> */}

                <ModalBody className="camera-modal-body"
                    style={{
                        background: !capturedImage ? "#000" : "#fff",
                    }}>
                    <div
                        className="camera-modal-card-title"
                    >
                        <CardTitle> {previewMode ? "Preview" : "Capture Your Face"}</CardTitle>
                    </div>
                    {/* <div> */}
                        {/* 🔥 CLOSE BUTTON */}
                        <div className="camera-modal-close-btn">
                            <span
                                size={40}
                                color={capturedImage ? "#666666b3" : "#fff"}
                                onClick={toggle}
                            >
                                X
                            </span>
                        </div>

                        {/* 🔥 LOADER */}
                        {isSwitching ||
                            (isCameraLoadig && (
                                <div className="emirate-loader">
                                    {" "}
                                    <CameraLoader />
                                </div>
                            ))}
                        {cameraError && <CameraError error={cameraError} />}
                        {!loadingCamera && !previewMode ? (
                                <div className="camera-video-container"
                                    style={{
                                        height: isCameraLoadig ? "0" : "100dvh",
                                    }}
                                >
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotQuality={1}
                                        videoConstraints={{
                                            deviceId: selectedDeviceId
                                                ? { exact: selectedDeviceId }
                                                : undefined,

                                            width: { ideal: 1920 },
                                            height: { ideal: 1080 },
                                            frameRate: { ideal: 30 },
                                        }}
                                        onUserMedia={onUserMedia}
                                        onUserMediaError={onUserMediaError}
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
                                    {faceDetected && (
                                        <div className="face-badge">
                                            Face Detected ✅
                                        </div>
                                    )}
                                </div>
                        ) : (
                            <img
                                src={capturedImage}
                                alt="Preview"
                                className="preview-image"
                                style={{
                                    width: "100%",
                                    borderRadius: 15
                                }}
                            />
                        )}
                    {/* </div> */}
                </ModalBody>

                <ModalFooter className="justify-content-center">
                    <ActionButtons
                        {...{
                            previewMode,
                            retake,
                            confirmImage,
                            toggle,
                            faceDetected,
                            capture, isBackCamera,
                            loadingCamera,
                            switchCamera: handleSwitchCamera
                        }}
                    />
                </ModalFooter>
            </Modal>
        </>
    );
};

export default FaceCapture;