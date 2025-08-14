"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Loader from "@/components/spinnerLoade";
import { Camera, Building } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const Profile_recruiter_update = ({
  onUpdateComplete,
}: {
  onUpdateComplete: () => void;
}) => {
  const t = useTranslations(); // Initialize translation hook

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitText, setSubmitText] = useState(
    t("ProfileRecruiterUpdate.createProfile")
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [whoWeAre, setWhoWeAre] = useState("");

  // Watch form values for debugging
  const watchedValues = watch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user?.email) {
          throw new Error(t("ProfileRecruiterUpdate.noAuthUser"));
        }

        setUserEmail(session.user.email);

        // Add proper error handling for when profile doesn't exist
        const { data, error } = await supabase
          .from("profile_recruter")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle(); // Use maybeSingle() instead of single()

        if (error && error.code !== "PGRST116") {
          // Handle unexpected errors
          throw error;
        }

        if (data) {
          // Profile exists
          console.log("Existing profile found:", data);
          setIsNewProfile(false);
          setUserData(data);
          setValue("name", data.name || "");
          setValue("description", data.description || "");
          setValue("email", data.email || "");
          setLogoPreview(data.logo_url || null);
          // Set who_we_are content from database
          setWhoWeAre(data.who_we_are || "");
          setSubmitText(t("ProfileRecruiterUpdate.updateProfile"));
        } else {
          // No profile exists - set up for new profile creation
          console.log("No existing profile - setting up new profile");
          setIsNewProfile(true);
          setValue("email", session.user.email);
          setSubmitText(t("ProfileRecruiterUpdate.createProfile"));
        }
      } catch (error: any) {
        console.error("Error in fetchProfile:", error);
        toast.error(t("ProfileRecruiterUpdate.failedToLoadProfile"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setValue, t]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const filePath = `logos/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("skillnet")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("skillnet").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw new Error(t("ProfileRecruiterUpdate.failedToUploadLogo"));
    }
  };

  const onSubmit = async (formData: any) => {
    if (!userEmail) {
      toast.error(t("ProfileRecruiterUpdate.noUserEmail"));
      return;
    }

    setIsSubmitting(true);
    setSubmitText(
      isNewProfile
        ? t("ProfileRecruiterUpdate.creating")
        : t("ProfileRecruiterUpdate.updating")
    );
    setUploadError(null);

    try {
      // Handle logo upload if present
      let logoUrl = userData?.logo_url;
      if (logo) {
        logoUrl = await uploadFile(logo);
      }

      const profileData = {
        email: userEmail,
        name: formData.name,
        description: formData.description,
        logo_url: logoUrl,
        who_we_are: whoWeAre, // Add who_we_are field
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("profile_recruter")
        .upsert([profileData], {
          onConflict: "email",
          ignoreDuplicates: false,
        });

      if (upsertError) throw upsertError;

      // Fetch the updated/created profile
      const { data: newData, error: fetchError } = await supabase
        .from("profile_recruter")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (fetchError) throw fetchError;

      setUserData(newData);
      setIsNewProfile(false);
      setSubmitText(t("ProfileRecruiterUpdate.updateProfile"));
      toast.success(
        isNewProfile
          ? t("ProfileRecruiterUpdate.profileCreatedSuccess")
          : t("ProfileRecruiterUpdate.profileUpdatedSuccess")
      );

      // Call the callback function to return to profile view
      onUpdateComplete();
    } catch (error: any) {
      console.error("Error in onSubmit:", error);
      setUploadError(error.message);
      toast.error(
        error.message || t("ProfileRecruiterUpdate.failedToUpdateProfile")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug logging for form state
  useEffect(() => {
    console.log("Current form values:", watchedValues);
  }, [watchedValues]);

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
  const inputClasses =
    "mt-1 block w-full bg-gray-50 p-2 rounded-sm border-gray-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200";
  const labelClasses = "block text-sm font-semibold text-gray-700 mb-1";
  const errorClasses = "mt-1 text-xs text-red-600 font-medium";

  return (
    <div className="h-[calc(100vh-12px)] overflow-y-auto px-12 ">
      <div className="mx-auto">
        <div className="overflow-hidden">
          <div className="px-6 py-6">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {t("ProfileRecruiterUpdate.editCompanyProfile")}
              </h2>
              <p className="text-gray-600">
                {t("ProfileRecruiterUpdate.updateCompanyInfo")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Logo Upload */}
              <div className="flex mb-8">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={t("ProfileRecruiterUpdate.companyLogo")}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Building className="w-10 h-10 text-blue-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-500 p-2.5 rounded-full cursor-pointer hover:bg-blue-600 transition-colors duration-200 shadow-lg">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                      aria-label={t("ProfileRecruiterUpdate.uploadLogo")}
                    />
                  </label>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>
                    {t("ProfileRecruiterUpdate.companyName")}
                  </label>
                  <input
                    type="text"
                    {...register("name", {
                      required: t("ProfileRecruiterUpdate.companyNameRequired"),
                    })}
                    className={inputClasses}
                    placeholder={t("ProfileRecruiterUpdate.enterCompanyName")}
                  />
                  {errors.name && (
                    <p className={errorClasses}>
                      {errors.name.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>
                    {t("ProfileRecruiterUpdate.contactEmail")}
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: t("ProfileRecruiterUpdate.emailRequired"),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t("ProfileRecruiterUpdate.invalidEmail"),
                      },
                    })}
                    className={inputClasses}
                    placeholder={t("ProfileRecruiterUpdate.enterContactEmail")}
                  />
                  {errors.email && (
                    <p className={errorClasses}>
                      {errors.email.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>
                    {t("ProfileRecruiterUpdate.companyDescription")}
                  </label>
                  <textarea
                    {...register("description", {
                      required: t(
                        "ProfileRecruiterUpdate.companyDescriptionRequired"
                      ),
                    })}
                    rows={6}
                    className={inputClasses}
                    placeholder={t(
                      "ProfileRecruiterUpdate.enterCompanyDescription"
                    )}
                  />
                  {errors.description && (
                    <p className={errorClasses}>
                      {errors.description.message as string}
                    </p>
                  )}
                </div>

                {/* Who We Are - Rich Text Editor */}
                <div>
                  <label className={labelClasses}>
                    {t("ProfileRecruiterUpdate.whoWeAre")}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {t("ProfileRecruiterUpdate.autoIncludeInfo")}
                  </p>
                  <div className="mt-1">
                    <ReactQuill
                      value={whoWeAre}
                      onChange={setWhoWeAre}
                      className="h-40 mb-12" // Add extra bottom margin for the editor toolbar
                      theme="snow"
                      placeholder={t(
                        "ProfileRecruiterUpdate.describeCompanyCulture"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-16">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-md shadow-sm hover:shadow-md
                    ${
                      isSubmitting
                        ? "bg-blue-300 cursor-not-allowed text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("ProfileRecruiterUpdate.updating")}
                    </span>
                  ) : (
                    submitText
                  )}
                </button>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mt-4 rounded-sm bg-red-50 p-4 border border-red-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {t("ProfileRecruiterUpdate.errorUpdatingProfile")}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {uploadError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile_recruiter_update;
