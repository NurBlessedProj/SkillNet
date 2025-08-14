"use client";
import React, { useEffect, useState } from "react";
import Filter from "@/components/filters";
import { GetJobPostingsBasedOnProfile } from "@/app/apis/job/get_job_for_candidate";
import moment from "moment";
import Loader from "@/components/spinnerLoade";
import { CheckUserEmailExists } from "@/app/apis/answers/get_answers_by_user";
import {
  MapPin,
  Clock,
  Briefcase,
  Building,
  Users,
  DollarSign,
  Building2,
  Search,
  Star,
  TrendingUp,
  Eye,
  ArrowRight,
  Calendar,
  Zap,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { fetchAllApplied } from "@/app/apis/applied/getallapply";
import { supabase } from "@/lib/supabase";
// Import pour l'internationalisation
import { useTranslations } from "next-intl";
import Link from "next/link";

interface FilterProps {
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  maxSalary?: number;
  minSalary?: number;
  categories?: string[];
  skills?: string[];
}
interface UserProfile {
  gender?: string;
  country_of_birth?: string;
  skills?: string[] | string;
  years_of_experience?: number;
  qualifications?: string[];
  highest_qualification?: string; // Added this field
}

interface FilterOptions {
  appliedStatus: { value: string; label: string } | null;
  salaryRange: {
    min: number;
    max: number;
  };
  showAvailableOnly: boolean;
  jobType: { value: string; label: string } | null;
  categories: { value: string; label: string }[];
  skills: { value: string; label: string }[];
  experienceLevel: { value: string; label: string } | null;
}

interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

const NoJobsAvailable = () => {
  const router = useRouter();
  const t = useTranslations("ViewJobs");

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="text-center px-4">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
          {t("noJobs.title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
          {t("noJobs.description")}
        </p>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-sm sm:text-base"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("noJobs.refreshButton")}
        </button>
      </div>
    </div>
  );
};

const checkProfileCompleteness = (
  profile: UserProfile | null
): ProfileCompletenessResult => {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ["all profile information"],
    };
  }

  const missingFields: string[] = [];

  // Check gender
  if (!profile.gender) {
    missingFields.push("gender");
  }

  // Check country_of_birth
  if (!profile.country_of_birth) {
    missingFields.push("country of birth");
  }

  // Check skills - ensure it's not an empty array
  if (
    !profile.skills ||
    (Array.isArray(profile.skills) && profile.skills.length === 0)
  ) {
    missingFields.push("skills");
  }

  // Check years_of_experience - ensure it's a number and not null/undefined
  if (typeof profile.years_of_experience !== "number") {
    missingFields.push("years of experience");
  }

  // Check qualifications - can be either an array or a single value
  if (!profile.qualifications && !profile.highest_qualification) {
    missingFields.push("qualifications");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
};

const ProfileUpdateBanner = ({ profile }: { profile: UserProfile | null }) => {
  const t = useTranslations("ViewJobs");
  const profileStatus = checkProfileCompleteness(profile);

  if (profileStatus.isComplete) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-xl rounded-xl mb-4 sm:mb-6 border border-emerald-400/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start flex-1">
          <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-3 sm:mr-4 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-2">
              {t("profileBanner.title")}
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed mb-2">
              {t("profileBanner.description")}
              {profileStatus.missingFields.map((field, index) => (
                <span key={field} className="font-semibold text-emerald-200">
                  {index > 0 && index === profileStatus.missingFields.length - 1
                    ? t("profileBanner.andText")
                    : index > 0
                    ? t("profileBanner.commaText")
                    : " "}
                  {field.replace(/_/g, " ")}
                </span>
              ))}
            </p>
            <p className="text-emerald-100 text-xs sm:text-sm">
              {t("profileBanner.subtitle")}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-emerald-200/50"
        >
          {t("profileBanner.updateButton")}
        </Link>
      </div>
    </div>
  );
};

const JobViewUser = () => {
  const t = useTranslations("ViewJobs");
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const { jobPostings: data, loading: jobsLoading } =
    GetJobPostingsBasedOnProfile();
  const {
    loading: emailCheckLoading,
    emailExists,
    error,
    userEmail,
  } = CheckUserEmailExists();

  // Filter out inactive jobs
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [noResults, setNoResults] = useState(false);

  // Filter active jobs when data is loaded
  useEffect(() => {
    if (data && data.length > 0) {
      // Filter to only include active jobs
      const active = data.filter(
        (job: any) => job.status && job.status.toLowerCase() === "active"
      );
      setActiveJobs(active);
      setFilteredJobs(active);
      setNoResults(active.length === 0);
    } else {
      setActiveJobs([]);
      setFilteredJobs([]);
      setNoResults(true);
    }
  }, [data]);

  const fetchProfileData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles_data")
        .select("*")
        .eq("email", email)
        .single();

      if (error) throw error;

      // Transform the data if needed
      const transformedData = {
        ...data,
        // Parse skills if it's a string
        skills:
          typeof data.skills === "string"
            ? JSON.parse(data.skills)
            : data.skills,
        // Ensure years_of_experience is a number
        years_of_experience: Number(data.years_of_experience),
      };

      setProfileData(transformedData);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  // Update your useEffect to fetch profile data
  useEffect(() => {
    if (userEmail) {
      fetchProfileData(userEmail);
    }
  }, [userEmail]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    let filtered = [...activeJobs];

    if (term !== "") {
      filtered = activeJobs.filter((job: any) => {
        const searchString = term.toLowerCase();

        // Helper function to safely convert categories to string
        const getCategoriesString = (categories: any): string => {
          if (!categories) return "";
          if (typeof categories === "string") return categories;
          if (Array.isArray(categories)) return categories.join(" ");
          return String(categories);
        };

        return (
          job.company_name?.toLowerCase().includes(searchString) ||
          job.role?.toLowerCase().includes(searchString) ||
          job.company_description?.toLowerCase().includes(searchString) ||
          getCategoriesString(job.categories)
            .toLowerCase()
            .includes(searchString)
        );
      });
    }

    setFilteredJobs(filtered);
    setNoResults(filtered.length === 0);
  };

  const extractCategories = (categories: any): string[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (typeof categories === "string") {
      try {
        const parsed = JSON.parse(categories);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return categories
          .replace(/[\[\]"{}\\]/g, "")
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);
      }
    }
    return [];
  };

  const extractSkills = (skills: any): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === "string") {
      try {
        const parsed = JSON.parse(skills);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return skills
          .replace(/[\[\]"{}\\]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }
    return [];
  };

  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (userEmail) {
        const appliedData = await fetchAllApplied();
        const appliedJobIds = appliedData
          .filter((app: any) => app.email === userEmail)
          .map((app: any) => app.id_job_postings.toString());
        setAppliedJobs(appliedJobIds);
      }
    };
    fetchAppliedJobs();
  }, [userEmail]);

  const handleFilter = (filters: FilterOptions) => {
    let filtered = [...activeJobs];

    // Filter by applied status
    if (filters.appliedStatus?.value === "applied") {
      filtered = filtered.filter((job) =>
        appliedJobs.includes(job.id.toString())
      );
    } else if (filters.appliedStatus?.value === "not-applied") {
      filtered = filtered.filter(
        (job) => !appliedJobs.includes(job.id.toString())
      );
    }

    // Filter by job type
    if (filters.jobType && filters.jobType.value !== "all") {
      filtered = filtered.filter(
        (job) =>
          job.job_type.toLowerCase() === filters.jobType?.value.toLowerCase()
      );
    }

    // Filter by experience level
    if (filters.experienceLevel && filters.experienceLevel.value !== "all") {
      filtered = filtered.filter((job) =>
        job.role
          .toLowerCase()
          .includes(filters.experienceLevel?.value.toLowerCase())
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter((job) => {
        const jobCategories = extractCategories(job.categories);
        return filters.categories.some((category) =>
          jobCategories.some((jobCat) =>
            jobCat.toLowerCase().includes(category.value.toLowerCase())
          )
        );
      });
    }

    // Filter by skills
    if (filters.skills.length > 0) {
      filtered = filtered.filter((job) => {
        const jobSkills = extractSkills(job.skills);
        return filters.skills.some((skill) =>
          jobSkills.some((jobSkill) =>
            jobSkill.toLowerCase().includes(skill.value.toLowerCase())
          )
        );
      });
    }

    // Filter by salary range
    filtered = filtered.filter(
      (job) =>
        job.salary_max >= filters.salaryRange.min &&
        job.salary_min <= filters.salaryRange.max
    );

    // Filter available jobs
    if (filters.showAvailableOnly) {
      filtered = filtered.filter(
        (job) =>
          job.capacity_needed > 0 && !appliedJobs.includes(job.id.toString())
      );
    }

    setFilteredJobs(filtered);
    setNoResults(filtered.length === 0);
  };

  const router = useRouter();
  const path = usePathname();

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("en-US").format(salary);
  };

  const formatCategories = (categoriesStr: string) => {
    try {
      const cleanStr = categoriesStr.replace(/\\/g, "");
      const parsed = JSON.parse(cleanStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  if (jobsLoading || emailCheckLoading) {
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
              {t("loading.title")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t("loading.subtitle")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        path === "/test" ? "h-screen" : "h-[calc(100vh-64px)]"
      } bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ProfileUpdateBanner profile={profileData} />

        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className={`${
                  path === "/test"
                    ? "text-xl sm:text-2xl"
                    : "text-2xl sm:text-3xl"
                } font-bold text-gray-900 dark:text-white mb-2`}
              >
                {t("pageTitle")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                {t("pageSubtitle")}
              </p>
            </div>

            {/* Stats */}
            {activeJobs.length > 0 && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {activeJobs.length} Jobs Available
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {appliedJobs.length} Applied
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section */}
        {activeJobs.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <Filter
              onSearch={handleSearch}
              onFilter={handleFilter}
              maxSalary={Math.max(...activeJobs.map((job) => job.salary_max))}
              minSalary={Math.min(...activeJobs.map((job) => job.salary_min))}
              categories={Array.from(
                new Set(
                  activeJobs.flatMap((job) => extractCategories(job.categories))
                )
              )}
              skills={Array.from(
                new Set(activeJobs.flatMap((job) => extractSkills(job.skills)))
              )}
            />
          </div>
        )}

        {/* Content Section */}
        {activeJobs.length === 0 ? (
          <NoJobsAvailable />
        ) : noResults ? (
          <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("noResults.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              {t("noResults.description")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Job cards mapping */}
            {filteredJobs.map((job: any) => (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                {/* Header */}
                <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  {job.logo_url ? (
                    <img
                      src={job.logo_url}
                      alt={`${job.company_name} logo`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center border border-emerald-200 dark:border-emerald-700">
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {job.company_name}
                    </h2>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                      {job.role}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4 mr-2 sm:mr-3 text-emerald-500" />
                    <span className="text-xs sm:text-sm">
                      <span className="font-medium">{job.capacity_needed}</span>{" "}
                      positions available
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Briefcase className="w-4 h-4 mr-2 sm:mr-3 text-emerald-500" />
                    <span className="text-xs sm:text-sm">{job.job_type}</span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <DollarSign className="w-4 h-4 mr-2 sm:mr-3 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-medium">
                      ${formatSalary(job.salary_min)} - $
                      {formatSalary(job.salary_max)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4 mb-4 sm:mb-6">
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {job.company_description}
                  </p>
                </div>

                {/* Categories */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {formatCategories(job.categories)
                      .slice(0, 3)
                      .map((category: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium border border-emerald-200 dark:border-emerald-700"
                        >
                          {category}
                        </span>
                      ))}
                    {formatCategories(job.categories).length > 3 && (
                      <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                        +{formatCategories(job.categories).length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                  {/* Applied Status */}
                  {appliedJobs.includes(job.id.toString()) && (
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Applied
                      </div>
                    </div>
                  )}

                  {/* Posted Date */}
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span
                        className="cursor-help"
                        title={moment(job.created_at).format("LLLL")}
                      >
                        {(() => {
                          const now = moment();
                          const createdAt = moment(job.created_at);
                          const diffDays = now.diff(createdAt, "days");
                          const diffMonths = now.diff(createdAt, "months");
                          const diffYears = now.diff(createdAt, "years");

                          if (diffDays < 1) {
                            return `Today`;
                          } else if (diffDays === 1) {
                            return `Yesterday`;
                          } else if (diffDays < 30) {
                            return `${diffDays} days ago`;
                          } else if (diffMonths < 12) {
                            return `${diffMonths} months ago`;
                          } else {
                            return `${diffYears} years ago`;
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      <span>View Details</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/jobs/socialMediaAssistance?id=${job.id}`}
                    className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center justify-center text-sm sm:text-base"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobViewUser;
