import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

export const GetRecruiterData = () => {
    const [recruiterData, setRecruiterData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch recruiters' data from the 'profile_recruiter' table
            const { data: recruiters, error: recruiterError } = await supabase
                .from('profile_recruter')
                .select('*');

            if (recruiterError) {
                console.error('Error fetching recruiter data:', recruiterError);
                setLoading(false);
                return;
            }

            // Add job posting count to each recruiter
            const recruitersWithJobCount = await Promise.all(
                recruiters.map(async (recruiter) => {
                    const { data: jobData, error: jobError } = await supabase
                        .from('job_postings')
                        .select('*', { count: 'exact' })
                        .eq('email', recruiter.email);  // Match by email

                    if (jobError) {
                        console.error(`Error fetching jobs for ${recruiter.email}:`, jobError);
                    }

                    return {
                        ...recruiter,
                        count: jobData?.length || 0,  // Add job count to recruiter
                    };
                })
            );

            setRecruiterData(recruitersWithJobCount);  // Set updated recruiter data with job counts
            setLoading(false);
        };

        fetchData();
    }, []);

    return { recruiterData, loading };
};
