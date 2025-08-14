"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Profile_recruiter_update from "./update";
import Loader from "@/components/spinnerLoade";
import { Building, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ProfileData {
  name: string;
  description: string;
  email: string;
  logo_url: string | null;
  who_we_are?: string;
}

const Profile_recruiter = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations(); // Initialize translation hook

  const fetchProfileData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const email = sessionData.session.user.email;

        const { data, error } = await supabase
          .from("profile_recruter")
          .select("*")
          .eq("email", email)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setProfileData(data);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("ProfileRecruiter.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateComplete = () => {
    setIsEditing(false);
    fetchProfileData(); // Refresh the profile data
  };

  if (loading) {
    return (
      <div className="min-h-[100vh] w-full flex flex-col justify-center items-center bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-transparent border-t-gray-300 rounded-full animate-spin animate-delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return <Profile_recruiter_update onUpdateComplete={handleUpdateComplete} />;
  }
  const labelClasses = "block text-sm font-medium text-gray-500";
  const valueClasses = "text-lg font-semibold text-gray-900";

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="h-[calc(100vh-12px)] overflow-y-auto px-14 ">
        <div className="mx-auto">
          <div className="overflow-hidden">
            <div className="px-6 py-4">
              {/* Header */}
              <div className="mb-10 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("ProfileRecruiter.companyProfile")}
                  </h2>
                  <p className="text-gray-600">
                    {t("ProfileRecruiter.companyInfo")}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Pencil className="w-4 h-4" />
                  {t("ProfileRecruiter.editProfile")}
                </button>
              </div>

              {/* Profile Header with Logo and Basic Info */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Company Logo */}
                <div className="flex-shrink-0">
                  <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg">
                    {profileData?.logo_url ? (
                      <img
                        src={profileData.logo_url}
                        alt={t("ProfileRecruiter.companyLogo")}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Building className="w-10 h-10 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-grow flex flex-col justify-center">
                  <div className="space-y-4">
                    <div>
                      <span className={labelClasses}>
                        {t("ProfileRecruiter.companyName")}
                      </span>
                      <div className={valueClasses}>
                        {profileData?.name || t("ProfileRecruiter.notProvided")}
                      </div>
                    </div>

                    <div>
                      <span className={labelClasses}>
                        {t("ProfileRecruiter.contactEmail")}
                      </span>
                      <div className={valueClasses}>
                        {profileData?.email ||
                          t("ProfileRecruiter.notProvided")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-8">
                <span className={labelClasses}>
                  {t("ProfileRecruiter.companyDescription")}
                </span>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg min-h-[100px] whitespace-pre-wrap text-gray-800">
                  {profileData?.description ||
                    t("ProfileRecruiter.noDescriptionProvided")}
                </div>
              </div>

              {/* Who We Are Section */}
              <div className="mt-8">
                <span className={labelClasses}>
                  {t("ProfileRecruiter.whoWeAre")}
                </span>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg min-h-[100px]">
                  {profileData?.who_we_are ? (
                    <div
                      className="prose max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: profileData.who_we_are,
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      {t("ProfileRecruiter.noInformationProvided")}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t("ProfileRecruiter.autoIncludeInfo")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile_recruiter;
