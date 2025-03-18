import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const StoryGenerator = () => {
    const [poseLandmarker, setPoseLandmarker] = useState(null);
    const [runningMode, setRunningMode] = useState("IMAGE");
    const [webcamActive, setWebcamActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const demosSectionRef = useRef(null);

    // Continuous animation loop for live webcam detection.
    // Defined first so that useEffect below can reference it.
    const predictWebcam = useCallback(async () => {
        const video = videoRef.current;
        const canvasElement = canvasRef.current;
        if (!video || !canvasElement) {
            if (webcamActive) window.requestAnimationFrame(predictWebcam);
            return;
        }
        if (video.paused || video.ended) {
            if (webcamActive) window.requestAnimationFrame(predictWebcam);
            return;
        }
        // Sync canvas dimensions to video's intrinsic size.
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        const canvasCtx = canvasElement.getContext("2d");

        // Switch to VIDEO mode if needed.
        if (runningMode === "IMAGE") {
            setRunningMode("VIDEO");
            await poseLandmarker.setOptions({ runningMode: "VIDEO" });
        }

        const timestamp = performance.now();
        poseLandmarker.detectForVideo(video, timestamp, (result) => {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            result.landmarks.forEach((landmark) => {
                const drawingUtils = new DrawingUtils(canvasCtx);
                drawingUtils.drawLandmarks(landmark, {
                    radius: (data) =>
                        DrawingUtils.lerp(data.from?.z || 0, -0.15, 0.1, 5, 1),
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            });
            canvasCtx.restore();
        });
        if (webcamActive) {
            window.requestAnimationFrame(predictWebcam);
        }
    }, [webcamActive, poseLandmarker, runningMode]);

    // Load the model on mount.
    useEffect(() => {
        const createPoseLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            const landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                    delegate: "GPU",
                },
                runningMode: runningMode,
                numPoses: 2,
            });
            setPoseLandmarker(landmarker);
            if (demosSectionRef.current) {
                demosSectionRef.current.classList.remove("invisible");
            }
        };
        createPoseLandmarker();
    }, []);

    // Auto-enable webcam detection when the model is loaded.
    useEffect(() => {
        const enableCam = async () => {
            if (!poseLandmarker) return;
            try {
                const constraints = { video: true };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play(); // Some browsers may require a user gesture.
                    setWebcamActive(true);
                    window.requestAnimationFrame(predictWebcam);
                }
            } catch (err) {
                console.error("Webcam access error:", err);
            }
        };
        enableCam();
    }, [poseLandmarker, predictWebcam]);

    // Static image detection (triggered by clicking the image).
    const handleClick = async (event) => {
        if (!poseLandmarker) {
            console.log("Wait for poseLandmarker to load before clicking!");
            return;
        }
        // Switch to IMAGE mode if needed.
        if (runningMode === "VIDEO") {
            setRunningMode("IMAGE");
            await poseLandmarker.setOptions({ runningMode: "IMAGE" });
        }
        // Remove any previous overlaid canvases.
        const canvases = event.target.parentNode.getElementsByClassName("canvas");
        while (canvases.length > 0) {
            canvases[0].remove();
        }
        poseLandmarker.detect(event.target, (result) => {
            const canvas = document.createElement("canvas");
            canvas.setAttribute("class", "canvas");
            canvas.setAttribute("width", event.target.naturalWidth + "px");
            canvas.setAttribute("height", event.target.naturalHeight + "px");
            canvas.style = `
                position: absolute;
                left: 0;
                top: 0;
                width: ${event.target.width}px;
                height: ${event.target.height}px;
                pointer-events: none;
            `;
            event.target.parentNode.style.position = "relative";
            event.target.parentNode.appendChild(canvas);

            const canvasCtx = canvas.getContext("2d");
            const drawingUtils = new DrawingUtils(canvasCtx);
            result.landmarks.forEach((landmark) => {
                drawingUtils.drawLandmarks(landmark, {
                    radius: (data) =>
                        DrawingUtils.lerp(data.from?.z || 0, -0.15, 0.1, 5, 1),
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            });
        });
    };

    return (
        <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ textAlign: "center", marginBottom: 30 }}>
                Pose Landmarker Demo
            </h1>
            <div
                ref={demosSectionRef}
                id="demos"
                className="invisible"
                style={{ marginBottom: 40 }}
            >
                <h2>Image Detection</h2>
                <div
                    className="detectOnClick"
                    style={{
                        position: "relative",
                        display: "inline-block",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        borderRadius: 8,
                        overflow: "hidden",
                    }}
                >
                    <img
                        src="example.jpg"
                        alt="Example"
                        style={{ cursor: "pointer", display: "block", width: "100%" }}
                        onClick={handleClick}
                    />
                </div>
            </div>
            <div>
                <h2>Webcam Detection (Live)</h2>
                <div style={{ position: "relative", display: "inline-block" }}>
                    <video
                        ref={videoRef}
                        id="webcam"
                        autoPlay
                        playsInline
                        style={{
                            borderRadius: 8,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        }}
                    ></video>
                    <canvas
                        ref={canvasRef}
                        id="output_canvas"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                        }}
                    ></canvas>
                </div>
            </div>
        </div>
    );
};

export default StoryGenerator;