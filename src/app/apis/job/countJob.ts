// GetJobCountLast7Days.ts
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const GetJobCountLast7Days = (period = "7days") => {
  const [jobCount, setJobCount] = useState(0);
  const [jobDailyData, setJobDailyData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const daysToFetch =
        {
          "7days": 7,
          "30days": 30,
          "90days": 90,
        }[period] || 7;

      const dailyCounts = [];

      for (let i = 0; i < daysToFetch; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from("job_postings")
          .select("*", { count: "exact" })
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());

        dailyCounts.unshift(count || 0);
      }

      setJobCount(dailyCounts.reduce((a, b) => a + b, 0));
      setJobDailyData(dailyCounts);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  return { jobCount, jobDailyData, loading };
};
