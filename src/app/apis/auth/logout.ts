"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export const LogoutUser = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const Logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    // Clear all user-related data from localStorage
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userEmail");
    // localStorage.removeItem("faceDescriptors");
    // localStorage.removeItem("examinerId");
    // localStorage.removeItem("selectedSection");
    // localStorage.removeItem("difficultyLevel");
    // localStorage.removeItem("subCategories");
    // localStorage.removeItem("scheduledTime");
    // localStorage.removeItem("faceEmbedding");
    // localStorage.removeItem("username");
    // Optionally clear all localStorage (uncomment if you want to wipe everything):
    // localStorage.clear();

    // Remove user-role cookie (if set by your app)
    if (typeof document !== "undefined") {
      document.cookie = "user-role=; Max-Age=0; path=/;";
    }

    if (error) {
      setLoading(false);
      console.error("Error logging out:", error.message);
    } else {
      //  routing after a success 200
      router.push("/auth");
      setLoading(false);
    }
  };
  return { loading, Logout };
};
