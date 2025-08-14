import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const GetSectionCount = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all sections from the section table
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("section")
        .select("*");

      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
        setLoading(false);
        return;
      }

      // Fetch all job postings and their skills
      const { data: jobPostings, error: jobError } = await supabase
        .from("job_postings")
        .select("skills");
      setError(jobError);

      if (jobError) {
        console.error("Error fetching job postings:", jobError);
        setLoading(false);
        return;
      }

      // For each section, count how many times the section name appears in the job postings' skills array
      const sectionsWithCount = await Promise.all(
        sectionsData.map(async (section) => {
          const count = jobPostings.filter(
            (job: any) => job.skills.includes(section.name) // Check if the section name exists in the skills array
          ).length;

          return {
            ...section,
            count: count, // Append the count to the section object
          };
        })
      );

      setSections(sectionsWithCount); // Set sections with count
      setLoading(false);
    };

    fetchData();
  }, []);

  return { sections, loading, error };
};
