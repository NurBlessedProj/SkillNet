import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const GetJobPostingsBasedOnProfile = () => {
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const fetchJobPostings = async () => {
      if (!session?.user) {
        setError("No user signed in.");
        setLoading(false);
        return;
      }

      try {
        // Get all job postings first
        const { data: allJobPostings, error: jobPostingsError } = await supabase
          .from("job_postings")
          .select("*");

        if (jobPostingsError) {
          throw new Error(jobPostingsError.message);
        }

        // Separate jobs with filters and without filters
        const jobsWithFilters = allJobPostings.filter(
          (job) =>
            job.candidate_filters &&
            (job.candidate_filters.gender ||
              job.candidate_filters.country_of_birth ||
              job.candidate_filters.min_years_experience ||
              (job.candidate_filters.qualifications &&
                job.candidate_filters.qualifications.length > 0) ||
              (job.candidate_filters.required_skills &&
                job.candidate_filters.required_skills.length > 0) ||
              (job.candidate_filters.score_filters &&
                job.candidate_filters.score_filters.length > 0))
        );

        const jobsWithoutFilters = allJobPostings.filter(
          (job) =>
            !job.candidate_filters ||
            (!job.candidate_filters.gender &&
              !job.candidate_filters.country_of_birth &&
              !job.candidate_filters.min_years_experience &&
              (!job.candidate_filters.qualifications ||
                job.candidate_filters.qualifications.length === 0) &&
              (!job.candidate_filters.required_skills ||
                job.candidate_filters.required_skills.length === 0) &&
              (!job.candidate_filters.score_filters ||
                job.candidate_filters.score_filters.length === 0))
        );

        // For jobs with filters, we need to check if the user matches the filters
        let filteredJobs = [...jobsWithoutFilters]; // Start with jobs that don't have filters

        if (jobsWithFilters.length > 0) {
          // Get user's profile data
          const { data: userDetailedProfile, error: detailedProfileError } =
            await supabase
              .from("profiles_data")
              .select("*")
              .eq("email", session.user.email)
              .single();

          if (detailedProfileError) {
            console.warn(
              "Detailed profile data not found:",
              detailedProfileError.message
            );
          }

          // Get user's test scores
          const { data: userScores, error: scoresError } = await supabase
            .from("answers")
            .select("exam, score")
            .eq("email", session.user.email);

          if (scoresError) {
            console.warn("User scores not found:", scoresError.message);
          }

          // Filter jobs based on candidate requirements
          const matchingFilteredJobs = jobsWithFilters.filter((job) => {
            const filters = job.candidate_filters;
            if (!filters) return true;

            // Check score requirements
            const scoreFilters = filters.score_filters || [];
            const passesScores = scoreFilters.every((filter: any) => {
              const userScore = userScores?.find((s) => s.exam === filter.exam);
              return userScore && userScore.score >= filter.minScore;
            });
            if (scoreFilters.length > 0 && !passesScores) return false;

            // Only apply detailed profile filters if we have the user's detailed profile
            if (userDetailedProfile) {
              // Check gender
              if (
                filters.gender &&
                userDetailedProfile.gender !== filters.gender
              ) {
                return false;
              }

              // Check country of birth
              if (
                filters.country_of_birth &&
                userDetailedProfile.country_of_birth !==
                  filters.country_of_birth
              ) {
                return false;
              }

              // Check years of experience
              if (
                filters.min_years_experience &&
                (!userDetailedProfile.years_of_experience ||
                  userDetailedProfile.years_of_experience <
                    filters.min_years_experience)
              ) {
                return false;
              }

              // Check qualifications
              if (
                filters.qualifications?.length > 0 &&
                !filters.qualifications.includes(
                  userDetailedProfile.highest_qualification
                )
              ) {
                return false;
              }

              // Check required skills
              if (filters.required_skills?.length > 0) {
                const userSkills = userDetailedProfile.skills || [];
                const hasAllRequiredSkills = filters.required_skills.every(
                  (skill: any) => userSkills.includes(skill)
                );
                if (!hasAllRequiredSkills) return false;
              }
            } else if (
              filters.gender ||
              filters.country_of_birth ||
              filters.min_years_experience ||
              (filters.qualifications && filters.qualifications.length > 0) ||
              (filters.required_skills && filters.required_skills.length > 0)
            ) {
              // If we don't have user profile but job requires profile data, don't show it
              return false;
            }

            return true;
          });

          // Add matching filtered jobs to our results
          filteredJobs = [...filteredJobs, ...matchingFilteredJobs];
        }

        setJobPostings(filteredJobs);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching job postings:", err);
        setJobPostings([]);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchJobPostings();
    }
  }, [session]);

  return { loading, jobPostings, error };
};
