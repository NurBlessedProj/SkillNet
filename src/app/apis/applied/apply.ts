import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const CreateApply = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const Save = async (id_job_postings: string) => {
    setLoading(true);
    // Get authenticated user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("No authenticated user found.");
      setLoading(false);
      return { error: "No authenticated user found." };
    }
    const email = user.user.email;

    try {
      // First check if the job exists and has capacity
      const { data: job, error: jobError } = await supabase
        .from("job_postings")
        .select("capacity, capacity_needed")
        .eq("id", id_job_postings)
        .single();

      if (jobError) {
        toast.error("Error fetching job details");
        setLoading(false);
        return { error: jobError.message };
      }

      // Check if position is full
      if (job.capacity >= job.capacity_needed) {
        toast.error("This position is already full");
        setLoading(false);
        return { error: "Position is full" };
      }

      // Check for existing application
      const { data: existingApplications, error: checkError } = await supabase
        .from("applied")
        .select("*")
        .eq("email", email)
        .eq("id_job_postings", id_job_postings);

      if (checkError) {
        toast.error("Error checking application status");
        setLoading(false);
        return { error: checkError.message };
      }

      if (existingApplications && existingApplications.length > 0) {
        toast.error("You have already applied for this job");
        setLoading(false);
        return { error: "Already applied" };
      }

      // Try to get user profile to include fullName in application
      let fullName = "";
      try {
        // Get profile data from profiles table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        // Then get additional data from profiles_data
        if (profileData) {
          const { data: profilesDataResult } = await supabase
            .from("profiles_data")
            .select("first_name, last_name")
            .eq("email", email)
            .maybeSingle();

          if (profilesDataResult?.first_name && profilesDataResult?.last_name) {
            fullName = `${profilesDataResult.first_name} ${profilesDataResult.last_name}`;
          }
        }
      } catch (profileError) {
        console.warn(
          "Could not fetch user profile data, continuing without fullName",
          profileError
        );
      }
      // Insert application with status "pending" and additional fields
      const applicationData = {
        email: email,
        id_job_postings: id_job_postings,
        status: "pending",
        created_at: new Date().toISOString(),
        // Include fullName if available
        ...(fullName ? { fullName } : {}),
      };

      console.log("Attempting to insert application:", applicationData);

      // Insert with detailed error handling
      const { data: insertData, error: insertError } = await supabase
        .from("applied")
        .insert([applicationData])
        .select();

      if (insertError) {
        console.error("Application insert error:", insertError);

        // Check if it's a foreign key constraint error
        if (insertError.message?.includes("foreign key constraint")) {
          toast.error("Cannot apply: Job posting may no longer exist");
        }
        // Check if it's a permission error
        else if (insertError.message?.includes("permission denied")) {
          toast.error(
            "Permission denied. You may not have access to apply for jobs"
          );
        }
        // Show the specific error message
        else {
          toast.error(`Failed to submit application: ${insertError.message}`);
        }

        setLoading(false);
        return { error: insertError.message };
      }

      console.log("Application submitted successfully:", insertData);
      toast.success("Successfully applied for the job!");
      // Refresh the page data
      router.refresh();
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("Unexpected error during application:", err);
      toast.error("An unexpected error occurred while applying");
      setLoading(false);
      return { error: "Unexpected error occurred" };
    }
  };

  return {
    loading,
    Save,
  };
};
