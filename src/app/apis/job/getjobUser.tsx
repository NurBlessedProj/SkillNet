import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

// Fetch jobs based on the user's section from the profiles table
export const GetJobsUser = () => {
    const [job, setJob] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [section, setSection] = useState<string | null>(null);

    // Step 1: Get the authenticated user's email
    useEffect(() => {
        const getUserEmail = async () => {
            const { data, error }: any = await supabase.auth.getUser();
            if (error) {
                console.error("Error getting user:", error);
            } else if (data) {
                setUserEmail(data?.user.email);  // Save user's email
            } else {
                console.log("No user logged in");
                setLoading(false);  // Set loading to false if there's no user
            }
        };
        getUserEmail();
    }, []);

    // Step 2: Fetch the user's section from the profiles table
    useEffect(() => {
        const fetchSection = async () => {
            if (userEmail) {
                const { data, error }: any = await supabase
                    .from('profiles')
                    .select('section')
                    .eq('email', userEmail)
                    .single();

                if (error) {
                    console.error('Error fetching section:', error);
                } else if (data) {
                    setSection(data.section);  // Save the user's section
                }
            }
        };

        if (userEmail) {
            fetchSection();
        }
    }, [userEmail]);

    // Step 3: Fetch all jobs and filter based on the user's section
    useEffect(() => {
        const fetchJobs = async () => {
            if (section) {
                // Fetch all jobs from the job_postings table
                const { data, error }: any = await supabase
                    .from('job_postings')
                    .select('*');

                if (error) {
                    console.error('Error fetching jobs:', error);
                } else if (data) {
                    // Filter jobs where the user's section is included in the skills array
                    const filteredJobs = data.filter((job: any) =>
                        job.skills.includes(section)
                    );
                    setJob(filteredJobs);  // Set the filtered jobs
                }
                setLoading(false);  // Set loading to false after fetching
            }
        };

        if (section) {
            fetchJobs();
        }
    }, [section]);

    return { job, loading };
};