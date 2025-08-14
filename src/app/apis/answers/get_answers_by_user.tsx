import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";

export const GetAnswers = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user:", userError);
          setLoading(false);
          return;
        }

        // Step 2: Get user role from localStorage
        const encryptedProfile = localStorage.getItem("userProfile");
        if (!encryptedProfile) {
          console.error("No user profile found");
          setLoading(false);
          return;
        }

        // Decrypt the profile
        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const decryptedProfile = bytes.toString(CryptoJS.enc.Utf8);

        console.log("User Role:", decryptedProfile);
        console.log("User Email:", user.email);

        if (decryptedProfile === "admin") {
          // First, let's check if we can query the job_postings table
          const { data: jobPostings, error: jobError } = await supabase
            .from("job_postings")
            .select("*") // Select all columns for debugging
            .eq("email", user.email);

          console.log("Job Postings Query Result:", { jobPostings, jobError });

          if (jobError) {
            console.error("Error fetching job postings:", jobError);
            // If there's an error with job postings, try fetching all answers
            const { data: allAnswers, error: answersError } = await supabase
              .from("answers")
              .select("*");

            if (!answersError && allAnswers) {
              setQuestions(allAnswers);
            }
          } else if (!jobPostings || jobPostings.length === 0) {
            // If no job postings found, fetch all answers
            console.log("No job postings found, fetching all answers");
            const { data: allAnswers, error: answersError } = await supabase
              .from("answers")
              .select("*");

            console.log("All Answers Query Result:", {
              allAnswers,
              answersError,
            });

            if (!answersError && allAnswers) {
              setQuestions(allAnswers);
            }
          } else {
            // We have job postings, let's process them
            const categories = jobPostings.flatMap((post) => {
              if (typeof post.categories === "string") {
                return [post.categories];
              }
              return Array.isArray(post.categories) ? post.categories : [];
            });

            console.log("Extracted Categories:", categories);

            if (categories.length > 0) {
              const { data: answersData, error: answersError } = await supabase
                .from("answers")
                .select("*")
                .in("exam", categories);

              console.log("Filtered Answers Query Result:", {
                answersData,
                answersError,
              });

              if (!answersError && answersData) {
                setQuestions(answersData);
              }
            }
          }
        } else {
          // For non-admin users
          const { data: answersData, error: answersError } = await supabase
            .from("answers")
            .select("*")
            .eq("email", user.email);

          console.log("Non-admin Answers Query Result:", {
            answersData,
            answersError,
          });

          if (!answersError && answersData) {
            setQuestions(answersData);
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add a debug effect
  useEffect(() => {
    console.log("Current questions state:", questions);
  }, [questions]);

  return { questions, loading };
};
export const CheckUserEmailExists = () => {
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [hasPassingScore, setHasPassingScore] = useState<boolean>(false);

  // Get the current session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Session fetch error:", error);
          setError(error.message);
          return;
        }
        setSession(session);
      } catch (err) {
        console.error("Session fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch session"
        );
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check email existence and score
  useEffect(() => {
    const checkEmailExistenceAndScore = async () => {
      if (!session?.user?.email) {
        console.log("No user email found");
        setLoading(false);
        return;
      }

      try {
        // Get all answers for the user, ordered by creation date
        const { data, error } = await supabase
          .from("answers")
          .select("*")
          .eq("email", session.user.email)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Query error:", error);
          throw error;
        }

        // Check if we have any results
        const exists = Array.isArray(data) && data.length > 0;

        // Get the most recent score
        let passing = false;
        if (exists && data[0]) {
          const latestScore = data[0].score;
          passing = latestScore > 0;
          console.log("Latest score:", latestScore, "Passing:", passing);
        }

        console.log("Email check results:", {
          email: session.user.email,
          exists,
          resultCount: data?.length,
          passingScore: passing,
        });

        setEmailExists(exists);
        setHasPassingScore(passing);
      } catch (err) {
        console.error("Email check error:", err);
        setError(err instanceof Error ? err.message : "Failed to check email");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      checkEmailExistenceAndScore();
    } else {
      setLoading(false);
    }
  }, [session]);

  return {
    loading,
    emailExists,
    error,
    userEmail: session?.user?.email,
    hasPassingScore, // Added this to the return object
  };
};
