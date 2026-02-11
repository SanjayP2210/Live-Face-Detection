import React, { useRef, useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Card,
    CardBody
} from "reactstrap";
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import "../App.css";
import ActionButtons from "./ActionButtons";
import DownloadButtons from "./DownloadButtons";
const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

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
    const [facingMode, setFacingMode] = useState(FACING_MODE_USER);
    const mediaPipeCameraRef = useRef(null);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [stream, setStream] = useState(null);
    const [videoConstraints, setVideoConstraints] = useState({
        facingMode: "environment",
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    });

    function getVideoDevices(callback) {
        navigator.mediaDevices
            .enumerateDevices()
            .then(function (deviceInfos) {
                const videoDevices = deviceInfos.filter(
                    (device) => device.kind === "videoinput",
                );
                if (videoDevices.length === 0) {
                    console.log("No video input devices found.");
                    callback(null); // No video devices found
                } else {
                    callback(videoDevices); // Pass video devices list to callback
                }
            })
            .catch(function (error) {
                console.error("Error enumerating devices:", error);
                callback(null); // Error occurred while enumerating devices
            });
    }

    // Function to initialize the camera
    const cameraInit = async (cameraId, callback) => {
        // if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        //     console.error("getUserMedia not available");
        //     callback("getUserMedia not available", null);
        //     return;
        // }

        // const devices = await navigator.mediaDevices.enumerateDevices();
        // const selectedDevice = devices.find(
        //     (device) => device.deviceId === cameraId
        // );

        // const videoConstraints = {
        //     video: {
        //         deviceId: { exact: cameraId },
        //     },
        // };

        // navigator.mediaDevices
        //     .getUserMedia(videoConstraints)
        //     .then(function (stream) {
        //         console.log('stream',stream)
        //         // Set the stream to the webcamRef
        //         if (webcamRef.current) {
        //             console.log("webcamRef.current.video", webcamRef.current.video);
        //             webcamRef.current.video.srcObject = stream;
        //             callback(null, stream);
        //         }
        //         setStream(stream);
        //     })
        //     .catch(function (err) {
        //         console.error("Failed to access camera:", err);
        //         callback(err, null); // Error occurred
        //     });
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera not supported in this browser");
                return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const selectedDevice = devices.find(
                (device) => device.deviceId === cameraId
            );

            const videoConstraints = {
                video: {
                    deviceId: { exact: cameraId },
                },
            };

            const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);

            if (webcamRef.current) {
                webcamRef.current.video.srcObject = stream;
            }

            setStream(stream);

            // 🔥 Detect Front or Back
            let cameraType = "Camera";

            if (selectedDevice?.label.toLowerCase().includes("front")) {
                cameraType = "Front Camera";
            } else if (
                selectedDevice?.label.toLowerCase().includes("back") ||
                selectedDevice?.label.toLowerCase().includes("rear") ||
                selectedDevice?.label.toLowerCase().includes("environment")
            ) {
                cameraType = "Back Camera";
            }

            alert(`${cameraType} started successfully`);

            callback(null, stream);

        } catch (err) {
            console.error("Failed to access camera:", err);
            alert("Failed to start camera");
            callback(err, null);
        }
    };

    const detectAvailableCameras = async () => {
        try {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then(function (permissionStream) {
                    permissionStream.getTracks().forEach((track) => track.stop());
                    console.log("Initial permission granted.");

                    // Get list of video devices
                    getVideoDevices(function (videoDevices) {
                        if (!videoDevices) {
                            console.log("No video input devices found.");
                            setLoadingCamera(false);
                            return;
                        }

                        // Choose the default camera
                        let defaultDevice =
                            videoDevices.find((device) =>
                                /environment/i.test(device.label),
                            ) || videoDevices[0];

                        if (!defaultDevice) {
                            console.log("No default camera found.");
                            return;
                        }
                        console.log("videoDevices", videoDevices);
                        // Set available video devices
                        setVideoDevices(videoDevices);
                        setVideoConstraints({
                            facingMode: "environment",
                            deviceId: defaultDevice.deviceId
                                ? { exact: defaultDevice.deviceId }
                                : undefined,
                        });

                        // Set default camera to first available device
                        setSelectedDeviceId(defaultDevice.deviceId);
                        setLoadingCamera(false);

                        // Initialize the camera with the selected device ID
                        cameraInit(defaultDevice.deviceId, (err) => {
                            if (err) {
                                console.error("Failed to initialize camera:", err);
                            } else {
                                console.log("Camera initialized successfully");
                            }
                        });
                    });
                })
                .catch(function (permError) {
                    console.error("Error detecting cameras:", permError);
                    setLoadingCamera(false);
                });
        } catch (err) {
            console.error("Error detecting cameras:", err);
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

    // useEffect(() => {
    //     if (!modal) return;

    //     const getDevices = async () => {
    //         const devices = await navigator.mediaDevices.enumerateDevices();
    //         const cams = devices.filter(d => d.kind === "videoinput");
    //         setVideoDevices(cams);
    //     };

    //     getDevices();
    // }, [modal]);

    // const applyAutoFocus = async () => {
    //     const stream = webcamRef.current?.stream;
    //     if (!stream) return;

    //     const track = stream.getVideoTracks()[0];
    //     if (!track) return;

    //     const capabilities = track.getCapabilities();

    //     if (capabilities.focusMode) {
    //         try {
    //             await track.applyConstraints({
    //                 advanced: [{ focusMode: "continuous" }]
    //             });
    //         } catch (e) {
    //             console.log("Focus mode not supported");
    //         }
    //     }

    //     // Trigger focus refresh
    //     try {
    //         await track.applyConstraints({
    //             advanced: [{ focusDistance: 0 }]
    //         });
    //     } catch (e) { }
    // };

    const loadFaceAPI = async () => {
        const faceDetection = new FaceDetection({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        });

        faceDetection.setOptions({
            model: "short",
            minDetectionConfidence: 0.7
        });

        await faceDetection.onResults(onResult);

        const startCamera = async () => {
            if (!webcamRef.current?.video) return;

            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    await faceDetection.send({
                        image: webcamRef.current.video
                    });
                },
                width: 480,
                height: 360
            });

            mediaPipeCameraRef.current = camera;
            await camera.start();
            setLoadingCamera(false);
        };

        startCamera();
    }

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

    const stopStream = () => {

        // Stop webcam stream
        if (webcamRef.current) {
            const video = webcamRef.current.video;

            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop();
                });

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
    useEffect(() => {
        if (!stream || !webcamRef.current) return;

        const video = webcamRef.current?.video;
        console.log("selectedDeviceId", selectedDeviceId);
        video.onloadedmetadata = () => {
            video.play();
        };
    }, [stream, selectedDeviceId, isBackCamera]);

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

    const switchCamera = async () => {
        // Find the current camera
        setLoadingCamera(true);
        stopStream();
        // setCameraReady(false);

        setTimeout(() => {
            const currentIndex = videoDevices.findIndex(
                (device) => device.deviceId === selectedDeviceId,
            );

            if (currentIndex !== -1) {
                const nextIndex = (currentIndex + 1) % videoDevices.length;
                cameraInit(videoDevices[nextIndex].deviceId, (err, stream) => {
                    if (err) {
                        console.error("Failed to initialize camera:", err);
                    } else {
                        console.log("Camera initialized successfully");
                        setLoadingCamera(false);
                    }
                });
                setSelectedDeviceId(videoDevices[nextIndex].deviceId);
                setLoadingCamera(false);
            }
            setIsBackCamera((prevState) => !prevState);
        }, 2000);
    };

    const onUserMedia = () => {
        setLoadingCamera(false);
        loadFaceAPI();
        alert('User Medaia Call');
    };

    const onUserMediaError = (error) => {
        console.error("Camera error:", error);
        setLoadingCamera(false);
    };

    return (
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

            <Modal isOpen={modal} fullscreen={isMobile} className="custom-camera-modal" toggle={toggle} centered size="lg">
                <ModalHeader toggle={toggle}>
                    {previewMode ? "Preview" : "Capture Your Face"}
                </ModalHeader>

                <ModalBody className="text-center position-relative">
                    <div className={`camera-wrapper ${faceDetected ? "glow" : ""}`}>
                        {loadingCamera && (
                            <div className="camera-loader">
                                Switching Camera...
                            </div>
                        )}
                        {!loadingCamera && !previewMode ? (
                            <>
                                <Webcam
                                    className="web-cam"
                                    ref={webcamRef}
                                    muted
                                    {...{
                                        onUserMedia,
                                        onUserMediaError,
                                    }}
                                    videoConstraints={{
                                        ...videoConstraints,
                                        deviceId: selectedDeviceId
                                            ? { exact: selectedDeviceId }
                                            : undefined,
                                    }}
                                    audio={false}
                                    screenshotFormat="image/png"
                                    mirrored={isBackCamera}
                                />
                                {/* <Webcam
                                    key={webcamKey}
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        deviceId: videoDevices[currentDeviceIndex]?.deviceId
                                    }}
                                    onUserMedia={async () => {
                                        setLoadingCamera(false);
                                    }}
                                /> */}

                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        pointerEvents: "none",
                                        transform: isBackCamera ? "scaleX(-1)" : "",
                                    }}
                                />
                                {faceDetected && (
                                    <div className="face-badge">
                                        Face Detected ✅
                                    </div>
                                )}

                            </>
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
                    </div>
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
                            switchCamera
                        }}
                    />
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default FaceCapture;