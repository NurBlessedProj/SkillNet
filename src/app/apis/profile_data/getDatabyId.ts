import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export const GetProfileData = () => {
  const [profileData, setProfileData] = useState<any>(null); // Single profile data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get the current URL
    const url = new URL(window.location.href);
    // Get the email parameter from the URL
    const email = url.searchParams.get("email");

    if (email) {
      fetchProfileData(email);
    } else {
      setLoading(false);
      console.error("No email provided in the URL");
    }
  }, []);

  const fetchProfileData = async (email: string) => {
    setLoading(true);
    try {
      // First try to get data from profiles_data table
      const { data: profilesData, error: profilesDataError } = await supabase
        .from("profiles_data")
        .select("*")
        .eq("email", email)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (profilesData) {
        // If data found in profiles_data, use it
        setProfileData(profilesData);
        setLoading(false);
        return;
      }

      // If no data in profiles_data or there was an error, try the profiles table
      const { data: profilesTableData, error: profilesTableError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .maybeSingle();

      if (profilesTableError) {
        console.error(
          "Error fetching from profiles table:",
          profilesTableError
        );
        setError("Error fetching profile data");
      } else if (profilesTableData) {
        // Data found in profiles table
        setProfileData(profilesTableData);
      } else {
        // No data found in either table
        console.error(`No profile found for email: ${email}`);
        setError(`No profile found for email: ${email}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { profileData, loading, error };
};
