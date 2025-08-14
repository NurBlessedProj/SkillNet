import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface FormData {
  Area: string;
  Function: string;
  Timing: any;
  Question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Correct_Answer: string;
  sub_category: string;
}

export const CreateQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const Save = async (datas: FormData) => {
    setLoading(true);
    setError(null);

    // Validate required fields
    if (
      !datas.Question ||
      !datas.Correct_Answer ||
      !datas.Area ||
      !datas.Function
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return { error: "Missing required fields" };
    }

    try {
      // Parse the timing value - extract the numeric part
      let timingValue = datas.Timing;
      if (typeof timingValue === "string") {
        // Extract only the numeric part if it's a string like "02 min"
        const numericMatch = timingValue.match(/^(\d+)/);
        if (numericMatch && numericMatch[1]) {
          timingValue = parseInt(numericMatch[1], 10);
        } else {
          timingValue = 2; // Default value if parsing fails
        }
      }

      // Prepare the data object WITHOUT the Serial field
      const questionData = {
        Function: datas.Function,
        Area: datas.Area.toUpperCase(), // Ensure Area is uppercase
        Question: datas.Question.trim(),
        A: datas.A.trim(),
        B: datas.B.trim(),
        C: datas.C.trim(),
        D: datas.D.trim(),
        Correct_Answer: datas.Correct_Answer,
        Timing: timingValue, // Now properly parsed as a number
        sub_category: datas.sub_category,
      };

      // Insert data without specifying Serial
      const { data, error } = await supabase
        .from("questions")
        .insert([questionData])
        .select();

      if (error) {
        console.error("Error inserting data:", error);
        setError(error.message);
        setLoading(false);
        return { error: error.message };
      }

      console.log("Data inserted successfully:", data);

      // Optional: Add a small delay before reload to ensure data is committed
      setTimeout(() => {
        router.refresh();
      }, 500);

      setLoading(false);
      return { data };
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
      return { error: err.message || "An unexpected error occurred" };
    }
  };

  return {
    loading,
    error,
    Save,
  };
};
