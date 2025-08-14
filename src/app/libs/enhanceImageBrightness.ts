/**
 * Enhances the brightness of an image from a video element
 * Returns an ImageData object with adjusted brightness
 */
export const enhanceImageBrightness = (
  videoElement: HTMLVideoElement,
  brightnessAdjustment: number = 50
): ImageData | null => {
  try {
    // Create a canvas to process the image
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Draw the current video frame to the canvas
    ctx.drawImage(videoElement, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Adjust brightness
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + brightnessAdjustment);     // Red
      data[i + 1] = Math.min(255, data[i + 1] + brightnessAdjustment); // Green
      data[i + 2] = Math.min(255, data[i + 2] + brightnessAdjustment); // Blue
      // data[i + 3] is alpha (no change needed)
    }
    
    return imageData;
  } catch (error) {
    console.error("Error enhancing image brightness:", error);
    return null;
  }
};

/**
 * Enhances contrast of an image from a video element
 * Returns an ImageData object with adjusted contrast
 */
export const enhanceImageContrast = (
  videoElement: HTMLVideoElement,
  contrastFactor: number = 1.5
): ImageData | null => {
  try {
    // Create a canvas to process the image
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Draw the current video frame to the canvas
    ctx.drawImage(videoElement, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Adjust contrast
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast factor to each color channel
      data[i] = Math.min(255, Math.max(0, 128 + (data[i] - 128) * contrastFactor));
      data[i + 1] = Math.min(255, Math.max(0, 128 + (data[i + 1] - 128) * contrastFactor));
      data[i + 2] = Math.min(255, Math.max(0, 128 + (data[i + 2] - 128) * contrastFactor));
      // data[i + 3] is alpha (no change needed)
    }
    
    return imageData;
  } catch (error) {
    console.error("Error enhancing image contrast:", error);
    return null;
  }
};