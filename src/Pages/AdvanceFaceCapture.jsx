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

const AdvanceFaceCapture = ({
    enableDownload = true,
    enableBase64Viewer = true,
    onCapture
}) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const autoTimerRef = useRef(null);
    const lastBoxRef = useRef(null);
    const cameraInstanceRef = useRef(null);
    const smoothBoxRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const [modal, setModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceBox, setFaceBox] = useState(null);
    const [cameraFacing, setCameraFacing] = useState("user");
    const [cameraReady, setCameraReady] = useState(false);
    const [fullImage, setFullImage] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [showBase64, setShowBase64] = useState(false);

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

                canvas.width = w;
                canvas.height = h;

                ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
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

    /* ---------------- FACE DETECTION ---------------- */
    useEffect(() => {
        if (!modal || previewMode) return;

        const faceDetection = new FaceDetection({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        });

        faceDetection.setOptions({
            model: "short",
            minDetectionConfidence: 0.7
        });

        faceDetection.onResults((results) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const video = webcamRef.current?.video;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!canvas || !video) return;
            if (results.detections.length > 0) {
                const box = results.detections[0].boundingBox;

                const x =
                    box.xCenter * canvas.width - (box.width * canvas.width) / 2;
                const y =
                    box.yCenter * canvas.height - (box.height * canvas.height) / 2;
                const w = box.width * canvas.width;
                const h = box.height * canvas.height;

                const faceArea = w * h;
                const minFaceArea = 25000;

                setFaceDetected(true);
                setFaceBox(box);

                // Draw yellow box initially
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#00ff88";
                // Smooth animation
                const lerp = (start, end, t) => start + (end - start) * t;

                smoothBoxRef.current.x = lerp(smoothBoxRef.current.x, x, 0.2);
                smoothBoxRef.current.y = lerp(smoothBoxRef.current.y, y, 0.2);
                smoothBoxRef.current.w = lerp(smoothBoxRef.current.w, w, 0.2);
                smoothBoxRef.current.h = lerp(smoothBoxRef.current.h, h, 0.2);

                ctx.lineWidth = 3;
                ctx.strokeStyle = faceDetected ? "#00ff88" : "#00ff88";
                ctx.shadowColor = faceDetected ? "#00ff88" : "transparent";
                ctx.shadowBlur = faceDetected ? 20 : 0;

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
        });

        if (webcamRef?.current) {
            cameraInstanceRef.current = new Camera(
                webcamRef.current.video,
                {
                    onFrame: async () => {
                        await faceDetection.send({
                            image: webcamRef?.current?.video
                        });
                    },
                    width: 480,
                    height: 360
                }
            );

            cameraInstanceRef.current.start();
        }

        return () => {
            if (cameraInstanceRef.current) {
                cameraInstanceRef.current.stop();
            }
        };
    }, [modal, previewMode, cameraFacing, cameraReady]);

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

    const switchCamera = () => {
        setCameraFacing((prev) =>
            prev === "user" ? "environment" : "user"
        );
    };

    /* ---------------- DOWNLOAD JPG ---------------- */
    // const downloadJpg = () => {
    //     if (!capturedImage) return;

    //     const link = document.createElement("a");
    //     link.href = capturedImage;
    //     link.download = "face-capture.jpg";
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    // };

    /* ---------------- COPY BASE64 ---------------- */
    // const copyBase64 = async () => {
    //     if (!capturedImage) return;

    //     try {
    //         await navigator.clipboard.writeText(capturedImage);
    //         alert("Base64 copied to clipboard ✅");
    //     } catch (err) {
    //         console.error("Copy failed", err);
    //     }
    // };

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
                            <div className="saved-image-wrapper">
                                <img
                                    src={capturedImage}
                                    className="saved-face"
                                    onClick={toggle}
                                    alt="face"
                                />

                                <div
                                    className="remove-btn"
                                    onClick={removeCapturedImage}
                                >
                                    ✕
                                </div>
                            </div>

                            {enableDownload &&
                                <><div className="post-actions">
                                    <Button size="sm" color="primary" onClick={() => downloadJpg("cropped")}>
                                        JPG (Cropped)
                                    </Button>

                                    <Button size="sm" color="secondary" onClick={() => downloadPng("cropped")}>
                                        PNG (Cropped)
                                    </Button>
                                </div>

                                    <div className="post-actions">
                                        <Button size="sm" color="info" onClick={() => downloadJpg("full")}>
                                            JPG (Full)
                                        </Button>

                                        <Button size="sm" color="dark" onClick={() => downloadPng("full")}>
                                            PNG (Full)
                                        </Button>
                                    </div></>
                            }

                            {enableBase64Viewer &&
                                <>
                                    <div className="post-actions">
                                        <Button
                                            size="sm"
                                            color="success"
                                            onClick={() => setShowBase64(!showBase64)}
                                        >
                                            {showBase64 ? "Hide Base64" : "Show Base64"}
                                        </Button>
                                    </div>
                                    <>
                                        {showBase64 && (
                                            <textarea
                                                value={capturedImage}
                                                readOnly
                                                className="base64-box"
                                            />
                                        )}
                                    </>
                                </>
                            }
                        </>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={modal} toggle={toggle} centered size="lg">
                <ModalHeader toggle={toggle}>
                    {previewMode ? "Preview" : "Capture Your Face"}
                </ModalHeader>

                <ModalBody className="text-center position-relative">
                    <div className={`camera-wrapper ${faceDetected ? "glow" : ""}`}>
                        {!previewMode ? (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode: cameraFacing
                                    }}
                                    onUserMedia={() => setCameraReady(true)}
                                    style={{
                                        width: "100%",
                                        borderRadius: 15
                                    }}
                                />

                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%"
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
                    {previewMode ? (
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
                                    <Button color="info" onClick={switchCamera}>
                                        Switch Camera
                                    </Button>

                                    <Button color="primary" onClick={capture}>
                                        Capture
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default AdvanceFaceCapture;