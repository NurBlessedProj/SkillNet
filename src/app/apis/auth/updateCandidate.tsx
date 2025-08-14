"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const UpdateProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Explicitly define the return type as Promise<boolean>
  const data = async (section: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get the authenticated user from the Supabase session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // Handle the error gracefully (user is not authenticated)
        toast.error("Unauthorized");
        return false; // Return false to indicate failure
      }

      const { email } = user;

      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching profile:", fetchError);
        toast.error("Failed to check existing profile");
        return false;
      }

      let result;

      // If profile exists, update it
      if (existingProfile) {
        console.log("Existing profile found, updating...");
        result = await supabase
          .from("profiles")
          .update({
            section: section,
            active: "yes", // Keep using "yes" as in your original code
          })
          .eq("email", email);
      } else {
        // If profile doesn't exist, insert it
        console.log("No profile found, creating new profile...");
        result = await supabase.from("profiles").insert({
          email: email,
          section: section,
          active: "yes",
          face_registered: false,
          role: "user", // Default role
        });
      }

      if (result.error) {
        toast.error("Error: " + result.error.message);
        return false; // Return false to indicate failure
      }

      toast.success("Profile updated successfully!");

      // After successfully updating the profile, navigate to the profile page
      router.push("/facerecognition");

      return true; // Return true to indicate success
    } catch (error: any) {
      // Handle unexpected errors
      toast.error("Internal server error: " + error.message);
      return false; // Return false to indicate failure
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading };
};
