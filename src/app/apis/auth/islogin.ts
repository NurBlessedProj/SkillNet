'use client'
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CryptoJS from 'crypto-js'; // Import the crypto-js library for encryption
import { useRouter } from 'next/navigation'; // To handle redirection

export const AuthUser = () => {
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isRedirected, setIsRedirected] = useState(false); // Track if redirect has occurred
    const router = useRouter();

    const encryptData = (data: any) => {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), 'secret-key').toString();
        return encrypted;
    };

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session }, error }: any = await supabase.auth.getSession();
            console.log(session);

            if (error) {
                setError(error.message);
                console.log(error);
                if (!isRedirected) {
                    router.push("/auth");  // Redirect to the login page if there is an error
                    setIsRedirected(true); // Mark as redirected
                }
            } else {
                setUser(session?.user || null);
                console.log(session?.user);
            }
        };

        fetchSession();
    }, [isRedirected, router]);  // The useEffect now listens for changes in isRedirected to avoid multiple redirects

    return { error, user, role };
};
