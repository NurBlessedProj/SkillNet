"use client";
import React, { useEffect, useState } from "react";
import JobTable from "./components/table";
import Slider from "@/components/SliderJob";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { useTranslations } from "next-intl";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Briefcase, Plus, Filter } from "lucide-react";

const Job = () => {
  const t = useTranslations(); // Initialize the translation hook
  const [user, setUser] = useState<any>({ role: "", email: null });

  useEffect(() => {
    const getUser = async () => {
      try {
        const encryptedProfile = localStorage.getItem("userProfile");
        if (!encryptedProfile) return;

        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const role = bytes.toString(CryptoJS.enc.Utf8);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const email = session?.user?.email || null;

        setUser({ role, email });
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };

    getUser();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin", "s_admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Enhanced Header Section */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {user.role === "admin"
                        ? t("Job.myJobListings")
                        : t("Job.allJobListings")}
                    </h1>
                    <p className="text-emerald-100 text-sm sm:text-base">
                      {user.role === "admin"
                        ? "Manage and track your job postings"
                        : "Monitor all job listings across the platform"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  {/* <Filter className="h-4 w-4" /> */}
                  <span className="text-sm font-medium">Advanced Filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 sm:p-8">
              <JobTable />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Job;
