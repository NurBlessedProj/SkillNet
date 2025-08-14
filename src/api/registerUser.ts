import axios from 'axios';
import { useState } from 'react';

export const Register = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const save = async (username: string) => {
        setLoading(true);

        try {
            // Create a new FormData object
            const formData = new FormData();
            formData.append('username', username);  // Append the username to the formData object

            const response = await axios.post("https://quiz-recognition.onrender.com/register", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // This is important for FormData
                }
            });
            setLoading(false);
            console.log(response.data);
            localStorage.setItem('username', username)
        } catch (error: any) {
            setLoading(false);
            if (error.response && error.response.status === 422) {
                console.error("Validation failed or incorrect format:", error.response.data);
            } else {
                console.error("Error submitting the form:", error);
            }
        } finally {
            console.log("Request completed.");
        }
    }

    return { loading, save }
}
