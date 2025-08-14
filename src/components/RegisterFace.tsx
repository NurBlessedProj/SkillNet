"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Loader2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  loadMediaPipeModels,
  getFaceEmbedding,
  detectMultipleFaces,
  storeFaceEmbedding,
  getFaceQualityScore,
} from "@/app/libs/mediapipeUtils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FacialRegistration } from "@/api/facialregistration";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface RegisterFaceProps {
  onVerificationComplete?: () => void;
}

const RegisterFace = ({ onVerificationComplete }: RegisterFaceProps) => {
  const t = useTranslations(); // Initialize translation hook
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [captureCount, setCaptureCount] = useState(0);
  const [descriptors, setDescriptors] = useState<Float32Array[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const { loading: savingToServer, save: saveToServer } = FacialRegistration();
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionAttempts, setFaceDetectionAttempts] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationProgress, setRegistrationProgress] = useState(0);

  const getLoadingMessage = () => {
    if (modelLoading) return t("registerFace.loading.models");
    if (cameraLoading) return t("registerFace.loading.camera");
    return t("registerFace.loading.general");
  };

  // Function to stop all camera tracks
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
      // Also clear the video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.log("Camera stopped successfully");
    }

    // Clear any running face detection intervals
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Get current user session
    const getCurrentUser = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          console.log("No user session found, redirecting to login");
          router.push("/auth");
          return;
        }
        const email = session.session.user.email;
        setUserEmail(email || null);
        // Check if user has already registered their face
        const { data: profile } = await supabase
          .from("profiles")
          .select("face_registered, active")
          .eq("email", email)
          .single();
        console.log("User profile:", profile);
        if (profile?.face_registered === true) {
          console.log("Face already registered");
          // If both conditions are met, redirect to test
          if (profile.active !== "false" && profile.active !== false) {
            console.log("User is active, redirecting to test");
            router.push("/questionaire");
          } else {
            console.log("User is not active yet, redirecting to questionaire");
            router.push("/questionaire");
          }
          return;
        }
        // If not registered, initialize camera
        initializeCamera();
      } catch (error) {
        console.error("Error checking face registration:", error);
        setError(t("registerFace.errors.checkRegistration"));
        setIsLoading(false);
      }
    };

    getCurrentUser();

    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [router, t]);

  // Start continuous face detection once camera is ready
  useEffect(() => {
    if (cameraReady && videoRef.current && !faceCheckIntervalRef.current) {
      // Start a periodic check for face presence
      faceCheckIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            // Check if any face is present (returns true if multiple faces detected)
            const multipleFaces = await detectMultipleFaces(videoRef.current);
            // Face is detected if there's at least one face but not multiple
            setFaceDetected(!multipleFaces && (await hasFace()));

            // Only show error if user has attempted to capture
            if (faceDetectionAttempts > 0) {
              if (!(await hasFace())) {
                setError(t("registerFace.errors.noFaceDetected"));
              } else if (multipleFaces) {
                setError(t("registerFace.errors.multipleFaces"));
              } else {
                setError(null);
              }
            }
          } catch (err) {
            console.error("Error in face detection interval:", err);
          }
        }
      }, 1000); // Check every second
    }

    return () => {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
    };
  }, [cameraReady, faceDetectionAttempts, t]);

  // Helper function to check if a face is present
  const hasFace = async (): Promise<boolean> => {
    if (!videoRef.current) return false;
    const embedding = await getFaceEmbedding(videoRef.current);
    return embedding !== null;
  };

  const initializeCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t("registerFace.errors.browserSupport"));
        setIsLoading(false);
        return;
      }

      setModelLoading(true);
      // Load MediaPipe models instead of face-api.js models
      const modelsLoaded = await loadMediaPipeModels();
      if (!modelsLoaded) {
        setError(t("registerFace.errors.modelLoading"));
        setIsLoading(false);
        return;
      }
      setModelLoading(false);

      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      // Store the stream in the ref for later cleanup
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          setCameraReady(true);
          setCameraLoading(false);
          setIsLoading(false);
        };
      }
    } catch (error) {
      console.error("Error setting up camera:", error);
      setError(t("registerFace.errors.cameraAccess"));
      setIsLoading(false);
      setModelLoading(false);
      setCameraLoading(false);
    }
  };

  const resetCamera = async () => {
    setIsLoading(true);
    setCameraReady(false);
    stopCamera();
    await initializeCamera();
  };

  // Function to capture frame from video as base64 image
  const captureFrame = (): string => {
    if (!videoRef.current) return "";
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };
  // Only showing the relevant changes to the component

  // Update the startFullRegistration function
  const startFullRegistration = async () => {
    if (!videoRef.current || !cameraReady || isRegistering) return;

    try {
      setIsRegistering(true);
      setError(null);
      setRegistrationProgress(0);
      setFaceDetectionAttempts((prev) => prev + 1);

      // Array to store descriptors and images
      const collectedDescriptors: Float32Array[] = [];
      const collectedImages: string[] = [];
      const qualityScores: number[] = [];

      // Number of samples to collect
      const numSamples = 10;
      const minQualityThreshold = 0.65; // Minimum quality threshold for face capture

      // Show toast to indicate start of registration
      toast.info(t("registerFace.toast.startRegistration"));

      // Collect multiple samples of the face
      let sampleCount = 0;
      let attempts = 0;
      const maxAttempts = 30; // Maximum attempts to prevent infinite loops

      while (sampleCount < numSamples && attempts < maxAttempts) {
        attempts++;
        try {
          // Check for multiple faces
          const multipleFaces = await detectMultipleFaces(videoRef.current);
          if (multipleFaces) {
            toast.error(t("registerFace.toast.multipleFaces"));
            throw new Error("Multiple faces detected");
          }

          // Get face quality score
          const qualityScore = await getFaceQualityScore(videoRef.current);

          if (qualityScore === null || qualityScore < minQualityThreshold) {
            console.log(
              `Face quality too low: ${qualityScore}, skipping sample`
            );
            // Don't throw error, just skip this sample and try again
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }

          // Get face embedding using MediaPipe
          const embedding = await getFaceEmbedding(videoRef.current);
          if (!embedding) {
            console.log("Could not get face embedding, skipping sample");
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }

          // Capture the current frame as an image
          const imageBase64 = captureFrame();

          // Add to collections
          collectedDescriptors.push(embedding);
          collectedImages.push(imageBase64);
          qualityScores.push(qualityScore);
          sampleCount++;

          // Update progress
          const newProgress = Math.round((sampleCount / numSamples) * 100);
          setRegistrationProgress(newProgress);
          setCaptureCount(sampleCount);

          // Short delay between captures
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error("Error capturing sample:", error);

          // If we have some samples but can't get more, break after several attempts
          if (sampleCount > 0 && attempts > numSamples * 2) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // If we couldn't collect enough samples
      if (sampleCount < 3) {
        toast.error(t("registerFace.toast.notEnoughSamples"));
        setError(t("registerFace.errors.notEnoughSamples"));
        setIsRegistering(false);
        return;
      }

      // Save the collected data
      await saveRegistrationData(
        collectedImages,
        collectedDescriptors,
        qualityScores
      );
    } catch (error) {
      console.error("Error in face registration:", error);
      setError(t("registerFace.errors.registrationFailed"));
      toast.error(t("registerFace.toast.registrationFailed"));
      setIsRegistering(false);
    }
  };

  // Update the saveRegistrationData function
  const saveRegistrationData = async (
    images: string[],
    faceDescriptors: Float32Array[],
    qualityScores: number[]
  ) => {
    try {
      console.log("Saving face registration data...");
      toast.info(t("registerFace.toast.savingData"));

      // Sort descriptors by quality score to prioritize higher quality samples
      const indexedDescriptors = faceDescriptors.map((desc, i) => ({
        descriptor: desc,
        score: qualityScores[i],
        image: images[i],
      }));

      // Sort by quality score (highest first)
      indexedDescriptors.sort((a, b) => b.score - a.score);

      // Take the top 5 highest quality samples or all if less than 5
      const bestSamples = indexedDescriptors.slice(
        0,
        Math.min(5, indexedDescriptors.length)
      );

      // Extract the sorted descriptors and images
      const bestDescriptors = bestSamples.map((s) => s.descriptor);
      const bestImages = bestSamples.map((s) => s.image);

      // Calculate average embedding from best samples for more robust recognition
      const averageEmbedding = calculateAverageEmbedding(bestDescriptors);

      // Save the average embedding to localStorage using MediaPipe utility function
      storeFaceEmbedding(averageEmbedding);

      // Save to database using the FacialRegistration API
      await saveToServer(bestImages, bestDescriptors);

      console.log("Face registration completed successfully!");
      setShowSuccessOverlay(true);
      toast.success(t("registerFace.toast.registrationSuccess"));

      // Stop the camera after successful registration
      stopCamera();

      // Check if user is also active
      if (userEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active")
          .eq("email", userEmail)
          .single();

        const isActive =
          profile?.active !== "false" && profile?.active !== false;

        setTimeout(async () => {
          if (userEmail) {
            await supabase
              .from("profiles")
              .update({ onboarded: "true" })
              .eq("email", userEmail);
          }
          if (onVerificationComplete) {
            onVerificationComplete();
          } else {
            router.push("/questionnaire");
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving face data:", error);
      setError(t("registerFace.errors.savingFailed"));
      toast.error(t("registerFace.toast.savingFailed"));
      setIsRegistering(false);
    }
  };

  // Helper function to calculate average embedding from multiple samples
  const calculateAverageEmbedding = (
    embeddings: Float32Array[]
  ): Float32Array => {
    if (embeddings.length === 0) {
      throw new Error("No embeddings provided to average");
    }

    const length = embeddings[0].length;
    const average = new Float32Array(length);

    // Sum all embeddings
    for (const embedding of embeddings) {
      for (let i = 0; i < length; i++) {
        average[i] += embedding[i];
      }
    }

    // Divide by count to get average
    for (let i = 0; i < length; i++) {
      average[i] /= embeddings.length;
    }

    return average;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-blue-900">
              {t("registerFace.title")}
            </CardTitle>
            <CardDescription className="text-center text-blue-600/80">
              {t("registerFace.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-blue-50 border-2 border-blue-200">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-600">{getLoadingMessage()}</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-blue-400/20 rounded-lg pointer-events-none" />
              {/* Face detection indicator */}
              <AnimatePresence>
                {faceDetected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {t("registerFace.faceDetected")}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Face detection guide overlay */}
              {!isLoading && !faceDetected && faceDetectionAttempts > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-dashed border-yellow-400 rounded-full opacity-70 flex items-center justify-center">
                    <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      {t("registerFace.positionFace")}
                    </span>
                  </div>
                </div>
              )}
              {/* Registration progress overlay */}
              {isRegistering && !showSuccessOverlay && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-24 h-24 relative">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeDasharray={`${registrationProgress}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {registrationProgress}%
                      </span>
                    </div>
                  </div>
                  <p className="text-white mt-4">
                    {t("registerFace.registeringFace")}
                  </p>
                  <p className="text-white/70 text-sm">
                    {t("registerFace.keepStill")}
                  </p>
                </div>
              )}
              {/* Success overlay */}
              {showSuccessOverlay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center space-y-2">
                    <ShieldCheck className="h-16 w-16 text-blue-400 mx-auto" />
                    <p className="text-blue-900 font-medium">
                      {t("registerFace.registrationSuccessful")}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-700">
                <span>{t("registerFace.captureProgress")}</span>
                <span className="font-medium">
                  {t("registerFace.captureCount", {
                    current: captureCount,
                    total: 10,
                  })}
                </span>
              </div>
              <Progress value={(captureCount / 10) * 100} className="h-2.5" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={resetCamera}
                variant="outline"
                className="flex-none px-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                disabled={
                  isLoading || isCapturing || savingToServer || isRegistering
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={startFullRegistration}
                disabled={
                  isLoading ||
                  isCapturing ||
                  !cameraReady ||
                  savingToServer ||
                  isRegistering ||
                  !faceDetected
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200
                        disabled:bg-blue-400 transition-all duration-200"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("registerFace.buttons.registering")}
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    {t("registerFace.buttons.register")}
                  </>
                )}
              </Button>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium text-blue-800">
                {t("registerFace.tips.title")}
              </h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• {t("registerFace.tips.lighting")}</li>
                <li>• {t("registerFace.tips.lookAtCamera")}</li>
                <li>• {t("registerFace.tips.neutralExpression")}</li>
                <li>• {t("registerFace.tips.glasses")}</li>
                <li>• {t("registerFace.tips.movements")}</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-blue-500 justify-center">
            {t("registerFace.securityNote")}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterFace;
