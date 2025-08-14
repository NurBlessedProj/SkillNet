import React, { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";

// @get the Zone base on the area
export const GetQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error }: any = await supabase.from("questions").select("*");

      if (error) {
        console.error("Error fetching questions:", error);
      } else {
        setQuestions(data);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return { questions };
};
