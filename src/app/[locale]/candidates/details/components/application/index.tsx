"use client";
import React, { useState } from "react";
import Profile from "./profile";
import Resume from "./resume";
import Schedule from "./schedule";
import { useTranslations } from "next-intl";

const Application = ({ data }: any) => {
  const t = useTranslations(); // Initialize translation hook
  const [active, setActive] = useState("applicant");

  return (
    <div className="w-full h-[90vh] overflow-auto px-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 w-full flex justify-center">
        <div className="flex mt-2">
          <div
            onClick={() => setActive("applicant")}
            className={`py-3 px-6 cursor-pointer transition-colors ${
              active == "applicant"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <p>{t("application.tabs.applicationProfile")}</p>
          </div>
          <div
            onClick={() => setActive("resume")}
            className={`py-3 px-6 cursor-pointer transition-colors ${
              active == "resume"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <p>{t("application.tabs.resume")}</p>
          </div>
          <div
            onClick={() => setActive("schedule")}
            className={`py-3 px-6 cursor-pointer transition-colors ${
              active == "schedule"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <p>{t("application.tabs.testingSchedule")}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 p-4">
        {active == "applicant" && <Profile data={data} />}
        {active == "resume" && <Resume data={data} />}
        {active == "schedule" && <Schedule data={data} />}
      </div>
    </div>
  );
};

export default Application;
