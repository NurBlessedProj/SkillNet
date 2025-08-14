"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { toast } from "sonner";
import {
  loadMediaPipeModels,
  getFaceEmbedding,
  getFaceQualityScore,
  detectMultipleFaces,
  compareWithStoredEmbedding,
} from "@/app/libs/mediapipeUtils";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

interface TestSupervisionProps {
  isActive: boolean;
  onViolationDetected?: (reason: string) => void;
  testDuration: number; // in seconds
  testId?: string;
}

export interface TestSupervisionResults {
  verified: boolean;
  violations: {
    noFaceDetected: number;
    multipleFacesDetected: number;
    identityMismatch: boolean;
    lowQualityFaces: number;
  };
  qualityMetrics?: {
    averageQuality: number;
    highQualitySnapshots: number;
    mediumQualitySnapshots: number;
    lowQualitySnapshots: number;
  };
}

export interface TestSupervisionRef {
  verifyTestIntegrity: () => Promise<TestSupervisionResults | null>;
  getSnapshots: () => any[];
  getVerificationResults: () => TestSupervisionResults | null;
}

const TestSupervision = forwardRef<TestSupervisionRef, TestSupervisionProps>(
  ({ isActive, onViolationDetected, testDuration, testId }, ref) => {
    // References
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // States
    const [isInitialized, setIsInitialized] = useState(false);
    const [snapshots, setSnapshots] = useState<
      {
        image: string;
        timestamp: number;
        hasFace: boolean;
        hasMultipleFaces: boolean;
        faceQuality: number | null;
        faceVerified: boolean | null;
      }[]
    >([]);
    const [verificationResults, setVerificationResults] =
      useState<TestSupervisionResults | null>(null);

    // Initialize camera and models
    useEffect(() => {
      if (isActive && !isInitialized) {
        initializeSupervision();
      }

      return () => {
        cleanupResources();
      };
    }, [isActive]);

    // Set up snapshot interval based on test duration
    useEffect(() => {
      if (isInitialized && isActive && !snapshotIntervalRef.current) {
        // Calculate interval - aim for approximately 10-20 snapshots during the test
        const snapshotsCount = Math.min(
          Math.max(10, Math.floor(testDuration / 60)),
          20
        );
        const interval = Math.floor((testDuration * 1000) / snapshotsCount);

        console.log(
          `Setting up snapshot interval: ${interval}ms (${snapshotsCount} snapshots)`
        );

        // Take first snapshot immediately
        takeSnapshot();

        // Set up interval for remaining snapshots
        snapshotIntervalRef.current = setInterval(() => {
          takeSnapshot();
        }, interval);
      }

      return () => {
        if (snapshotIntervalRef.current) {
          clearInterval(snapshotIntervalRef.current);
          snapshotIntervalRef.current = null;
        }
      };
    }, [isInitialized, isActive, testDuration]);

    const initializeSupervision = async () => {
      try {
        // Load MediaPipe models
        await loadMediaPipeModels();

        // Set up camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadeddata = () => resolve();
            }
          });

          console.log("Test supervision initialized successfully");
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing test supervision:", error);
        // Don't show toast - this happens in the background
      }
    };

    const cleanupResources = () => {
      // Clear snapshot interval
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      console.log("Test supervision resources cleaned up");
    };

    const takeSnapshot = async () => {
      if (!videoRef.current || !isInitialized || !isActive) return;

      try {
        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image as base64
        const imageData = canvas.toDataURL("image/jpeg", 0.7); // Lower quality for storage efficiency

        // Check for multiple faces
        const multipleFaces = await detectMultipleFaces(video);

        // Get face quality score - new addition
        const qualityScore = !multipleFaces
          ? await getFaceQualityScore(video)
          : null;

        // Get face embedding with quality threshold of 0.5 (more lenient for testing)
        // We're using a lower threshold here compared to registration (0.65)
        const embedding = await getFaceEmbedding(video, undefined, 0.5);
        const hasFace = embedding !== null;

        // If we have a face, verify it against stored embedding
        let faceVerified = null;
        if (hasFace && embedding) {
          // Use a threshold of 0.65 for verification (stricter than before but not as strict as registration)
          faceVerified = await compareWithStoredEmbedding(embedding, 0.65);
        }

        // Add snapshot to collection
        setSnapshots((prev) => [
          ...prev,
          {
            image: imageData,
            timestamp: Date.now(),
            hasFace,
            hasMultipleFaces: multipleFaces,
            faceQuality: qualityScore,
            faceVerified,
          },
        ]);

        console.log(
          `Snapshot taken: face detected: ${hasFace}, multiple faces: ${multipleFaces}, quality: ${qualityScore?.toFixed(
            2
          )}, verified: ${faceVerified}`
        );
      } catch (error) {
        console.error("Error taking snapshot:", error);
      }
    };

    // Function to verify all snapshots at the end of the test
    const verifyTestIntegrity =
      async (): Promise<TestSupervisionResults | null> => {
        if (snapshots.length === 0) return null;

        try {
          console.log(
            "Verifying test integrity with",
            snapshots.length,
            "snapshots"
          );

          // Count violations
          const noFaceDetected = snapshots.filter((s) => !s.hasFace).length;
          const multipleFacesDetected = snapshots.filter(
            (s) => s.hasMultipleFaces
          ).length;
          const lowQualityFaces = snapshots.filter(
            (s) => s.faceQuality !== null && s.faceQuality < 0.5
          ).length;

          // Get snapshots with faces (excluding multiple faces)
          const snapshotsWithFaces = snapshots.filter(
            (s) => s.hasFace && !s.hasMultipleFaces
          );

          // Calculate quality metrics
          const qualityScores = snapshotsWithFaces
            .map((s) => s.faceQuality)
            .filter((q): q is number => q !== null);

          const averageQuality =
            qualityScores.length > 0
              ? qualityScores.reduce((sum, q) => sum + q, 0) /
                qualityScores.length
              : 0;

          const highQualitySnapshots = qualityScores.filter(
            (q) => q >= 0.7
          ).length;
          const mediumQualitySnapshots = qualityScores.filter(
            (q) => q >= 0.5 && q < 0.7
          ).length;
          const lowQualitySnapshots = qualityScores.filter(
            (q) => q < 0.5
          ).length;

          // Check identity matches - use the pre-calculated verification results
          const identityMismatches = snapshotsWithFaces.filter(
            (s) => s.faceVerified === false
          ).length;
          const identityMatches = snapshotsWithFaces.filter(
            (s) => s.faceVerified === true
          ).length;

          // Consider identity mismatch if more than 30% of snapshots with faces are mismatches
          const identityMismatch =
            snapshotsWithFaces.length > 0 &&
            identityMismatches > 0 &&
            identityMismatches / snapshotsWithFaces.length > 0.3;

          const results = {
            verified:
              noFaceDetected < snapshots.length * 0.4 && // Allow up to 40% of snapshots without faces
              multipleFacesDetected < 3 && // Allow up to 2 snapshots with multiple faces
              !identityMismatch, // No significant identity mismatches
            violations: {
              noFaceDetected,
              multipleFacesDetected,
              identityMismatch,
              lowQualityFaces,
            },
            qualityMetrics: {
              averageQuality,
              highQualitySnapshots,
              mediumQualitySnapshots,
              lowQualitySnapshots,
            },
          };

          console.log("Test verification results:", results);
          setVerificationResults(results);
          return results;
        } catch (error) {
          console.error("Error verifying test integrity:", error);
          return null;
        }
      };

    // Expose functions through ref
    useImperativeHandle(ref, () => ({
      verifyTestIntegrity,
      getSnapshots: () => snapshots,
      getVerificationResults: () => verificationResults,
    }));

    // Hidden video element for capturing snapshots
    return (
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
    );
  }
);

TestSupervision.displayName = "TestSupervision";

export default TestSupervision;
