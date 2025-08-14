import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// This hook allows admins to see all assigned tests across all examiners
export const GetAllAssignedTestsAdmin = () => {
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchAllAssignedTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if the user is an admin or s_admin
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error("Failed to authenticate user");
      }
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Get the user's role from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        throw new Error("Failed to fetch user profile");
      }
      
      const role = profileData?.role;
      setUserRole(role);
      
      // Only allow admins and s_admins to access this data
      if ( role !== 's_admin') {
        throw new Error("Unauthorized: Only admins can view all assigned tests");
      }
      
      // Get all review assignments with related data
      const { data: assignments, error: assignmentsError } = await supabase
        .from("review_assignments")
        .select(`
          id,
          examiner_id,
          test_id,
          assigned_at,
          status,
          completed_at,
          notes,
          archived,
          examiners:examiner_id (
            id,
            name,
            email,
            status
          ),
          answers:test_id (
            id,
            email,
            score,
            subject_score,
            exam,
            overall,
            created_at,
            review_status
          )
        `)
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) {
        throw new Error("Failed to fetch assignments: " + assignmentsError.message);
      }
      
      setAssignedTests(assignments || []);
    } catch (err: any) {
      console.error("Error fetching assigned tests:", err);
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchAllAssignedTests();
  }, []);
  
  // Function to refresh data
  const refreshData = () => {
    fetchAllAssignedTests();
  };
  
  return {
    assignedTests,
    loading,
    error,
    userRole,
    refreshData
  };
};