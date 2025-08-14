'use client'
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

// Define the type for the captured image
interface CapturedImage {
    name: string;
    url: string;
    id: number;
}

const Setup = () => {
    // State for images and camera
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [captureImage, setCaptureImage] = useState<string | null>(null);
    const [capturedCount, setCapturedCount] = useState<number>(0);

    const cameraRef = useRef<HTMLVideoElement | null>(null);

    // Function to start camera when page loads
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                if (cameraRef.current) {
                    cameraRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing the camera:", err);
            }
        };

        startCamera();

        return () => {
            if (cameraRef.current) {
                const stream = cameraRef.current.srcObject as MediaStream;
                stream?.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Capture image from the webcam
    const captureHandler = () => {
        if (cameraRef.current && capturedCount < 10) {
            const videoElement = cameraRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL("image/png");

                // Save captured image
                const newImage: CapturedImage = {
                    name: `image${capturedCount + 1}`,
                    url: imageUrl,
                    id: capturedCount + 1,
                };
                setImages((prevImages) => [...prevImages, newImage]);
                setCaptureImage(imageUrl);
                setCapturedCount(capturedCount + 1);
            }
        }
    };

    // Check if the user has reached 10 images
    useEffect(() => {
        if (capturedCount === 10) {
            toast.info("You have reached the maximum limit of 10 images!");
        }
    }, [capturedCount]);

    // Render bars to form a circular shape with gaps between them
    const renderBars = () => {
        const bars = [];
        const angleIncrement = 360 / 10; // 10 bars to form a circle
        const gapSize = 4; // Gap between each bar

        for (let i = 0; i < 10; i++) {
            const isCompleted = i < capturedCount; // Bars that are green (completed images)
            bars.push(
                <div
                    key={i}
                    className={`h-3 w-2/12 rounded-full my-1 transform rotate-[${i * angleIncrement}deg] absolute`}
                    style={{
                        backgroundColor: isCompleted ? 'green' : 'gray',
                        transformOrigin: 'center',
                        margin: gapSize,
                    }}
                />
            );
        }
        return bars;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {/* Display the circular progress bars with spaces */}
            <div className="relative flex items-center justify-center">
                {/* Render 10 bars as circular segments */}
                <div className="relative flex items-center justify-center space-x-1.5 w-40 h-40">
                    {renderBars()}
                </div>

                {/* Display captured image or live camera feed */}
                <div className="relative">
                    {captureImage ? (
                        <img
                            src={captureImage}
                            alt="Captured"
                            className="w-40 h-40 object-cover rounded-full"
                        />
                    ) : (
                        <video
                            ref={cameraRef}
                            autoPlay
                            muted
                            className="w-40 h-40 object-cover rounded-full"
                        />
                    )}
                </div>
            </div>

            {/* Counter showing how many pictures you've taken */}
            <div className="mt-4 text-xl">{capturedCount}/10</div>

            {/* Capture button */}
            <button
                onClick={captureHandler}
                className="mt-4 px-10 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400"
                disabled={capturedCount >= 10} // Disable the button after 10 pictures
            >
                Capture
            </button>

            <div>
                {renderBars()}
            </div>
        </div>
    );
};

export default Setup;
