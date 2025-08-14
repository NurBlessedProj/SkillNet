"use client";
import React from "react";
import Profile from "./components/profile";
import Application from "./components/application";
import { GetProfileData } from "@/app/apis/profile_data/getDatabyId";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

const Details = () => {
  const t = useTranslations(); // Initialize translation hook
  const router = useRouter();
  const locale = useLocale(); // Get current locale
  const { profileData: data, loading, error } = GetProfileData();

  const handleGoBack = () => {
    // Navigate to candidates page while preserving the current locale
    router.push(`/${locale}/candidates`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-800 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-emerald-100 dark:bg-emerald-700 rounded-full animate-ping"></div>
              <div className="absolute inset-4 bg-emerald-50 dark:bg-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              Loading ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100vh] w-full flex flex-col justify-center items-center bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-red-600 font-medium">
              {error || t("details.noDataFound")}
            </p>
            <button
              onClick={handleGoBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t("details.back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-auto px-4 bg-gray-50 dark:bg-gray-900">
      <div
        className="flex my-5 space-x-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        onClick={handleGoBack}
      >
        <i className="ri-arrow-left-line text-xl"></i>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          {t("details.back")}
        </h2>
      </div>
      <div className="w-full flex space-x-6">
        <div className="w-[35%]">
          <Profile data={data} />
        </div>
        <div className="w-[65%]">
          <Application data={data} />
        </div>
      </div>
    </div>
  );
};

export default Details;
