"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  compareWithStoredDescriptors,
  detectMultipleFaces,
  getFaceDescriptor,
  loadModels
} from "@/app/libs/faceUtils";
import { toast } from "sonner";

interface SilentFaceVerificationProps {
  onVerificationComplete: (success: boolean) => void;
  maxAttempts?: number;
}

const SilentFaceVerification: React.FC<SilentFaceVerificationProps> = ({
  onVerificationComplete,
  maxAttempts = 3
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [attempts, setAttempts] = useState(0);
  const verificationInProgress = useRef(false);

  useEffect(() => {
    // Start verification process when component mounts
    startVerification();

    // Clean up when component unmounts
    return () => {
      cleanupCamera();
    };
  }, []);

  const startVerification = async () => {
    if (verificationInProgress.current) return;
    verificationInProgress.current = true;
    
    try {
      // Load face-api.js models
      await loadModels();
      // Start camera
      await setupCamera();
      
      // Wait a moment for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try verification with multiple attempts
      let isVerified = false;
      let currentAttempt = 0;
      
      while (!isVerified && currentAttempt < maxAttempts) {
        isVerified = await verifyFace();
        
        if (!isVerified) {
          currentAttempt++;
          setAttempts(currentAttempt);
          
          // If we still have attempts left, wait a bit before trying again
          if (currentAttempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Complete verification process
      onVerificationComplete(isVerified);
    } catch (error) {
      console.error("Verification error:", error);
      onVerificationComplete(false);
    } finally {
      cleanupCamera();
      verificationInProgress.current = false;
    }
  };

  const setupCamera = async () => {
    try {
      // Check if we already have a stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(true);
            };
          }
        });
      }

      return true;
    } catch (error) {
      console.error("Camera setup error:", error);
      return false;
    }
  };

  const verifyFace = async (): Promise<boolean> => {
    if (!videoRef.current) return false;

    try {
      // Check for stored face descriptors
      const storedDescriptors = localStorage.getItem("faceDescriptors");
      if (!storedDescriptors) {
        toast.error("No registered face found. Please register your face first.");
        return false;
      }

      // Check for multiple faces
      const multipleFaces = await detectMultipleFaces(videoRef.current);
      if (multipleFaces) {
        if (attempts === 0) {
          toast.warning("Multiple faces detected. Please ensure only you are in the frame.");
        }
        return false;
      }

      // Get current face descriptor
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        if (attempts === 0) {
          toast.warning("Face not detected clearly. Please ensure good lighting and face the camera directly.");
        }
        return false;
      }

      // Compare with stored descriptors
      const isMatch = await compareWithStoredDescriptors(descriptor);
      return isMatch;
    } catch (error) {
      console.error("Face verification error:", error);
      return false;
    }
  };

  const cleanupCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default SilentFaceVerification;