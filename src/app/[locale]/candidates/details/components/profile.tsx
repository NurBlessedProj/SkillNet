import React from "react";
import { useTranslations } from "next-intl";

const Profile = ({ data }: any) => {
  const t = useTranslations(); // Initialize translation hook

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-6">
        <div className="relative">
          {data?.image_url ? (
            <img
              src={data.image_url}
              className="h-24 w-24 rounded-full object-cover border-4 border-emerald-100 dark:border-emerald-900/30"
              alt={t("profile.altProfileImage")}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-4 border-emerald-200 dark:border-emerald-800">
              <svg
                className="h-12 w-12 text-emerald-600 dark:text-emerald-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {data?.first_name} {data?.last_name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {data?.address}
          </p>
        </div>
      </div>
      <div className="mt-6 p-6 w-full bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
        <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
          Current Position
        </h2>
        <p className="text-emerald-700 dark:text-emerald-300 text-lg">
          {data?.current_job ? data?.current_job : t("profile.defaultJob")}
        </p>
      </div>
      <div className="mt-6 p-6 w-full bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t("profile.aboutMe")}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {data?.about || "No information provided."}
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t("profile.contact")}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <img
                src="/icons/email.svg"
                alt={t("profile.altEmailIcon")}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h5 className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {t("profile.email")}
              </h5>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {data?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <img
                src="/icons/phone.svg"
                alt={t("profile.altPhoneIcon")}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h5 className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {t("profile.phone")}
              </h5>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {data?.phone_number || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <img
                src="/icons/instagram.svg"
                alt={t("profile.altInstagramIcon")}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h5 className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {t("profile.instagram")}
              </h5>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {data?.instagram || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <img
                src="/icons/twitter.svg"
                alt={t("profile.altTwitterIcon")}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h5 className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {t("profile.twitter")}
              </h5>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {data?.twitter || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <img
                src="/icons/website.svg"
                alt={t("profile.altWebsiteIcon")}
                className="w-5 h-5"
              />
            </div>
            <div>
              <h5 className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                {t("profile.website")}
              </h5>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {data?.website || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
