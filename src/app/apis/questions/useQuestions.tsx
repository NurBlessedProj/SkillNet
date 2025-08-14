"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const useQuestions = (refreshTrigger = 0) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching questions...");

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("Serial", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data) {
        console.log(`Fetched ${data.length} questions`);
        setQuestions(data);
      } else {
        console.log("No data returned from query");
        setQuestions([]);
      }
    } catch (err: any) {
      console.error("Error fetching questions:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch questions when component mounts or refreshTrigger changes
  useEffect(() => {
    console.log("Refresh trigger changed:", refreshTrigger);
    fetchQuestions();
  }, [refreshTrigger, fetchQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions,
  };
};
