'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';  // Import Supabase client
import Link from 'next/link';

export default function UploadFile() {
    const [file, setFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadUrl, setUploadUrl] = useState(null);

    // Handle file selection
    const handleFileChange = (event: any) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        try {
            // Upload the file to Supabase Storage
            const filePath = `uploads/${file.name}`;
            const { data, error } = await supabase.storage
                .from('files') // Replace with your bucket name
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            // Log the response data from the upload
            console.log('File uploaded:', data);

            // Get the public URL for the uploaded file
            const { data: { publicUrl } }: any = supabase
                .storage
                .from('files')
                .getPublicUrl(filePath);  // Use filePath directly

            // Log the public URL
            console.log('Public URL:', publicUrl);

            if (!publicUrl) {
                throw new Error('Failed to get public URL');
            }

            // Set the public URL
            setUploadUrl(publicUrl);

        } catch (error: any) {
            console.error('Error during upload or fetching URL:', error);
            setUploadError(error.message); // Show any upload errors
        } finally {
            setUploading(false); // Reset uploading state
        }
    };

    return (
        <div>
            <input
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
            />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>

            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
            {uploadUrl && (
                <div>
                    <p>File uploaded successfully!</p>
                    <Link href={uploadUrl} target="_blank" rel="noopener noreferrer">
                        View File
                    </Link>
                </div>
            )}
        </div>
    );
}