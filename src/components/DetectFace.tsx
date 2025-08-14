import * as faceapi from "face-api.js";

// Create a separate face detection service
const FaceDetectionService = {
  isInitialized: false,

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load models from a reliable CDN or local path
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing face detection:", error);
      throw new Error("Failed to initialize face detection");
    }
  },

  async detectFace(video: HTMLVideoElement) {
    if (!this.isInitialized) await this.initialize();

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  },
};
export default FaceDetectionService;
