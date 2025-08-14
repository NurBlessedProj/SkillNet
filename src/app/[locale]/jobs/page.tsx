"use client";
import React, { useEffect, useState } from "react";
import JobTable from "./components/table";
import Filter from "@/components/filters";
import Slider from "@/components/SliderJob";
import JobPostingForm from "./new/page";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { useTranslations } from "next-intl";
import ProtectedRoute from "@/components/ProtectedRoute";

const Job = () => {
  const t = useTranslations(); // Initialize the translation hook
  const [user, setUser] = useState<any>({ role: "", email: null });

  console.log("user role table", user);

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
      <div className="px-5 mt-12">
        <div className="">
          <div className="w-full py-2 mt-2 flex items-center justify-between mb-6  ">
            {user.role === "admin" ? (
              <h2 className="text-xl font-semibold">
                {t("Job.myJobListings")}
              </h2>
            ) : user.role === "s_admin" ? (
              <h2 className="text-xl font-semibold">
                {t("Job.allJobListings")}
              </h2>
            ) : (
              <>&nbsp;</>
            )}
            <div className="">
              <Slider />
            </div>
          </div>
          <JobTable />
        </div>
      </div>
    </ProtectedRoute>
  );
};
export default Job;
