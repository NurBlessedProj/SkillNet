import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;

/**
 * Loads the MediaPipe models for face detection and recognition
 */
export const loadMediaPipeModels = async (): Promise<boolean> => {
  try {
    console.log("Loading MediaPipe models...");

    // Initialize the face landmarker
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 5, // Increased from 1 to 5 to detect multiple faces
    });

    console.log("MediaPipe models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading MediaPipe models:", error);
    return false;
  }
};

/**
 * Detects if there are multiple faces in the video frame
 */
export const detectMultipleFaces = async (
  videoElement: HTMLVideoElement
): Promise<boolean> => {
  if (!faceLandmarker) {
    console.warn("Face landmarker not initialized");
    return false;
  }

  try {
    const results = faceLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );

    // If more than one face is detected
    return results.faceLandmarks && results.faceLandmarks.length > 1;
  } catch (error) {
    console.error("Error detecting multiple faces:", error);
    return false;
  }
};

/**
 * Checks if the face is properly positioned and of good quality
 * Returns a quality score between 0-1, or null if no face detected
 */
export const getFaceQualityScore = async (
  videoElement: HTMLVideoElement
): Promise<number | null> => {
  if (!faceLandmarker) {
    console.warn("Face landmarker not initialized");
    return null;
  }

  try {
    const results = faceLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );

    // If no face is detected
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.faceLandmarks[0];

    // Calculate face size relative to frame
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Get face bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    // Calculate face width and height relative to frame
    const faceWidth = (maxX - minX) * videoWidth;
    const faceHeight = (maxY - minY) * videoHeight;

    // Calculate face center position
    const faceCenterX = (minX + maxX) / 2;
    const faceCenterY = (minY + maxY) / 2;

    // Calculate how centered the face is (0-1, 1 being perfectly centered)
    const centeringScore =
      1 -
      (Math.abs(faceCenterX - 0.5) * 2 + Math.abs(faceCenterY - 0.5) * 2) / 2;

    // Calculate face size score (0-1, 1 being optimal size)
    // Ideal face should take up about 30-60% of frame height
    const idealMinSize = 0.3;
    const idealMaxSize = 0.6;
    const relativeFaceSize = faceHeight / videoHeight;
    let sizeScore;

    if (relativeFaceSize < idealMinSize) {
      // Face too small
      sizeScore = relativeFaceSize / idealMinSize;
    } else if (relativeFaceSize > idealMaxSize) {
      // Face too large
      sizeScore = 1 - (relativeFaceSize - idealMaxSize) / (1 - idealMaxSize);
    } else {
      // Face is ideal size
      sizeScore = 1;
    }

    // Calculate face rotation (using eye landmarks as reference)
    // This is a simplified approach - we're looking for eyes to be roughly level
    const leftEyeIndex = 159; // Approximate index for left eye
    const rightEyeIndex = 386; // Approximate index for right eye

    // If we have enough landmarks
    let rotationScore = 1;
    if (landmarks.length > Math.max(leftEyeIndex, rightEyeIndex)) {
      const leftEye = landmarks[leftEyeIndex];
      const rightEye = landmarks[rightEyeIndex];

      // Calculate angle
      const dx = rightEye.x - leftEye.x;
      const dy = rightEye.y - leftEye.y;
      const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

      // Penalize if eyes aren't level (angle should be close to 0)
      rotationScore = 1 - Math.min(angle, 15) / 15;
    }

    // Use blendshapes to check for neutral expression
    let expressionScore = 1;
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;

      // Check for extreme expressions
      const expressionThreshold = 0.5;
      const expressionChecks = [
        "mouthSmileLeft",
        "mouthSmileRight",
        "jawOpen",
        "eyeBlinkLeft",
        "eyeBlinkRight",
      ];

      let totalExpressionDeviation = 0;
      let expressionCount = 0;

      blendshapes.forEach((shape) => {
        if (expressionChecks.includes(shape.categoryName)) {
          totalExpressionDeviation += shape.score;
          expressionCount++;
        }
      });

      if (expressionCount > 0) {
        // Calculate average expression deviation (lower is better)
        const avgDeviation = totalExpressionDeviation / expressionCount;
        expressionScore = 1 - avgDeviation;
      }
    }

    // Combine all scores with different weights
    const weights = {
      centering: 0.3,
      size: 0.3,
      rotation: 0.2,
      expression: 0.2,
    };

    const finalScore =
      centeringScore * weights.centering +
      sizeScore * weights.size +
      rotationScore * weights.rotation +
      expressionScore * weights.expression;

    console.log(
      `Face quality metrics - Centering: ${centeringScore.toFixed(
        2
      )}, Size: ${sizeScore.toFixed(2)}, Rotation: ${rotationScore.toFixed(
        2
      )}, Expression: ${expressionScore.toFixed(
        2
      )}, Final: ${finalScore.toFixed(2)}`
    );

    return finalScore;
  } catch (error) {
    console.error("Error calculating face quality:", error);
    return null;
  }
};

/**
 * Gets face embeddings for the face in the video frame
 * Returns null if no face is detected or quality is too low
 */
export const getFaceEmbedding = async (
  videoElement: HTMLVideoElement,
  enhancedImageData?: ImageData,
  qualityThreshold: number = 0.7 // Minimum quality threshold
): Promise<Float32Array | null> => {
  if (!faceLandmarker) {
    console.warn("Face landmarker not initialized");
    return null;
  }

  try {
    // Check face quality first
    const qualityScore = await getFaceQualityScore(videoElement);

    if (qualityScore === null || qualityScore < qualityThreshold) {
      console.log(`Face quality insufficient: ${qualityScore}`);
      return null;
    }

    let results;

    // If we have enhanced image data, we need to use a canvas
    if (enhancedImageData) {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.putImageData(enhancedImageData, 0, 0);
        // Use detectForVideo instead of detect to match the running mode
        results = faceLandmarker.detectForVideo(canvas, performance.now());
      } else {
        return null;
      }
    } else {
      // Otherwise use the video element directly
      results = faceLandmarker.detectForVideo(videoElement, performance.now());
    }

    // Check if we have face landmarks
    if (
      !results ||
      !results.faceLandmarks ||
      results.faceLandmarks.length === 0
    ) {
      return null;
    }

    // Create a more robust embedding using both landmarks and blendshapes
    const landmarks = results.faceLandmarks[0];

    // Create an embedding from key facial landmarks (more reliable than just blendshapes)
    // We'll use a subset of landmarks to create a distance-based embedding
    const keyPoints = [
      33, 133, 159, 263, 386, 61, 291, 199, 0, 17, 50, 280, 48, 4, 152, 400,
    ];

    // Create embedding array (will contain normalized distances between key points)
    const landmarkEmbedding: number[] = [];

    // Calculate face width for normalization
    let minX = Infinity,
      maxX = -Infinity;
    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
    });
    const faceWidth = maxX - minX;

    // Calculate distances between key points (normalized by face width)
    for (let i = 0; i < keyPoints.length; i++) {
      for (let j = i + 1; j < keyPoints.length; j++) {
        if (
          keyPoints[i] < landmarks.length &&
          keyPoints[j] < landmarks.length
        ) {
          const p1 = landmarks[keyPoints[i]];
          const p2 = landmarks[keyPoints[j]];

          // Calculate Euclidean distance
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = (p1.z || 0) - (p2.z || 0);

          // Normalize by face width
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) / faceWidth;
          landmarkEmbedding.push(distance);
        }
      }
    }

    // Also include blendshapes for expression information
    const blendshapeEmbedding: number[] = [];
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      blendshapes.forEach((shape) => {
        blendshapeEmbedding.push(shape.score);
      });
    }

    // Combine both embeddings
    const combinedEmbedding = [...landmarkEmbedding, ...blendshapeEmbedding];

    // Convert to Float32Array
    const embedding = new Float32Array(combinedEmbedding);

    return embedding;
  } catch (error) {
    console.error("Error getting face embedding:", error);
    return null;
  }
};

/**
 * Detects faces in the video frame
 */
const detectFaces = async (
  videoElement: HTMLVideoElement,
  enhancedImageData?: ImageData
) => {
  if (!faceLandmarker) return null;

  try {
    // If we have enhanced image data, we need to use a canvas
    if (enhancedImageData) {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.putImageData(enhancedImageData, 0, 0);
        // Use detectForVideo instead of detect to match the running mode
        const results = faceLandmarker.detectForVideo(
          canvas,
          performance.now()
        );
        return results.faceLandmarks;
      }
    }

    // Otherwise use the video element directly
    const results = faceLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );
    return results.faceLandmarks;
  } catch (error) {
    console.error("Error detecting faces:", error);
    return null;
  }
};

/**
 * Stores the face embedding in localStorage
 */
export const storeFaceEmbedding = (embedding: Float32Array): void => {
  try {
    // Convert Float32Array to regular array for storage
    const embeddingArray = Array.from(embedding);

    // Store with both keys to ensure compatibility
    localStorage.setItem("faceDescriptors", JSON.stringify(embeddingArray));
    localStorage.setItem("faceEmbedding", JSON.stringify(embeddingArray));

    console.log("Face embedding stored successfully");
  } catch (error) {
    console.error("Error storing face embedding:", error);
  }
};

/**
 * Compares the current face embedding with the stored one
 * Returns true if they match, false otherwise
 */
export const compareWithStoredEmbedding = async (
  currentEmbedding: number[] | Float32Array,
  threshold: number = 0.8 // Increased threshold for better accuracy
): Promise<boolean> => {
  try {
    // Get stored embedding from localStorage
    const storedEmbeddingStr = localStorage.getItem("faceDescriptors");
    if (!storedEmbeddingStr) {
      console.error("No stored face embedding found");
      return false;
    }

    // Parse the stored embedding
    let storedEmbedding;
    try {
      storedEmbedding = JSON.parse(storedEmbeddingStr);
    } catch (e) {
      console.error("Error parsing stored embedding:", e);
      return false;
    }

    // Convert currentEmbedding to array if it's a Float32Array
    const currentArray = Array.isArray(currentEmbedding)
      ? currentEmbedding
      : Array.from(currentEmbedding);

    // Handle different embedding formats
    if (Array.isArray(storedEmbedding)) {
      // Case 1: storedEmbedding is a simple array
      if (!Array.isArray(storedEmbedding[0])) {
        if (currentArray.length !== storedEmbedding.length) {
          console.log(
            `Embedding length mismatch: current=${currentArray.length}, stored=${storedEmbedding.length}`
          );

          // Use a more robust approach that doesn't throw errors
          try {
            // Try to calculate similarity with a safe approach
            // Add this to the compareWithStoredEmbedding function to better track scores
            const similarity = calculateCosineSimilarity(
              currentArray,
              storedEmbedding
            );
            console.log(
              `Face similarity score: ${similarity.toFixed(
                4
              )}, threshold: ${threshold}, match: ${similarity > threshold}`
            );
            return similarity > threshold;
          } catch (e) {
            console.error("Error in safe similarity calculation:", e);
            return false;
          }
        }

        // If lengths match, use normal calculation
        const similarity = calculateCosineSimilarity(
          currentArray,
          storedEmbedding
        );
        console.log(`Face similarity: ${similarity}`);
        return similarity > threshold;
      }
      // Case 2: storedEmbedding is an array of arrays (multiple face embeddings)
      else {
        console.log(
          "Stored embedding is an array of arrays, trying to find best match"
        );

        // Try to find the best match among all stored embeddings
        let bestSimilarity = -1;
        let bestMatch = false;

        for (let i = 0; i < storedEmbedding.length; i++) {
          try {
            const similarity = safeCalculateSimilarity(
              currentArray,
              storedEmbedding[i]
            );
            console.log(`Face similarity with embedding ${i}: ${similarity}`);

            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              bestMatch = similarity > threshold;
            }
          } catch (e) {
            console.error(`Error comparing with embedding ${i}:`, e);
          }
        }

        console.log(`Best similarity found: ${bestSimilarity}`);
        return bestMatch;
      }
    }

    // Fallback case - unknown format
    console.error("Unknown stored embedding format");
    return false;
  } catch (error) {
    console.error("Error comparing face embeddings:", error);
    return false;
  }
};

/**
 * A safer version of cosine similarity calculation that handles different array lengths
 */
const safeCalculateSimilarity = (a: number[], b: number[]): number => {
  // If lengths don't match, use the shorter length
  const minLength = Math.min(a.length, b.length);

  if (minLength === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLength; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Calculate cosine similarity between two embeddings of the same length
 */
export const calculateCosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
