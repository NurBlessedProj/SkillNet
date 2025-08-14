// pages/404.tsx
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Custom404 = () => {
    const router = useRouter();

    // useEffect(() => {
    //     // Redirect to login page if the user is not authorized
    //     setTimeout(() => {
    //         router.push('/auth');
    //     }, 3000); // Redirect after 3 seconds, or immediately if needed
    // }, []);

    return (
        <div className="flex justify-center items-center h-screen">
            <div>
                <h1 className="text-6xl text-center text-red-500">404 - Page Not Found</h1><br />
                <p className="mt-4 text-xl text-center">This page wasn&apos;t found !!!.</p>
            </div>
        </div>
    );
};

export default Custom404;
