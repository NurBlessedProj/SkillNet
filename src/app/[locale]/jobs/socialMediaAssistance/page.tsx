"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Loader from "@/components/spinnerLoade";
import CryptoJS from "crypto-js";
import { CreateApply } from "@/app/apis/applied/apply";
import { fetchAllApplied } from "@/app/apis/applied/getallapply";
import {
  ArrowLeft,
  Building,
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  UserPlus,
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import moment from "moment";
import { EditJobForm, Slider } from "@/components/EditJobSlider";
import CandidatesModal from "@/components/CandidatesModal";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

interface JobPosting {
  id: string;
  company_name: string;
  logo_url: string;
  categories: string[];
  skills: string[];
  capacity?: number;
  capacity_needed?: number;
  [key: string]: any;
}

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  image_url: string;
  skills: string[];
  address: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  profile: {
    image_url: string;
  };
  skills?: string[];
  applied_date: string;
  status: string;
}

const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      if (field.startsWith("{") && field.endsWith("}")) {
        return field
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim().replace(/^"|"$/g, ""));
      }
      return JSON.parse(field);
    } catch {
      return field.split(",").map((item) => item.trim());
    }
  }
  return [];
};

const JobDetailsPage = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | any>([]);
  const Applied = CreateApply();

  const [urlId, setUrlId] = useState<string>("");
  const [jobData, setJobData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUser, setIsUser] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState<any | null>(false);
  const [userEmail, setUserEmail] = useState<any | null>(null);
  const [isRegularUser, setIsRegularUser] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("user");

  // Set up the referrer tracking when component mounts
  useEffect(() => {
    // Get the job ID from URL
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const id = url.searchParams.get("id");
    setUrlId(id || "");

    // Save the current referrer path before navigating to job details
    if (typeof window !== "undefined") {
      const previousPage = sessionStorage.getItem("previousPage");

      if (
        previousPage &&
        !previousPage.includes("/jobs/socialMediaAssistance")
      ) {
        console.log("Setting referrer from previousPage:", previousPage);
        sessionStorage.setItem("jobReferrer", previousPage);
      }

      sessionStorage.setItem("previousPage", pathname);
      console.log("Current pathname saved as previousPage:", pathname);
    }

    // Get user role from localStorage
    try {
      const encryptedProfile = localStorage.getItem("userProfile");
      if (encryptedProfile) {
        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const decryptedProfile = bytes.toString(CryptoJS.enc.Utf8);
        setUserRole(decryptedProfile);
      }
    } catch (error) {
      console.error("Error decrypting profile:", error);
    }
  }, [pathname]);

  const isPositionFull = jobData?.capacity >= jobData?.capacity_needed;
  const progressPercentage = jobData
    ? (jobData.capacity / jobData.capacity_needed) * 100
    : 0;

  // Handle navigation back
  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email);
        setIsUser(true);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    const encryptedProfile = localStorage.getItem("userProfile");
    if (encryptedProfile) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const decryptedProfile = bytes.toString(CryptoJS.enc.Utf8);
        setIsRegularUser(decryptedProfile === "user");
      } catch (error) {
        console.error("Error decrypting profile:", error);
      }
    }
  }, []);

  const fetchCandidates = async () => {
    if (!urlId) return;
    try {
      const { data: appliedData, error: appliedError } = await supabase
        .from("applied")
        .select("*")
        .eq("id_job_postings", urlId);

      if (appliedError) throw appliedError;

      if (appliedData) {
        const emails = appliedData.map((app) => app.email);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles_data")
          .select("*")
          .in("email", emails);

        if (profilesError) throw profilesError;

        const formattedCandidates = appliedData.map((app) => {
          const profile = profilesData?.find((p) => p.email === app.email);

          let skills: string[] = [];
          if (profile?.skills) {
            try {
              skills = parseArrayField(profile.skills);
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          }

          return {
            id: app.id,
            fullName: profile
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : app.email.split("@")[0],
            email: app.email,
            phone: profile?.phone_number || undefined,
            location: profile?.address || undefined,
            profile: {
              image_url:
                profile?.image_url ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
            },
            skills: skills,
            applied_date: app.created_at,
            status: app.status || "pending",
            experience: profile?.experience || undefined,
            id_job_postings: app.id_job_postings,
          };
        });

        console.log("Formatted Candidates:", formattedCandidates);
        setCandidates(formattedCandidates);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error(t("JobDetails.errors.candidatesLoadFailed"));
    }
  };

  useEffect(() => {
    if (urlId && userEmail) {
      const fetchJobData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("job_postings")
            .select("*")
            .eq("id", urlId)
            .single();

          if (data) {
            setJobData({
              ...data,
              id: data.id.toString(),
              categories: parseArrayField(data.categories),
              skills: parseArrayField(data.skills),
            });
          }
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchJobData();
      fetchCandidates();
    }
  }, [urlId, userEmail]);

  useEffect(() => {
    if (userEmail && urlId) {
      const checkApplicationStatus = async () => {
        const { data, error } = await supabase
          .from("applied")
          .select("*")
          .eq("id_job_postings", urlId)
          .eq("email", userEmail);

        setAlreadyApplied(data && data.length > 0);
      };
      checkApplicationStatus();
    }
  }, [userEmail, urlId]);

  const handleCancelApplication = async () => {
    if (!urlId || !userEmail) return;

    try {
      const { data: applicationData, error: fetchError } = await supabase
        .from("applied")
        .select("status")
        .eq("id_job_postings", urlId)
        .eq("email", userEmail)
        .single();

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from("applied")
        .delete()
        .eq("id_job_postings", urlId)
        .eq("email", userEmail);

      if (deleteError) throw deleteError;

      if (applicationData.status === "accepted") {
        const { data: jobData, error: jobFetchError } = await supabase
          .from("job_postings")
          .select("capacity")
          .eq("id", urlId)
          .single();

        if (jobFetchError) throw jobFetchError;

        const { error: updateError } = await supabase
          .from("job_postings")
          .update({ capacity: Math.max(0, jobData.capacity - 1) })
          .eq("id", urlId);

        if (updateError) throw updateError;

        setJobData({
          ...jobData,
          capacity: Math.max(0, jobData.capacity - 1),
        });
      }

      toast.success(t("JobDetails.success.applicationCancelled"));
      setAlreadyApplied(false);
      await fetchCandidates();
    } catch (error) {
      console.error("Error cancelling application:", error);
      toast.error(t("JobDetails.errors.cancelFailed"));
    }
  };

  const handleApply = async () => {
    if (!urlId || !userEmail) {
      toast.error(t("JobDetails.errors.loginRequired"));
      return;
    }

    try {
      const result = await Applied.Save(urlId);

      if (result.success) {
        setAlreadyApplied(true);
        await fetchCandidates();
        toast.success(t("JobDetails.success.applicationSubmitted"));
      }
    } catch (error) {
      console.error("Error applying:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-transparent border-t-gray-300 rounded-full animate-spin animate-delay-150"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {t("JobDetails.loading")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("JobDetails.loadingDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t("JobDetails.notFound.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            {t("JobDetails.notFound.description")}
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("JobDetails.backToJobs")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen pb-20 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
      <div className="max-w- mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("JobDetails.backToJobs")}
          </button>
        </div>

        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-gray-700 dark:to-gray-600 shadow-lg mx-auto sm:mx-0">
                {jobData.logo_url ? (
                  <img
                    src={jobData.logo_url}
                    alt={jobData.company_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/blank-company.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center  justify-center">
                    <Building className="w-12 h-12 text-emerald-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {jobData.role}
                  </h1>
                  {isPositionFull && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                      Position Filled
                    </span>
                  )}
                </div>
                <p className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold mb-4">
                  {jobData.company_name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("JobDetails.jobInfo.type")}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {jobData.job_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("JobDetails.jobInfo.location")}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {jobData.location || t("JobDetails.remote")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("JobDetails.jobInfo.salary")}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${jobData.salary_min.toLocaleString()} - $
                      {jobData.salary_max.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-0 flex flex-col items-center sm:items-end">
              {isUser && isRegularUser ? (
                <div className="space-y-4">
                  {alreadyApplied ? (
                    <div className="flex flex-col space-y-3">
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-6 py-3 rounded-xl flex items-center border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {t("JobDetails.application.alreadyApplied")}
                      </div>
                      <button
                        onClick={handleCancelApplication}
                        className="inline-flex items-center px-6 py-3 border border-red-600 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t("JobDetails.application.cancelApplication")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isPositionFull || Applied.loading}
                      className={`
                        inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                        ${
                          isPositionFull
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        }
                      `}
                    >
                      {Applied.loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t("JobDetails.application.applying")}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          {t("JobDetails.application.applyNow")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCandidatesModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    {t("JobDetails.employer.viewCandidates")}
                  </button>
                  <button
                    onClick={() => setIsSliderOpen(true)}
                    className="inline-flex items-center px-6 py-3 border border-emerald-600 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                  >
                    {t("JobDetails.employer.editJob")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Job Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
              <div className="prose max-w-none dark:prose-invert">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("JobDetails.sections.companyDescription")}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    {jobData.company_description}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("JobDetails.sections.responsibilities")}
                  </h2>
                  <div
                    className="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-emerald max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: jobData.responsibilities,
                    }}
                  />
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("JobDetails.sections.whoWeAre")}
                  </h2>
                  <div
                    className="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-emerald max-w-none"
                    dangerouslySetInnerHTML={{ __html: jobData.who_you_are }}
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("JobDetails.sections.requirements")}
                  </h2>
                  <div
                    className="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-emerald max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: jobData.additional_requirements,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Application Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t("JobDetails.sidebar.applicationStatus")}
              </h3>
              <div className="space-y-4">
                {alreadyApplied && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          {t("JobDetails.sidebar.applicationReviewed")}
                        </h3>
                        <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                          <p>{t("JobDetails.sidebar.reviewMessage")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between mb-3">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {jobData.capacity}
                      </span>{" "}
                      {t("JobDetails.sidebar.of")}{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {jobData.capacity_needed}
                      </span>{" "}
                      {t("JobDetails.sidebar.positionsFilled")}
                    </p>
                    {isPositionFull && (
                      <span className="text-red-500 text-sm font-semibold">
                        {t("JobDetails.sidebar.closed")}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isPositionFull ? "bg-red-500" : "bg-emerald-600"
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t("JobDetails.sidebar.jobDetails")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {t("JobDetails.sidebar.posted")}:
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {moment(jobData.created_at).fromNow()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {t("JobDetails.sidebar.employmentType")}:
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {jobData.job_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {t("JobDetails.sidebar.location")}:
                    </span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {jobData.location || t("JobDetails.remote")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t("JobDetails.sidebar.categories")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {jobData.categories.map((category: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t("JobDetails.sidebar.requiredSkills")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {jobData.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CandidatesModal
        isOpen={isCandidatesModalOpen}
        onClose={() => setIsCandidatesModalOpen(false)}
        candidates={candidates}
        jobTitle={jobData.role}
        jobId={jobData.id}
      />

      <Slider isOpen={isSliderOpen} onClose={() => setIsSliderOpen(false)}>
        <EditJobForm
          jobData={jobData}
          onClose={() => setIsSliderOpen(false)}
          onUpdate={(updatedData) => {
            setJobData(updatedData);
            setIsSliderOpen(false);
          }}
        />
      </Slider>
    </div>
  );
};

export default JobDetailsPage;
