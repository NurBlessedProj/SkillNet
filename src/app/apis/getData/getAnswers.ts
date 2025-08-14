import { supabase } from "@/lib/supabase";
import React, { useState } from "react";

export const GetAnswers = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting data fetch...");

        // First fetch answers
        const { data: answersData, error: answersError } = await supabase
          .from("answers")
          .select("*");

        if (answersError) {
          console.error("Error fetching answers:", answersError);
          return;
        }

        console.log("Answers data:", answersData);

        // Then fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles_data")
          .select("*");

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          return;
        }

        console.log("Profiles data:", profilesData);

        // Create a map of profiles by email for quick lookup
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.email] = profile;
          return acc;
        }, {});

        // Process data to get highest score per user with profile information
        const userHighestScores = answersData.reduce((acc, current) => {
          const email = current.email;
          const currentScore = parseInt(current.score) || 0;
          const profileData = profilesMap[email];

          // If this email hasn't been seen yet, or if this score is higher than the previous one
          if (!acc[email] || currentScore > parseInt(acc[email].score)) {
            acc[email] = {
              ...current,
              profile: profileData || null,
              // Add computed fields
              fullName: profileData
                ? `${profileData.first_name || ""} ${
                    profileData.last_name || ""
                  }`.trim() || "N/A"
                : "N/A",
              location: profileData?.address || "N/A",
              experience: profileData?.years_of_experience || "0",
              qualification: profileData?.highest_qualification || "N/A",
              skills: Array.isArray(profileData?.skills)
                ? profileData.skills
                : [],
              countryOfBirth: profileData?.country_of_birth || "N/A",
            };
          }

          return acc;
        }, {});

        // Convert the object back to an array
        const filteredData = Object.values(userHighestScores);

        // Sort by score in descending order
        filteredData.sort((a: any, b: any) => {
          const scoreA = parseInt(a.score) || 0;
          const scoreB = parseInt(b.score) || 0;
          return scoreB - scoreA;
        });

        console.log("Final processed data:", filteredData);
        setQuestions(filteredData as any);
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { questions, loading };
};
