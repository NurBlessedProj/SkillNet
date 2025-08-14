"use client";
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  loadMediaPipeModels,
  getFaceEmbedding,
  detectMultipleFaces,
  compareWithStoredEmbedding,
} from "@/app/libs/mediapipeUtils";

export interface SupervisionSnapshot {
  image: string;
  timestamp: number;
  hasFace: boolean;
  hasMultipleFaces: boolean;
}

export interface SupervisionResults {
  verified: boolean;
  violations: {
    noFaceDetected: number;
    multipleFacesDetected: number;
    identityMismatch: boolean;
  };
}

export interface PeriodicSupervisionRef {
  verifyTestIntegrity: () => Promise<SupervisionResults | null>;
  getSnapshots: () => SupervisionSnapshot[];
}

interface PeriodicSupervisionProps {
  isActive: boolean;
  testDuration: number; // in seconds
  snapshotCount?: number; // number of snapshots to take
}

const PeriodicSupervision = forwardRef<PeriodicSupervisionRef, PeriodicSupervisionProps>(
  ({ isActive, testDuration, snapshotCount = 10 }, ref) => {
    // References
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const snapshotTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
    
    // States
    const [isInitialized, setIsInitialized] = useState(false);
    const [snapshots, setSnapshots] = useState<SupervisionSnapshot[]>([]);
    
    // Initialize camera and models
    useEffect(() => {
      if (isActive && !isInitialized) {
        initializeSupervision();
      }
      
      return () => {
        cleanupResources();
      };
    }, [isActive]);
    
    // Schedule snapshots based on test duration
    useEffect(() => {
      if (isInitialized && isActive) {
        scheduleSnapshots();
      }
      
      return () => {
        // Clear any pending snapshot timeouts
        snapshotTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        snapshotTimeoutsRef.current = [];
      };
    }, [isInitialized, isActive, testDuration, snapshotCount]);
    
    const initializeSupervision = async () => {
      try {
        console.log("Initializing periodic supervision...");
        
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
          
          console.log("Periodic supervision initialized successfully");
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing supervision:", error);
      }
    };
    
    const cleanupResources = () => {
      // Clear any pending snapshot timeouts
      snapshotTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      snapshotTimeoutsRef.current = [];
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      console.log("Supervision resources cleaned up");
    };
    
    const scheduleSnapshots = () => {
      // Clear any existing timeouts
      snapshotTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      snapshotTimeoutsRef.current = [];
      
      // Calculate intervals for snapshots
      const interval = Math.floor(testDuration * 1000 / snapshotCount);
      
      console.log(`Scheduling ${snapshotCount} snapshots at ${interval}ms intervals`);
      
      // Take first snapshot immediately
      takeSnapshot();
      
      // Schedule the rest of the snapshots
      for (let i = 1; i < snapshotCount; i++) {
        const timeout = setTimeout(() => {
          takeSnapshot();
        }, i * interval);
        
        snapshotTimeoutsRef.current.push(timeout);
      }
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
        
        // Get image as base64 (with reduced quality for storage efficiency)
        const imageData = canvas.toDataURL("image/jpeg", 0.7);
        
        // Check for faces
        const multipleFaces = await detectMultipleFaces(video);
        const embedding = await getFaceEmbedding(video);
        const hasFace = embedding !== null;
        
        // Add snapshot to collection
        const newSnapshot = {
          image: imageData,
          timestamp: Date.now(),
          hasFace,
          hasMultipleFaces: multipleFaces
        };
        
        setSnapshots(prev => [...prev, newSnapshot]);
        
        console.log(`Snapshot taken: face detected: ${hasFace}, multiple faces: ${multipleFaces}`);
      } catch (error) {
        console.error("Error taking snapshot:", error);
      }
    };
    
    // Function to verify all snapshots at the end of the test
    const verifyTestIntegrity = async (): Promise<SupervisionResults | null> => {
      if (snapshots.length === 0) return null;
      
      try {
        console.log("Verifying test integrity with", snapshots.length, "snapshots");
        
        // Count violations
        const noFaceDetected = snapshots.filter(s => !s.hasFace).length;
        const multipleFacesDetected = snapshots.filter(s => s.hasMultipleFaces).length;
        
        // Check identity matches for snapshots with faces
        let identityMismatch = false;
        
        // Get snapshots with faces
        const snapshotsWithFaces = snapshots.filter(s => s.hasFace && !s.hasMultipleFaces);
        
        if (snapshotsWithFaces.length > 0) {
          // Create a temporary video element for verification
          const tempVideo = document.createElement("video");
          
          // Check a sample of snapshots (up to 3)
          const samplesToCheck = snapshotsWithFaces.length > 3 
            ? snapshotsWithFaces.filter((_, i) => i % Math.ceil(snapshotsWithFaces.length / 3) === 0)
            : snapshotsWithFaces;
          
          for (const snapshot of samplesToCheck) {
            // Create a blob from the base64 image
            const response = await fetch(snapshot.image);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Load the image into the video element
            tempVideo.src = url;
            await new Promise<void>(resolve => {
              tempVideo.onloadeddata = () => resolve();
            });
            
            // Get face embedding
            const embedding = await getFaceEmbedding(tempVideo);
            
            if (embedding) {
              // Compare with stored embedding
              const isMatch = await compareWithStoredEmbedding(embedding);
              
              if (!isMatch) {
                identityMismatch = true;
                break;
              }
            }
            
            // Clean up URL
            URL.revokeObjectURL(url);
          }
        }
        
        const results = {
          verified: noFaceDetected < snapshots.length * 0.3 && // Allow up to 30% of snapshots without faces
                   multipleFacesDetected < 3 && // Allow up to 2 snapshots with multiple faces
                   !identityMismatch, // No identity mismatches
          violations: {
            noFaceDetected,
            multipleFacesDetected,
            identityMismatch
          }
        };
        
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
    }));
    
    // Hidden video element for capturing snapshots
    return (
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
    );
  }
);

PeriodicSupervision.displayName = "PeriodicSupervision";

export default PeriodicSupervision;