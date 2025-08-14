import React, { useEffect, useRef, useState } from "react";
import MediaPipeFaceService from "./MediaPipeFaceDetection";
import { Loader2, ShieldCheck, AlertTriangle, RefreshCw, User, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface AutoFaceVerificationProps {
  onVerificationComplete: (success: boolean) => void;
  maxAttempts?: number;
}

const AutoFaceVerification: React.FC<AutoFaceVerificationProps> = ({
  onVerificationComplete,
  maxAttempts = 3,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<
    "initializing" | "verifying" | "success" | "failure" | "error" | "lighting_issue"
  >("initializing");
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [lightingLevel, setLightingLevel] = useState(0);
  const [facePosition, setFacePosition] = useState({ x: 0.5, y: 0.5, size: 0 }); // Track face position for guidance
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    initializeCamera();

    return () => {
      cleanupCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setVerificationStatus("initializing");
      
      // Clean up any existing stream
      cleanupCamera();

      // Initialize MediaPipe face detection
      await MediaPipeFaceService.initialize();

      // Get user media with improved constraints for low light
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: 640, 
          height: 480,
          // Add advanced constraints to help with low light
         
        },
      });

      // Save stream reference for cleanup
      streamRef.current = stream;

      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start continuous face tracking for better guidance
        startFaceTracking();
        
        // Start verification after a short delay to allow camera to initialize
        setTimeout(() => {
          checkLightingConditions();
        }, 1000);
      }
    } catch (error) {
      console.error("Error initializing camera:", error);
      setErrorMessage("Could not access camera. Please check permissions.");
      setVerificationStatus("error");
    }
  };

  const cleanupCamera = () => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startFaceTracking = () => {
    if (!videoRef.current) return;
    
    const trackFace = async () => {
      if (!videoRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(trackFace);
        return;
      }
      
      try {
        // Detect face
        const face = await MediaPipeFaceService.detectFace(videoRef.current);
        
        // Update canvas with face position guidance
        updateCanvas(face);
        
        // Check lighting periodically
        const lighting = await MediaPipeFaceService.assessLightingConditions(videoRef.current);
        setLightingLevel(lighting.lightingLevel);
        
        // If we're in lighting issue state, check if lighting has improved
        if (verificationStatus === "lighting_issue" && lighting.isAdequate) {
          setVerificationStatus("verifying");
          verifyUser();
        }
      } catch (error) {
        console.error("Error in face tracking:", error);
      }
      
      animationFrameRef.current = requestAnimationFrame(trackFace);
    };
    
    animationFrameRef.current = requestAnimationFrame(trackFace);
  };

  const updateCanvas = (face: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // If no face detected, draw guidance for user to center their face
    if (!face) {
      // Draw target area in the center
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const centerX = canvasRef.current.width / 2;
      const centerY = canvasRef.current.height / 2;
      const targetSize = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.4;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, targetSize, targetSize * 1.3, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add text instruction
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Position your face in the oval', centerX, centerY + targetSize * 1.5);
      return;
    }
    
    // If face detected, show guidance based on face position
    if (face.box) {
      const { xMin, yMin, width, height } = face.box;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Convert normalized coordinates to canvas coordinates
      const x = xMin * canvasRef.current.width;
      const y = yMin * canvasRef.current.height;
      const w = width * canvasRef.current.width;
      const h = height * canvasRef.current.height;
      
      // Update face position state
      setFacePosition({
        x: xMin + width/2,
        y: yMin + height/2,
        size: (width + height) / 2
      });
      
      // Draw face outline
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Determine if face is well-positioned
      const centerX = canvasRef.current.width / 2;
      const centerY = canvasRef.current.height / 2;
      const idealSize = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.4;
      
      const distanceFromCenter = Math.sqrt(
        Math.pow((x + w/2) - centerX, 2) + 
        Math.pow((y + h/2) - centerY, 2)
      );
      
      const isWellPositioned = 
        distanceFromCenter < idealSize * 0.3 && // Close to center
        w > idealSize * 0.7 && w < idealSize * 1.3; // Right size
      
      // Add guidance text based on face position
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      
      if (!isWellPositioned) {
        if (w < idealSize * 0.7) {
          ctx.fillText('Move closer to the camera', centerX, canvasRef.current.height - 40);
        } else if (w > idealSize * 1.3) {
          ctx.fillText('Move further from the camera', centerX, canvasRef.current.height - 40);
        }
        
        if (distanceFromCenter > idealSize * 0.3) {
          ctx.fillText('Center your face in the frame', centerX, canvasRef.current.height - 20);
        }
      }
    }
  };

  const checkLightingConditions = async () => {
    if (!videoRef.current) return;
    
    try {
      const lighting = await MediaPipeFaceService.assessLightingConditions(videoRef.current);
      setLightingLevel(lighting.lightingLevel);
      
      if (!lighting.isAdequate) {
        setVerificationStatus("lighting_issue");
        setErrorMessage(lighting.message);
        
        // If lighting is very poor, wait for it to improve before proceeding
        if (lighting.lightingLevel < 20) {
          // Continue monitoring lighting via the face tracking loop
          return;
        }
      }
      
      // If lighting is acceptable or just slightly dim, proceed with verification
      verifyUser();
    } catch (error) {
      console.error("Error checking lighting:", error);
      verifyUser(); // Proceed anyway
    }
  };

  const verifyUser = async () => {
    if (!videoRef.current) return;

    setVerificationStatus("verifying");
    setAttempts((prev) => prev + 1);
    
    try {
      // First check: detect if there's a face in the frame
      const faceCount = await MediaPipeFaceService.detectMultipleFaces(videoRef.current);
      
      if (faceCount === 0) {
        setErrorMessage("No face detected. Please position yourself in front of the camera.");
        handleVerificationFailure();
        return;
      }
      
      if (faceCount > 1) {
        setErrorMessage("Multiple faces detected. Only one person should be visible.");
        handleVerificationFailure();
        return;
      }

      // Second check: verify if it's the registered user
      const currentFaceDescriptor = await MediaPipeFaceService.getFaceEmbedding(videoRef.current);
      
      if (!currentFaceDescriptor) {
        // Check if it's a lighting issue
        const lighting = await MediaPipeFaceService.assessLightingConditions(videoRef.current);
        if (lighting.lightingLevel < 30) {
          setVerificationStatus("lighting_issue");
          setErrorMessage(lighting.message);
          
          // Don't count this as an attempt if it's clearly a lighting issue
          setAttempts((prev) => prev - 1);
          return;
        }
        
        setErrorMessage("Could not extract face features. Please ensure good lighting and face is clearly visible.");
        handleVerificationFailure();
        return;
      }

      // Get stored descriptors from localStorage
      const storedDescriptorsString = localStorage.getItem("faceDescriptors");
      if (!storedDescriptorsString) {
        setErrorMessage("No registered face found. Please register your face first.");
        handleVerificationFailure();
        return;
      }

      // Parse stored descriptors
      const storedDescriptors = JSON.parse(storedDescriptorsString);
      
      // Compare current face with stored descriptors
      const isMatch = compareDescriptors(currentFaceDescriptor, storedDescriptors);
      
      if (!isMatch) {
        setErrorMessage("Face does not match registered user.");
        handleVerificationFailure();
      } else {
        handleVerificationSuccess();
      }
    } catch (error) {
      console.error("Error during face verification:", error);
      setErrorMessage("Verification error. Please try again.");
      handleVerificationFailure();
    }
  };

  const compareDescriptors = (
    currentDescriptor: Float32Array,
    storedDescriptors: number[][]
  ): boolean => {
    // Convert stored descriptors back to Float32Array
    const storedFloat32Arrays = storedDescriptors.map(
      (arr) => new Float32Array(arr)
    );

    // Calculate similarity with each stored descriptor
    for (const storedDescriptor of storedFloat32Arrays) {
      const similarity = calculateSimilarity(currentDescriptor, storedDescriptor);
      
      // Use adaptive threshold based on lighting conditions
      let threshold = 0.7; // Default threshold
      
      // More lenient threshold in poor lighting
      if (lightingLevel < 40) {
        threshold = 0.6;
      } else if (lightingLevel > 85) {
        // More strict threshold in very bright conditions
        threshold = 0.75;
      }
      
      if (similarity > threshold) {
        return true;
      }
    }
    return false;
  };

  const calculateSimilarity = (
    descriptor1: Float32Array,
    descriptor2: Float32Array
  ): number => {
    // Simple cosine similarity calculation
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      mag1 += descriptor1[i] * descriptor1[i];
      mag2 += descriptor2[i] * descriptor2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    return dotProduct / (mag1 * mag2);
  };

  const handleVerificationSuccess = () => {
    setVerificationStatus("success");
    // Short delay to show success state before proceeding
    setTimeout(() => {
      cleanupCamera();
      onVerificationComplete(true);
    }, 1500);
  };

  const handleVerificationFailure = () => {
    if (attempts >= maxAttempts) {
      setVerificationStatus("failure");
      // Notify parent component after showing failure state
      setTimeout(() => {
        cleanupCamera();
        onVerificationComplete(false);
      }, 3000);
    } else {
      // Retry verification after a short delay
      setTimeout(() => {
        verifyUser();
      }, 2000);
    }
  };

  const retryVerification = () => {
    setAttempts(0);
    initializeCamera();
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-blue-800 flex items-center justify-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Identity Verification
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
          {/* Main video display */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Canvas overlay for face guidance */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Lighting indicator */}
          <div className="absolute top-2 right-2 flex items-center bg-black/40 rounded-full px-2 py-1">
            {lightingLevel < 30 ? (
              <Moon className="h-4 w-4 text-yellow-300 mr-1" />
            ) : lightingLevel > 85 ? (
              <Sun className="h-4 w-4 text-yellow-500 mr-1" />
            ) : (
              <Sun className="h-4 w-4 text-green-400 mr-1" />
            )}
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  lightingLevel < 30 ? 'bg-yellow-300' : 
                  lightingLevel > 85 ? 'bg-yellow-500' : 
                  'bg-green-400'
                }`} 
                style={{ width: `${lightingLevel}%` }}
              />
            </div>
          </div>
          
          {/* Overlay based on verification status */}
          <div className="absolute inset-0 flex items-center justify-center">
            {verificationStatus === "initializing" && (
              <div className="bg-black/50 w-full h-full flex flex-col items-center justify-center text-white">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p>Initializing camera...</p>
              </div>
            )}
            
            {verificationStatus === "lighting_issue" && (
              <div className="bg-black/50 w-full h-full flex flex-col items-center justify-center text-white">
                {lightingLevel < 30 ? (
                  <Moon className="h-16 w-16 text-yellow-300 mb-4" />
                ) : (
                  <Sun className="h-16 w-16 text-yellow-500 mb-4" />
                )}
                <p className="text-xl font-medium mb-2">Lighting Issue Detected</p>
                <p className="text-center max-w-xs mb-4">{errorMessage}</p>
                <Progress value={lightingLevel} className="w-64 mb-2" />
                <p className="text-sm">Waiting for better lighting conditions...</p>
              </div>
            )}
            
            {verificationStatus === "verifying" && (
              <div className="bg-black/30 w-full h-full flex flex-col items-center justify-center text-white">
                <div className="h-32 w-32 border-4 border-blue-500/50 border-dashed rounded-full animate-spin flex items-center justify-center">
                  <User className="h-16 w-16 text-blue-400" />
                </div>
                <p className="mt-4 font-medium text-lg">Verifying your identity...</p>
                <p className="text-sm opacity-80">Please look directly at the camera</p>
                <p className="text-xs mt-4">Attempt {attempts} of {maxAttempts}</p>
              </div>
            )}
            
            {verificationStatus === "success" && (
              <div className="bg-green-500/80 w-full h-full flex flex-col items-center justify-center text-white">
                <div className="rounded-full bg-white/20 p-4">
                  <ShieldCheck className="h-16 w-16" />
                </div>
                <p className="mt-4 font-bold text-xl">Verification Successful</p>
              </div>
            )}
            
            {verificationStatus === "failure" && (
              <div className="bg-red-500/80 w-full h-full flex flex-col items-center justify-center text-white">
                <div className="rounded-full bg-white/20 p-4">
                  <AlertTriangle className="h-16 w-16" />
                </div>
                <p className="mt-4 font-bold text-xl">Verification Failed</p>
                <p className="mt-2 text-center max-w-xs">{errorMessage}</p>
              </div>
            )}
            
            {verificationStatus === "error" && (
              <div className="bg-amber-500/80 w-full h-full flex flex-col items-center justify-center text-white">
                <div className="rounded-full bg-white/20 p-4">
                  <AlertTriangle className="h-16 w-16" />
                </div>
                <p className="mt-4 font-bold text-xl">Camera Error</p>
                <p className="mt-2 text-center max-w-xs">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          {verificationStatus === "initializing" && "Setting up secure verification..."}
          {verificationStatus === "verifying" && "Please remain still while we verify your identity"}
          {verificationStatus === "success" && "Identity confirmed! Proceeding to assessment..."}
          {verificationStatus === "failure" && "We couldn't verify your identity after multiple attempts"}
          {verificationStatus === "error" && "There was a problem accessing your camera"}
          {verificationStatus === "lighting_issue" && "Please adjust lighting for better face detection"}
        </div>
      </CardContent>

      <CardFooter className="flex justify-center">
        {(verificationStatus === "failure" || verificationStatus === "error") && (
          <Button 
            onClick={retryVerification}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Verification
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AutoFaceVerification;