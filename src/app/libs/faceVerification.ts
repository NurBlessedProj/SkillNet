// src/app/libs/faceVerification.ts
import MediaPipeFaceService from "@/components/MediaPipeFaceDetection";

// Constants for verification settings
const VERIFICATION_INTERVAL = 20000; // 20 seconds between regular checks
const WARNING_VERIFICATION_INTERVAL = 1000; // 1 second during warning period
const MAX_VERIFICATION_ATTEMPTS = 3; // Maximum failed attempts before termination
const VERIFICATION_TIMEOUT = 10000; // 10 seconds to verify during warning
const MIN_SIMILARITY_THRESHOLD = 0.6; // Minimum similarity threshold (0-1)
const LOW_LIGHT_SIMILARITY_THRESHOLD = 0.55; // Slightly more lenient for low light

// Logger function with timestamp
const log = (message: string) => {
  console.log(`[FACE-VERIFY ${new Date().toISOString()}] ${message}`);
};

/**
 * Initialize the background verification system
 * @param videoElement The hidden video element for verification
 * @returns Functions to control the verification system
 */
export const initBackgroundVerification = (videoElement: HTMLVideoElement) => {
  let verificationInterval: NodeJS.Timeout | null = null;
  let warningTimeout: NodeJS.Timeout | null = null;
  let verificationAttempts = 0;
  let isVerifying = false;
  let isInWarningMode = false;
  let lastVerificationTime = 0;
  let registeredDescriptors: Float32Array[] | null = null;

  // Load registered face descriptors from localStorage
  const loadRegisteredDescriptors = (): Float32Array[] | null => {
    try {
      const storedDescriptors = localStorage.getItem("faceDescriptors");
      if (!storedDescriptors) {
        log("No registered face descriptors found");
        return null;
      }

      // Parse the stored descriptors (stored as number[][])
      const parsedDescriptors: number[][] = JSON.parse(storedDescriptors);

      // Convert to Float32Array[]
      return parsedDescriptors.map((desc) => new Float32Array(desc));
    } catch (error) {
      console.error("Error loading face descriptors:", error);
      return null;
    }
  };

  // Calculate similarity between face descriptors
  const calculateSimilarity = (
    descriptor1: Float32Array,
    descriptor2: Float32Array
  ): number => {
    if (descriptor1.length !== descriptor2.length) {
      return 0;
    }

    // Calculate Euclidean distance
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    const distance = Math.sqrt(sum);

    // Convert distance to similarity (0-1)
    // Lower distance means higher similarity
    // Using a sigmoid-like function to map distance to similarity
    const similarity = 1 / (1 + distance);
    return similarity;
  };

  // Verify the current face against registered faces
  const verifyFace = async (): Promise<{
    verified: boolean;
    similarity: number;
    lightingLevel: number;
    error?: string;
  }> => {
    if (!videoElement || !videoElement.srcObject) {
      return {
        verified: false,
        similarity: 0,
        lightingLevel: 0,
        error: "No camera stream available",
      };
    }

    try {
      // Load registered descriptors if not already loaded
      if (!registeredDescriptors) {
        registeredDescriptors = loadRegisteredDescriptors();
        if (!registeredDescriptors || registeredDescriptors.length === 0) {
          return {
            verified: false,
            similarity: 0,
            lightingLevel: 0,
            error: "No registered face found",
          };
        }
      }

      // Check lighting conditions
      let lightingInfo = { lightingLevel: 50, isAdequate: true, message: "" };
      if (videoElement instanceof HTMLVideoElement) {
        lightingInfo = await MediaPipeFaceService.assessLightingConditions(
          videoElement
        );
      }

      // Get current face descriptor
      const currentDescriptor = await MediaPipeFaceService.getFaceEmbedding(
        videoElement
      );
      if (!currentDescriptor) {
        return {
          verified: false,
          similarity: 0,
          lightingLevel: lightingInfo.lightingLevel,
          error: "No face detected",
        };
      }

      // Check for multiple faces
      const multipleFaces =
        (await MediaPipeFaceService.detectMultipleFaces(videoElement)) > 1;
      if (multipleFaces) {
        return {
          verified: false,
          similarity: 0,
          lightingLevel: lightingInfo.lightingLevel,
          error: "Multiple faces detected",
        };
      }

      // Find best match among registered descriptors
      let bestMatch = 0;
      for (const registeredDesc of registeredDescriptors) {
        const similarity = calculateSimilarity(
          currentDescriptor,
          registeredDesc
        );
        if (similarity > bestMatch) {
          bestMatch = similarity;
        }
      }

      // Adjust threshold based on lighting conditions
      const threshold = lightingInfo.isAdequate
        ? MIN_SIMILARITY_THRESHOLD
        : LOW_LIGHT_SIMILARITY_THRESHOLD;

      return {
        verified: bestMatch >= threshold,
        similarity: bestMatch,
        lightingLevel: lightingInfo.lightingLevel,
      };
    } catch (error) {
      console.error("Face verification error:", error);
      return {
        verified: false,
        similarity: 0,
        lightingLevel: 0,
        error: "Verification error",
      };
    }
  };

  // Start the verification process
  const startVerification = async (
    onVerificationFailed: () => void,
    onVerificationWarning: (timeLeft: number) => void,
    onVerificationSuccess: () => void
  ) => {
    if (verificationInterval) {
      clearInterval(verificationInterval);
    }

    log("Initializing background verification");

    // Ensure camera is initialized
    if (!videoElement.srcObject) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
            // Add advanced constraints for better quality
          },
        });
        videoElement.srcObject = stream;
        log("Background camera initialized");
      } catch (error) {
        console.error("Failed to initialize background camera", error);
        return;
      }
    }

    // Load face detection models if not already loaded
    await MediaPipeFaceService.initialize();

    // Regular verification interval
    verificationInterval = setInterval(async () => {
      // Skip if already verifying or in warning mode
      if (isVerifying || isInWarningMode) return;

      isVerifying = true;
      const result = await verifyFace();
      isVerifying = false;

      // If verification fails, enter warning mode
      if (!result.verified) {
        log(
          `Verification failed: ${
            result.error || `Similarity: ${result.similarity.toFixed(2)}`
          }`
        );
        enterWarningMode(
          onVerificationFailed,
          onVerificationWarning,
          onVerificationSuccess
        );
      } else {
        // Reset attempts on successful verification
        verificationAttempts = 0;
        lastVerificationTime = Date.now();

        // Only show success message occasionally (every 3rd verification)
        if (Math.random() < 0.3) {
          onVerificationSuccess();
        }
      }
    }, VERIFICATION_INTERVAL);

    log("Monitoring activated for assessment stage");
  };

  // Enter warning mode when verification fails
  const enterWarningMode = (
    onVerificationFailed: () => void,
    onVerificationWarning: (timeLeft: number) => void,
    onVerificationSuccess: () => void
  ) => {
    if (isInWarningMode) return;

    isInWarningMode = true;
    verificationAttempts++;

    // If exceeded max attempts, fail verification
    if (verificationAttempts > MAX_VERIFICATION_ATTEMPTS) {
      log("Maximum verification attempts exceeded");
      stopVerification();
      onVerificationFailed();
      return;
    }

    log(
      `Entering warning mode. Attempt ${verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS}`
    );

    // Set timeout for verification window
    let timeLeft = VERIFICATION_TIMEOUT / 1000;
    onVerificationWarning(timeLeft);

    // Clear previous warning timeout if exists
    if (warningTimeout) {
      clearTimeout(warningTimeout);
    }

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      timeLeft--;
      onVerificationWarning(timeLeft);

      // Time's up
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        verificationAttempts++;

        if (verificationAttempts > MAX_VERIFICATION_ATTEMPTS) {
          log("Verification time expired, maximum attempts reached");
          stopVerification();
          onVerificationFailed();
        } else {
          // Reset warning mode and try again
          isInWarningMode = false;
        }
      }
    }, 1000);

    // Start more frequent verification checks during warning period
    const warningVerificationInterval = setInterval(async () => {
      if (!isInWarningMode) {
        clearInterval(warningVerificationInterval);
        clearInterval(countdownInterval);
        return;
      }

      const result = await verifyFace();

      // If verification succeeds during warning period
      if (result.verified) {
        log("Verification succeeded during warning period");
        clearInterval(warningVerificationInterval);
        clearInterval(countdownInterval);
        isInWarningMode = false;
        verificationAttempts = 0;
        lastVerificationTime = Date.now();
        onVerificationSuccess();
      } else {
        // Log the specific issue
        if (result.error) {
          log(`Warning verification failed: ${result.error}`);
        } else {
          log(
            `Warning verification failed. Similarity: ${result.similarity.toFixed(
              2
            )}, Lighting: ${result.lightingLevel}`
          );
        }
      }
    }, WARNING_VERIFICATION_INTERVAL);
  };

  // Stop the verification process
  const stopVerification = () => {
    if (verificationInterval) {
      clearInterval(verificationInterval);
      verificationInterval = null;
    }

    if (warningTimeout) {
      clearTimeout(warningTimeout);
      warningTimeout = null;
    }

    isInWarningMode = false;
    isVerifying = false;

    // Stop the camera stream
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }

    log("Background verification stopped");
  };

  // Return the public API
  return {
    startVerification,
    stopVerification,
    verifyFace,
  };
};

// Export types for use in other components
export type FaceVerificationSystem = ReturnType<
  typeof initBackgroundVerification
>;
