import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";

export interface JobPosting {
  id: string;
  company_name: string;
  company_description: string;
  categories: string[];
  salary_min: number;
  salary_max: number;
  responsibilities: string;
  who_you_are: string;
  additional_requirements: string;
  end_date: string;
  capacity: number;
  created_at: string;
  email: string;
  status: string;
  job_type: string;
  capacity_needed: number;
  role: string;
  skills: string[];
  logo_url: string;
  active: boolean;
}

interface JobResponse {
  job: JobPosting[];
  error: Error | null;
  isLoading: boolean;
}

const parseJsonField = (field: string | string[] | null): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;

  try {
    const cleanString = field.replace(/^\{|\}$/g, "").replace(/\\"/g, '"');
    return cleanString
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""));
  } catch (error) {
    console.error("Error parsing field:", field, error);
    return [];
  }
};
export const getUserRole = async (): Promise<{
  role: string;
  email: string | null;
}> => {
  try {
    const encryptedProfile = localStorage.getItem("userProfile");
    if (!encryptedProfile) return { role: "", email: null };

    const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
    const role = bytes.toString(CryptoJS.enc.Utf8);

    // Add await here
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email || null;

    return { role, email };
  } catch (error) {
    console.error("Error getting user role:", error);
    return { role: "", email: null };
  }
};

// in @/app/apis/job/getJobs.ts

export const GetJobs = (): JobResponse => {
  const [job, setJob] = useState<JobPosting[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Get user role and email
        const session = await supabase.auth.getSession();
        const userEmail = session.data.session?.user?.email;

        const encryptedProfile = localStorage.getItem("userProfile");
        if (!encryptedProfile) {
          throw new Error("No user profile found");
        }

        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const userRole = bytes.toString(CryptoJS.enc.Utf8);

        let query = supabase
          .from("job_postings")
          .select("*")
          .eq("active", true);

        // If user is admin, filter by their email
        if (userRole === "admin" && userEmail) {
          query = query.eq("email", userEmail);
        }

        const { data, error: jobError } = await query.order("created_at", {
          ascending: false,
        });

        if (jobError) {
          throw new Error(jobError.message);
        }

        console.log("User Role:", userRole);
        console.log("User Email:", userEmail);
        console.log("Fetched Jobs:", data);

        const transformedData = data.map((job: any) => ({
          ...job,
          id: job.id.toString(),
          categories: parseJsonField(job.categories),
          skills: parseJsonField(job.skills),
        }));

        setJob(transformedData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("An error occurred while fetching jobs")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { job, error, isLoading };
};
// Get job by ID function with role-based accesexport
const GetJobById = async (id: string): Promise<JobPosting | null> => {
  try {
    // Add await here since getUserRole is now async
    const { role, email } = await getUserRole();

    let query = supabase.from("job_postings").select("*").eq("id", id);

    if (role === "admin" && email) {
      query = query.eq("email", email);
    }

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Job not found or access denied");
    }

    return {
      ...data,
      id: data.id.toString(),
      categories: parseJsonField(data.categories),
      skills: parseJsonField(data.skills),
    };
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
};
