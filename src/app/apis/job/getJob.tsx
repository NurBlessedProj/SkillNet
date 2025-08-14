import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

// @get the Zone based on the area
export const GetJobs = () => {
    const [job, setJob] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const getUserEmail = async () => {
            // Get the current authenticated user
            const { data, error }: any = await supabase.auth.getUser();
            if (error) {
                console.error("Error getting user:", error);
            } else if (data) {
                console.log(data)
                console.log(data?.user?.email)
                setUserEmail(data?.user.email);  // Save user's email
            } else {
                console.log("No user logged in");
                setLoading(false);  // Set loading to false if there's no user
            }
        };
        getUserEmail();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (userEmail) {
                // Fetch job postings based on the user's email
                const { data, error }: any = await supabase
                    .from('job_postings')
                    .select('*')
                    .eq('email', userEmail);  // Filter by the user's email

                if (error) {
                    console.error('Error fetching jobs:', error);
                } else {
                    setJob(data);
                }
                setLoading(false);
            }
        };

        // Only fetch data when the user's email is available
        if (userEmail) {
            fetchData();
        }
    }, [userEmail]);

    return { job };
};
