"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  compareWithStoredDescriptors,
  detectMultipleFaces,
  getFaceDescriptor,
  loadModels,
} from "@/app/libs/faceUtils";
interface ContinuousFaceMonitorProps {
  onViolation: () => void;
  isActive: boolean;
  checkInterval?: number; // Time between checks in ms
  maxFailures?: number; // Number of consecutive failures before triggering violation
}

const ContinuousFaceMonitor: React.FC<ContinuousFaceMonitorProps> = ({
  onViolation,
  isActive,
  checkInterval = 10000, // Default: check every 15 seconds
  maxFailures = 3, // Default: 3 consecutive failures trigger violation
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);

  // Initialize face recognition when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadModels();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize face models:", error);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, []);

  // Start or stop monitoring based on isActive prop
  useEffect(() => {
    if (isActive && isInitialized) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isActive, isInitialized]);

  const startMonitoring = async () => {
    if (isMonitoringRef.current) return;
    isMonitoringRef.current = true;

    try {
      // Setup camera
      const success = await setupCamera();
      if (!success) {
        console.error("Failed to setup camera for monitoring");
        return;
      }

      // Start periodic checks
      monitoringIntervalRef.current = setInterval(async () => {
        if (!isActive) {
          stopMonitoring();
          return;
        }

        await checkFace();
      }, checkInterval);
    } catch (error) {
      console.error("Error starting face monitoring:", error);
      isMonitoringRef.current = false;
    }
  };

  const stopMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    isMonitoringRef.current = false;
  };

  const setupCamera = async (): Promise<boolean> => {
    try {
      // Clean up existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
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

  const checkFace = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      // Check for multiple faces
      const multipleFaces = await detectMultipleFaces(videoRef.current);
      if (multipleFaces) {
        handleFailure("Multiple faces detected");
        return;
      }

      // Get current face descriptor
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        handleFailure("Face not detected");
        return;
      }

      // Compare with stored descriptors
      const isMatch = await compareWithStoredDescriptors(descriptor);

      if (isMatch) {
        // Reset failure count on success
        setFailureCount(0);
        // Show success toast when face is identified
        toast.success("Identity verified successfully", {
          duration: 3000,
        });
      } else {
        handleFailure("Face doesn't match registered user");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      handleFailure("Verification error");
    }
  };

  const handleFailure = (reason: string) => {
    setFailureCount((prev) => {
      const newCount = prev + 1;

      // Show warning toast on first failure
      if (newCount === 1) {
        toast.warning(
          "Identity verification check failed. Please ensure your face is clearly visible.",
          {
            duration: 5000,
          }
        );
      }

      // Show error toast when approaching max failures
      if (newCount === maxFailures - 1) {
        toast.error(
          "Warning: Test will be terminated if identity cannot be verified on next check",
          {
            duration: 8000,
          }
        );
      }

      // Trigger violation if max failures reached
      if (newCount >= maxFailures) {
        onViolation();
      }

      return newCount;
    });
  };

  return (
    <div className="hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
    </div>
  );
};
export default ContinuousFaceMonitor;
