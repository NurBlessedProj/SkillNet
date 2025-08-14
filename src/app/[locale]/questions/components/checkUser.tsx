"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Check, X } from "lucide-react";
import {
  loadModels,
  getFaceDescriptor,
  compareWithStoredDescriptors,
} from "../../../libs/faceUtils";
import Swal from "sweetalert2";

export default function Verify() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    async function setupCamera() {
      try {
        await loadModels();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error setting up camera:", error);
      }
    }

    setupCamera();

    // Cleanup camera stream on unmount
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const verifyIdentity = async () => {
    if (!videoRef.current) return;

    try {
      const storedDescriptorsJSON = localStorage.getItem("faceDescriptors");
      if (!storedDescriptorsJSON) {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: "No face data found. Please register first.",
        });
        return;
      }

      // Get the current face descriptor
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        // No face detected
        return;
      }

      // Compare with stored descriptors
      const isMatch = await compareWithStoredDescriptors(descriptor);
      setVerificationResult(isMatch);

      // Show SweetAlert2 on verification failure
      if (!isMatch) {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: "Face verification was unsuccessful. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error verifying face:", error);
    }
  };

  // Take a picture and verify face every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      verifyIdentity();
    }, 30000); // 30,000 ms = 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white/10 backdrop-blur-lg">
        <h1 className="text-2xl font-bold text-center text-white">
          Face Verification
        </h1>

        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4">
          {verificationResult !== null && (
            <div
              className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                verificationResult ? "text-green-400" : "text-red-400"
              }`}
            >
              {verificationResult ? (
                <>
                  <Check className="h-6 w-6" />
                  <span>Verification Successful</span>
                </>
              ) : (
                <>
                  <X className="h-6 w-6" />
                  <span>Verification Failed</span>
                </>
              )}
            </div>
          )}

          <Button
            onClick={verifyIdentity}
            disabled={isLoading}
            className="w-full"
          >
            <Camera className="mr-2 h-4 w-4" />
            Verify Face
          </Button>
        </div>
      </Card>
    </div>
  );
}
