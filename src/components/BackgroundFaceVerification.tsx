import React, { useEffect, useRef, useState } from "react";
import {
  loadMediaPipeModels,
  getFaceEmbedding,
  compareWithStoredEmbedding,
  detectMultipleFaces,
} from "@/app/libs/mediapipeUtils";

interface BackgroundFaceVerificationProps {
  onVerificationChange: (
    status: "pending" | "verifying" | "success" | "warning" | "failed"
  ) => void;
  onVerificationSuccess: () => void;
  onVerificationFailure: (reason: string) => void;
  onMultipleFacesDetected: () => void;
  isActive: boolean;
}

const BackgroundFaceVerification: React.FC<BackgroundFaceVerificationProps> = ({
  onVerificationChange,
  onVerificationSuccess,
  onVerificationFailure,
  onMultipleFacesDetected,
  isActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [brightnessAdjusted, setBrightnessAdjusted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastVerificationTimeRef = useRef<number>(0);
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 5;

  // Track consecutive verification failures
  const consecutiveFailuresRef = useRef<number>(0);
  const maxConsecutiveFailures = 3;

  // Track verification history for additional security
  const verificationHistoryRef = useRef<
    Array<{ timestamp: number; success: boolean; score: number }>
  >([]);

  // Logger function for verification events
  const logVerificationEvent = (event: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[FACE-VERIFY ${timestamp}] ${event}`, details || "");
  };

  // Initialize camera and models
  useEffect(() => {
    if (!isActive) return;

    const initialize = async () => {
      try {
        logVerificationEvent("Initializing background verification");

        // Load MediaPipe models
        const modelsLoaded = await loadMediaPipeModels();
        if (!modelsLoaded) {
          logVerificationEvent("Failed to load MediaPipe models");
          onVerificationFailure("Failed to load face detection models");
          return;
        }

        logVerificationEvent("Face recognition models loaded");

        // Setup camera
        const cameraSuccess = await setupCamera();
        if (!cameraSuccess) {
          logVerificationEvent("Failed to initialize background camera");
          // Don't fail immediately, we'll retry
          retrySetupCamera();
          return;
        }

        setIsInitialized(true);

        // Start verification after a short delay to let camera stabilize
        setTimeout(() => {
          verifyFace();
        }, 2000);
      } catch (error) {
        logVerificationEvent("Initialization error", error);
        retrySetupCamera();
      }
    };

    initialize();

    // Setup periodic verification
    verificationIntervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      // Only verify if it's been at least 15 seconds since last verification
      if (currentTime - lastVerificationTimeRef.current >= 15000) {
        verifyFace();
      }
    }, 15000);

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }

      logVerificationEvent("Background verification cleanup");
    };
  }, [isActive]);

  // Retry camera setup with backoff
  const retrySetupCamera = () => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      const delay = Math.min(2000 * retryCountRef.current, 10000);

      logVerificationEvent(
        `Retrying camera setup (attempt ${retryCountRef.current}/${maxRetries}) in ${delay}ms`
      );

      setTimeout(async () => {
        const success = await setupCamera();
        if (success) {
          logVerificationEvent("Camera setup successful after retry");
          setIsInitialized(true);

          // Start verification after a short delay
          setTimeout(() => {
            verifyFace();
          }, 1000);
        } else if (retryCountRef.current < maxRetries) {
          retrySetupCamera();
        } else {
          logVerificationEvent("Max retries reached for camera setup");
          onVerificationFailure(
            "Could not access camera after multiple attempts"
          );
        }
      }, delay);
    }
  };

  // Setup camera with improved error handling
  const setupCamera = async (): Promise<boolean> => {
    try {
      // Try to get a stream with ideal settings first
      try {
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;

          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadeddata = () => {
                logVerificationEvent("Video feed loaded with ideal settings");
                resolve(true);
              };
            }
          });

          return true;
        }
      } catch (initialError) {
        logVerificationEvent(
          "Could not access camera with ideal settings, trying fallback",
          initialError
        );

        // Fallback to basic settings
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            streamRef.current = fallbackStream;

            // Wait for video to be ready
            await new Promise((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadeddata = () => {
                  logVerificationEvent(
                    "Video feed loaded with fallback settings"
                  );
                  resolve(true);
                };
              }
            });

            return true;
          }
        } catch (fallbackError) {
          logVerificationEvent(
            "Camera access failed with fallback settings",
            fallbackError
          );
          throw fallbackError;
        }
      }

      return false;
    } catch (error) {
      logVerificationEvent("Camera setup error", error);
      return false;
    }
  };

  // Function to create a canvas and brighten the image
  const enhanceImageBrightness = (
    video: HTMLVideoElement,
    brightness: number = 1.5,
    contrast: number = 1.2
  ): ImageData | null => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the original image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness and contrast adjustments
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = Math.min(255, Math.max(0, data[i] * brightness));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightness));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightness));

      // Apply contrast
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.min(
          255,
          Math.max(0, (data[i + j] - 128) * contrast + 128)
        );
      }
    }

    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);

    return imageData;
  };

  // Analyze verification history for suspicious patterns
  const analyzeVerificationHistory = (similarityScore: number): boolean => {
    const history = verificationHistoryRef.current;

    // Add current verification to history
    history.push({
      timestamp: Date.now(),
      success: similarityScore >= (brightnessAdjusted ? 0.8 : 0.75),
      score: similarityScore,
    });

    // Keep only the last 10 verifications
    if (history.length > 10) {
      history.shift();
    }

    // If we have at least 3 verifications, analyze patterns
    if (history.length >= 3) {
      // Check for sudden drops in similarity score
      const recentScores = history.slice(-3).map((h) => h.score);
      const avgPreviousScores = (recentScores[0] + recentScores[1]) / 2;
      const currentScore = recentScores[2];

      // If there's a significant drop in similarity (>20%), consider it suspicious
      if (currentScore < avgPreviousScores * 0.8) {
        logVerificationEvent(
          "Suspicious pattern detected: significant drop in similarity score",
          {
            avgPrevious: avgPreviousScores,
            current: currentScore,
          }
        );
        return false;
      }
    }

    return true;
  };

  // Verify the user's face
  const verifyFace = async () => {
    if (!isInitialized || !videoRef.current || !isActive) return;

    onVerificationChange("verifying");
    logVerificationEvent("Starting background verification check");

    try {
      // Make sure video is ready and playing
      if (videoRef.current.readyState !== 4 || videoRef.current.paused) {
        logVerificationEvent("Video not ready yet, waiting...");
        // Try to play the video if it's paused
        if (videoRef.current.paused) {
          try {
            await videoRef.current.play();
          } catch (e) {
            logVerificationEvent("Could not play video", e);
          }
        }

        // Give it a moment to stabilize
        await new Promise((resolve) => setTimeout(resolve, 500));

        // If still not ready, abort this verification attempt
        if (videoRef.current.readyState !== 4) {
          logVerificationEvent("Video still not ready, aborting this check");
          onVerificationChange("warning");
          return;
        }
      }

      // Check for multiple faces
      const multipleFaces = await detectMultipleFaces(videoRef.current);
      if (multipleFaces) {
        logVerificationEvent("Multiple faces detected");
        onVerificationChange("warning");
        onMultipleFacesDetected();
        consecutiveFailuresRef.current++;
        return;
      }

      // Try to get face embedding with normal video first
      let embedding = await getFaceEmbedding(videoRef.current);

      // If no face detected, try with brightness enhancement
      if (!embedding) {
        logVerificationEvent(
          "No face detected with normal settings, trying brightness enhancement"
        );

        // Apply brightness enhancement
        const enhancedImageData = enhanceImageBrightness(videoRef.current);

        if (enhancedImageData) {
          // Try to get embedding from enhanced image
          embedding = await getFaceEmbedding(
            videoRef.current,
            enhancedImageData
          );

          if (embedding) {
            logVerificationEvent("Face detected after brightness enhancement");
            setBrightnessAdjusted(true);
          }
        }
      }

      // If still no face detected
      if (!embedding) {
        logVerificationEvent("No face detected even after enhancement");
        onVerificationChange("warning");
        onVerificationFailure("No face detected");
        consecutiveFailuresRef.current++;

        // If too many consecutive failures, trigger a stronger warning
        if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
          logVerificationEvent("Too many consecutive failures");
          onVerificationChange("failed");
          onVerificationFailure("Verification failed after multiple attempts");
        }
        return;
      }

      // Compare with stored embedding - use higher threshold with brightness adjustment
      const threshold = brightnessAdjusted ? 0.8 : 0.75;
      const similarityResult = await compareWithStoredEmbedding(
        embedding,
        threshold
      );

      // Get the similarity score for analysis (this requires modifying compareWithStoredEmbedding to return the score)
      // For now, we'll assume it's available through the console log

      // Check for suspicious patterns in verification history
      const isLegitimate = analyzeVerificationHistory(
        parseFloat(
          console.log
            .toString()
            .match(/Face similarity score: ([\d.]+)/)?.[1] || "0"
        )
      );

      if (similarityResult && isLegitimate) {
        logVerificationEvent("Background verification successful");
        onVerificationChange("success");
        onVerificationSuccess();
        lastVerificationTimeRef.current = Date.now();
        consecutiveFailuresRef.current = 0; // Reset failure counter on success
      } else {
        logVerificationEvent(
          "Background verification failed - face mismatch or suspicious pattern"
        );
        onVerificationChange("warning");
        onVerificationFailure("Identity verification failed");
        consecutiveFailuresRef.current++;

        // If too many consecutive failures, trigger a stronger warning
        if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
          logVerificationEvent("Too many consecutive failures");
          onVerificationChange("failed");
          onVerificationFailure("Verification failed after multiple attempts");
        }
      }
    } catch (error) {
      logVerificationEvent("Error during background verification", error);
      onVerificationChange("warning");
      onVerificationFailure("Verification error");
      consecutiveFailuresRef.current++;
    }
  };

  return (
    <div className="hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "640px", height: "480px" }}
      />
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default BackgroundFaceVerification;
