'use client'
import { useState, ChangeEvent } from "react";
import { FacialRegistration } from "@/api/confirmfacial";

// Define a type for the image file
type ImageFile = string;

const FileUpload = () => {
  const [image, setImage] = useState<ImageFile | null>(null); // For a single image
  const Facial = FacialRegistration(); // Assuming you have the save method here

  // Handle file selection and store the single image
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]; // Get the first file
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String); // Store the base64 string
      };

      reader.readAsDataURL(file); // Convert file to base64 string
    }
  };

  // Handle the submit and process the image
  const handleSubmit = () => {
    if (image) {
      console.log("Image to save:", image);
      // Replace with your actual save logic
      Facial.save(image); // Assuming save expects a base64 string
    }
  };

  // Remove the image from the state
  const handleRemoveImage = () => {
    setImage(null); // Reset image to null
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-xl font-semibold text-center mb-4">Upload Image</h1>

        {/* Image file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-700 mb-4"
        />

        {/* Display selected image */}
        {image && (
          <div className="relative mb-4">
            <img
              src={image}
              alt="Uploaded"
              className="w-full h-24 object-cover rounded-md"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
            >
              X
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {Facial.loading ? 'Submitting ....' : 'Submit Image'}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
