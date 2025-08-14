import axios from 'axios';
import { useState } from 'react';

export const FacialRegistration = () => {
    const [loading, setLoading] = useState<boolean>(false);

    // Function to convert base64 image to a file
    const base64ToFile = (base64: string, filename: string) => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = base64.split(',')[1];  // This will get the actual base64 data after the comma

        const byteCharacters = atob(base64String); // Decode base64 to binary string
        const byteArrays = [];
        
        // Convert binary string to byte array
        for (let offset = 0; offset < byteCharacters.length; offset++) {
            const byte = byteCharacters.charCodeAt(offset);
            byteArrays.push(byte);
        }

        const byteArray = new Uint8Array(byteArrays);
        // Create a Blob from the byte array
        return new Blob([byteArray], { type: 'image/jpeg' });
    };

    // Function to save the image
    const save = async (image: any) => {
        setLoading(true);
        console.log("Image data:", image);
        const username: any = 'JamisonD';
    
        try {
            // Convert the base64 image to a file
            const imageFile = base64ToFile(image, 'image.jpg');
    
            // Create a new FormData object
            const formData = new FormData();
            formData.append('username', username);
            formData.append('image', imageFile, 'image.jpg'); // Append the file with a name
    
            // Send the form data to the server
            const response = await axios.post("https://quiz-recognition.onrender.com/identify", formData);
    
            setLoading(false);
            console.log(response.data); // Handle the response here
    
        } catch (error: any) {
            setLoading(false);
    
            // Log detailed error information
            if (error.response) {
                console.error("Error Response:", error.response); // Response error from server
            } else if (error.request) {
                console.error("Error Request:", error.request); // No response received
            } else {
                console.error("Error Message:", error.message); // General error message
            }
    
            if (error.response && error.response.status === 422) {
                console.error("Validation failed or incorrect format:", error.response.data);
            } else {
                console.error("Error submitting the form:", error);
            }
        } finally {
            console.log("Request completed.");
            setLoading(false);
            
        }
    };
    

    return { loading, save };
};
