'use client'
import React, { useState } from "react";
import Webcam from "react-webcam";
import { FacialRegistration } from "@/api/facialregistration";

const WebcamCapture = () => {
    const Facial = FacialRegistration()
    // Store the captured images
    const [images, setImages] = useState<any>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false); // State to handle the preview of the last image

    const webcamRef: any = React.useRef(null);

    // Capture image function
    const capture = React.useCallback(() => {
        if (images.length < 10) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImages([...images, imageSrc]); // Add the new image to the array
            setIsPreviewing(true); // Show the preview of the last image immediately
            setTimeout(() => {
                setIsPreviewing(false); // Hide the preview after 3 seconds
            }, 3000);
        }
    }, [images]);


    const handleSubmit =() =>{

    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {/* <h1 className="text-xl font-bold mb-4">Capture 10 Pictures</h1> */}

            {/* Webcam Display */}
            <div className="mb-4">
                {isPreviewing ? (
                    // Display the last captured image as a preview
                    <div className="h-56 w-56 rounded-full border border-gray-500 flex items-center justify-center">
                        <img
                            src={images[images.length - 1]} // Show the last captured image
                            alt={`Captured ${images.length - 1}`}
                            className="h-full w-full object-cover rounded-full"
                        />
                    </div>
                ) : (
                    // Show webcam when not previewing
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="h-56 w-56 rounded-full border border-gray-500"
                        videoConstraints={{
                            facingMode: "user",
                        }}
                    />
                )}
            </div>

            {/* Capture Button */}

            {
                images.length < 10 ? <button
                    className={`bg-blue-500 text-white px-4 py-2 rounded-md ${isCapturing || images.length >= 10 ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-600'}`}
                    onClick={() => {
                        setIsCapturing(true);
                        capture();
                        setIsCapturing(false);
                    }}
                    disabled={images.length >= 10} // Disable the button after 10 images
                >
                    {images.length >= 10 ? "Max Images Captured" : "Capture Snapshot"}
                </button> : <button onClick={handleSubmit} className="text-white bg-green-500 px-4">{Facial.loading ? 'Saving ...' : 'Save'}</button>
            }

            {/* Counter for number of images captured */}
            <div className="mt-2 text-lg">
                {images.length}/{10}
            </div>

            {/* Circular Box layout for progress */}
            {/* <div className="mt-4 relative flex items-center justify-center"> */}
                {/* Larger Circle container */}
                {/* <div className="relative w-96 h-96 rounded-full  border-gray-500"> */}
                    {/* Rectangular Boxes to show progress in a circle */}
                    {/* {[...Array(10)].map((_, index) => (
                        <div
                            key={index}
                            className={`absolute w-3 bg-gray-200 ${index < images.length ? 'bg-green-500' : ''}`}
                            style={{
                                height: '40px',  // Increase height to make the rectangles noticeable
                                transform: `rotate(${index * 36}deg) translate(40px)`, // Adjust the translation distance
                                transformOrigin: '0 0',
                            }}
                        />
                    ))}
                </div> */}
            {/* </div> */}

            {/* Display Captured Images */}
            {/* {images.length > 0 && (
                <div className="flex flex-wrap justify-center mt-4">
                    {images.map((image: any, index: any) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Captured ${index}`}
                            className="w-24 h-auto mx-2 mt-2 rounded-lg"
                        />
                    ))}
                </div>
            )} */}
        </div>
    );
};

export default WebcamCapture;
