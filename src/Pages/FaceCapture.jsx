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

const FaceCapture = ({
    autoCaptureDelay = 2000,
    enableDownload = true,
    enableBase64Viewer = true,
    onCapture
}) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const lastBoxRef = useRef(null);
    const smoothBoxRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const [modal, setModal] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [fullImage, setFullImage] = useState(null);
    const [showBase64, setShowBase64] = useState(false);
    const [cameraFacing, setCameraFacing] = useState("user");

    const toggle = () => {
        setModal(!modal);
        setPreviewMode(false);
    };

    const cropFace = (base64, box) => {
        const img = new Image();
        img.src = base64;

        return new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const padding = 80;

                const x =
                    box.xCenter * img.width -
                    (box.width * img.width) / 2 -
                    padding;
                const y =
                    box.yCenter * img.height -
                    (box.height * img.height) / 2 -
                    padding;

                const w = box.width * img.width + padding * 2;
                const h = box.height * img.height + padding * 2;

                canvas.width = w;
                canvas.height = h;

                ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg"));
            };
        });
    };

    const capture = async (box) => {
        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;

        const cropped = await cropFace(screenshot, box);

        setFullImage(screenshot);
        setCapturedImage(cropped);
        setPreviewMode(true);

        if (onCapture) {
            onCapture({
                cropped,
                full: screenshot
            });
        }
    };

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
            const ctx = canvas?.getContext("2d");
            const video = webcamRef.current?.video;
            if (!canvas || !ctx || !video) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.detections.length > 0) {
                const box = results.detections[0].boundingBox;
                setFaceDetected(true);

                const x =
                    box.xCenter * canvas.width -
                    (box.width * canvas.width) / 2;
                const y =
                    box.yCenter * canvas.height -
                    (box.height * canvas.height) / 2;
                const w = box.width * canvas.width;
                const h = box.height * canvas.height;

                const lerp = (a, b, t) => a + (b - a) * t;

                smoothBoxRef.current.x = lerp(smoothBoxRef.current.x, x, 0.2);
                smoothBoxRef.current.y = lerp(smoothBoxRef.current.y, y, 0.2);
                smoothBoxRef.current.w = lerp(smoothBoxRef.current.w, w, 0.2);
                smoothBoxRef.current.h = lerp(smoothBoxRef.current.h, h, 0.2);

                ctx.strokeStyle = "#00ff88";
                ctx.lineWidth = 3;
                ctx.shadowColor = "#00ff88";
                ctx.shadowBlur = 20;

                ctx.strokeRect(
                    smoothBoxRef.current.x,
                    smoothBoxRef.current.y,
                    smoothBoxRef.current.w,
                    smoothBoxRef.current.h
                );

                if (lastBoxRef.current) {
                    const dx = Math.abs(lastBoxRef.current.x - x);
                    const dy = Math.abs(lastBoxRef.current.y - y);
                    if (dx < 10 && dy < 10) {
                        setTimeout(() => capture(box), autoCaptureDelay);
                    }
                }

                lastBoxRef.current = { x, y };
            } else {
                setFaceDetected(false);
            }
        });

        if (webcamRef?.current) {
            cameraRef.current = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    await faceDetection.send({
                        image: webcamRef.current.video
                    });
                }
            });

            cameraRef.current.start();
        }

        return () => {
            if (cameraRef.current) cameraRef.current.stop();
        };
    }, [modal, previewMode, cameraFacing]);

    const download = (img, name) => {
        const link = document.createElement("a");
        link.href = img;
        link.download = name;
        link.click();
    };

    return (
        <div className="face-page">
            <Card className="face-card">
                <CardBody>
                    <h3>✨ Smart Face Capture</h3>

                    {!capturedImage ? (
                        <Button onClick={toggle}>Start Capture</Button>
                    ) : (
                        <>
                            <img
                                src={capturedImage}
                                className="saved-face"
                                onClick={toggle}
                                alt="face"
                            />

                            {enableDownload && (
                                <>
                                    <Button onClick={() => download(capturedImage, "cropped.jpg")}>
                                        Download Cropped
                                    </Button>
                                    <Button onClick={() => download(fullImage, "full.jpg")}>
                                        Download Full
                                    </Button>
                                </>
                            )}

                            {enableBase64Viewer && (
                                <>
                                    <Button onClick={() => setShowBase64(!showBase64)}>
                                        Toggle Base64
                                    </Button>
                                    {showBase64 && (
                                        <textarea value={capturedImage} readOnly />
                                    )}
                                </>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={modal} toggle={toggle} centered size="lg">
                <ModalHeader toggle={toggle}>
                    {previewMode ? "Preview" : "Align Your Face"}
                </ModalHeader>

                <ModalBody className="position-relative">
                    {!previewMode ? (
                        <div className="camera-wrapper">
                            <Webcam
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: cameraFacing }}
                            />
                            <canvas ref={canvasRef} />
                            {faceDetected && (
                                <div className="face-badge">
                                    Face Detected ✅
                                </div>
                            )}
                        </div>
                    ) : (
                        <img src={capturedImage} alt="preview" />
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button onClick={toggle}>Close</Button>
                    <Button onClick={() =>
                        setCameraFacing((p) =>
                            p === "user" ? "environment" : "user"
                        )
                    }>
                        Switch Camera
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default FaceCapture;