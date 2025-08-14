"use client";

import * as faceapi from "face-api.js";
import { toast } from "sonner";

// Flag to track if models are loaded
let modelsLoaded = false;

// Load face-api.js models
export const loadModels = async () => {
  try {
    if (modelsLoaded) {
      return true;
    }

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    ]);

    console.log("Face models loaded successfully");
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error("Error loading face models:", error);
    return false;
  }
};

// Get face descriptor from video element
export const getFaceDescriptor = async (videoElement: HTMLVideoElement) => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    // Check lighting conditions first
    const lighting = await assessLightingConditions(videoElement);

    // Use different detection parameters based on lighting
    let minConfidence = 0.5; // Default confidence threshold

    // Adjust confidence threshold based on lighting conditions
    if (lighting.lightingLevel < 30) {
      // Lower confidence threshold in poor lighting
      minConfidence = 0.3;
    }

    // Detect all faces in the frame with adjusted parameters
    const detections = await faceapi
      .detectAllFaces(
        videoElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    // If no faces detected
    if (detections.length === 0) {
      return null;
    }

    // Return the descriptor of the first face as a regular array
    return Array.from(detections[0].descriptor);
  } catch (error) {
    console.error("Error getting face descriptor:", error);
    return null;
  }
};

// Detect if there are multiple faces in the frame
export const detectMultipleFaces = async (videoElement: HTMLVideoElement) => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    // Check lighting conditions first
    const lighting = await assessLightingConditions(videoElement);

    // Use different detection parameters based on lighting
    let minConfidence = 0.5; // Default confidence threshold

    // Adjust confidence threshold based on lighting conditions
    if (lighting.lightingLevel < 30) {
      // Lower confidence threshold in poor lighting
      minConfidence = 0.3;
    }

    const detections = await faceapi.detectAllFaces(
      videoElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence })
    );

    return detections.length > 1;
  } catch (error) {
    console.error("Error detecting multiple faces:", error);
    return false;
  }
};

// Assess lighting conditions from video element
export const assessLightingConditions = async (
  videoElement: HTMLVideoElement
): Promise<{
  lightingLevel: number; // 0-100 scale
  isAdequate: boolean;
  message: string;
}> => {
  try {
    // Create a canvas to analyze the video frame
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return {
        lightingLevel: 50,
        isAdequate: true,
        message: "Unable to analyze lighting",
      };
    }

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Get image data from the canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    let pixelCount = 0;

    // Sample pixels (every 20th pixel to save processing)
    for (let i = 0; i < pixels.length; i += 20) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate perceived brightness using weighted RGB values
      // Formula: (0.299*R + 0.587*G + 0.114*B)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
      pixelCount++;
    }

    // Calculate average brightness (0-255)
    const avgBrightness = totalBrightness / pixelCount;

    // Convert to 0-100 scale
    const lightingLevel = Math.round((avgBrightness / 255) * 100);

    // Determine if lighting is adequate
    let isAdequate = true;
    let message = "Lighting is good";

    if (lightingLevel < 15) {
      isAdequate = false;
      message = "Lighting is too dark. Please move to a brighter area.";
    } else if (lightingLevel < 30) {
      isAdequate = false;
      message = "Lighting is dim. Try moving to a brighter area.";
    } else if (lightingLevel > 90) {
      isAdequate = false;
      message =
        "Lighting is too bright. Try reducing direct light on your face.";
    }

    return { lightingLevel, isAdequate, message };
  } catch (error) {
    console.error("Error assessing lighting:", error);
    return {
      lightingLevel: 50,
      isAdequate: true,
      message: "Unable to analyze lighting conditions",
    };
  }
};

// Store face descriptors in localStorage
export const storeFaceDescriptors = (descriptors: number[][]) => {
  try {
    localStorage.setItem("faceDescriptors", JSON.stringify(descriptors));
    return true;
  } catch (error) {
    console.error("Error storing face descriptors:", error);
    return false;
  }
};

// Calculate Euclidean distance between two descriptors
export const calculateDistance = (desc1: number[], desc2: number[]) => {
  // Handle descriptor length mismatch by using the shorter length
  if (desc1.length !== desc2.length) {
    console.warn(
      `Descriptor length mismatch: ${desc1.length} vs ${desc2.length}`
    );
    const minLength = Math.min(desc1.length, desc2.length);

    // Use only the first minLength elements from both descriptors
    const trimmedDesc1 = desc1.slice(0, minLength);
    const trimmedDesc2 = desc2.slice(0, minLength);

    return Math.sqrt(
      trimmedDesc1.reduce(
        (sum, val, i) => sum + Math.pow(val - trimmedDesc2[i], 2),
        0
      )
    );
  }

  // Normal case when lengths match
  return Math.sqrt(
    desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0)
  );
};

// Compare current face descriptor with stored descriptors
export const compareWithStoredDescriptors = async (
  currentDescriptor: number[]
) => {
  try {
    const storedDescriptorsString = localStorage.getItem("faceDescriptors");
    if (!storedDescriptorsString) {
      toast.error("No face data found. Please register your face first.");
      return false;
    }

    const storedDescriptors = JSON.parse(storedDescriptorsString);

    // Calculate distances between current descriptor and all stored descriptors
    const distances = storedDescriptors.map((storedDesc: number[]) =>
      calculateDistance(currentDescriptor, storedDesc)
    );

    console.log("Face similarity distances:", distances);

    // Find the best match (minimum distance)
    const bestMatchDistance = Math.min(...distances);
    console.log("Best match distance:", bestMatchDistance);

    // Determine threshold based on descriptor length
    let threshold;
    if (currentDescriptor.length !== storedDescriptors[0].length) {
      // More lenient threshold for mismatched descriptors
      threshold = 2000;
    } else if (currentDescriptor.length === 128) {
      // Standard threshold for face-api.js 128-length descriptors
      threshold = 0.6;
    } else {
      // Adjusted threshold for other descriptor lengths
      threshold = 950;
    }

    const isMatch = bestMatchDistance < threshold;
    console.log("Is face match:", isMatch, "Threshold:", threshold);

    return isMatch;
  } catch (error) {
    console.error("Error comparing face descriptors:", error);
    return false;
  }
};

// Register a new face with multiple samples for better recognition
export const registerFace = async (
  videoElement: HTMLVideoElement,
  numSamples = 10
) => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const descriptors: number[][] = [];

    // Check lighting conditions first
    const lighting = await assessLightingConditions(videoElement);
    if (!lighting.isAdequate) {
      toast.warning(lighting.message);
      if (lighting.lightingLevel < 20) {
        // If lighting is very poor, don't proceed
        toast.error(
          "Cannot register face in poor lighting. Please improve lighting conditions."
        );
        return false;
      }
    }

    // Show toast to indicate start of registration
    toast.info(`Starting face registration. Please keep still...`);

    // Collect multiple samples of the face
    for (let i = 0; i < numSamples; i++) {
      // Get descriptor with adjusted parameters for lighting
      let minConfidence = 0.5; // Default confidence threshold
      if (lighting.lightingLevel < 30) {
        // Lower confidence threshold in poor lighting
        minConfidence = 0.3;
      }

      // Detect face with adjusted parameters
      const detections = await faceapi
        .detectAllFaces(
          videoElement,
          new faceapi.SsdMobilenetv1Options({ minConfidence })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        toast.error(
          "Could not detect face clearly. Please ensure good lighting and face position."
        );
        return false;
      }

      const descriptor = Array.from(detections[0].descriptor);
      descriptors.push(descriptor);

      // Show progress toast every few samples
      if ((i + 1) % 3 === 0 || i === numSamples - 1) {
        toast.success(`Captured ${i + 1}/${numSamples} samples`);
      }

      // Short delay between captures
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Store the descriptors
    console.log("Storing face descriptors:", descriptors);
    const success = storeFaceDescriptors(descriptors);

    if (!success) {
      throw new Error("Failed to store face data");
    }

    return true;
  } catch (error) {
    console.error("Error registering face:", error);
    return false;
  }
};
