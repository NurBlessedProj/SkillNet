import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";

export const GetAnswers = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const encryptedProfile = localStorage.getItem("userProfile");
      if (!encryptedProfile) {
        console.error("No user profile found in localStorage");
        return;
      }

      try {
        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const decryptedProfile = bytes.toString(CryptoJS.enc.Utf8);
        const isAdmin = decryptedProfile === "admin";

        let answersData: any[] = [];

        if (!isAdmin) {
          // For non-admin users, fetch all answers
          const { data, error } = await supabase.from("answers").select("*");
          if (error) {
            console.error("Error fetching answers:", error);
          } else {
            answersData = data;
          }
        } else {
          // For admin users, fetch based on their email and categories
          const { data: user, error: userError } =
            await supabase.auth.getUser();
          if (userError) {
            console.error("Error fetching user:", userError);
            return;
          }

          const userEmail = user?.user.email;
          if (!userEmail) {
            console.error("No user email found");
            return;
          }

          const { data: jobPostings, error: jobPostingsError } = await supabase
            .from("job_postings")
            .select("categories")
            .eq("email", userEmail);

          if (jobPostingsError) {
            console.error("Error fetching job postings:", jobPostingsError);
            return;
          }

          if (jobPostings.length > 0) {
            const categories = jobPostings.flatMap(
              (post: any) => post.categories
            );

            if (categories.length > 0) {
              const { data, error: answersError } = await supabase
                .from("answers")
                .select("*")
                .in("exam", categories);

              if (answersError) {
                console.error("Error fetching answers:", answersError);
              } else {
                answersData = data;
              }
            }
          }
        }

        // Process the data to get highest score per user
        const userHighestScores = new Map();

        answersData.forEach((answer) => {
          const email = answer.email;
          const currentScore = answer.score || 0;

          if (
            !userHighestScores.has(email) ||
            currentScore > userHighestScores.get(email).score
          ) {
            userHighestScores.set(email, {
              ...answer,
              score: currentScore,
            });
          }
        });

        // Convert Map to array
        const processedData = Array.from(userHighestScores.values());
        setQuestions(processedData);
      } catch (error) {
        console.error("Error processing data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { questions, loading };
};
