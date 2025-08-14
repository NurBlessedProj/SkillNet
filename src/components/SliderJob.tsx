"use client";
import React, { useState, useEffect, ReactNode, FC } from "react";
import { useForm } from "react-hook-form";
import Select, { MultiValue } from "react-select";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import "react-quill/dist/quill.snow.css";
import CreatableSelect from "react-select/creatable";
import { AlertTriangle, Plus } from "lucide-react";
import CryptoJS from "crypto-js";
import { usePathname, useRouter } from "next/navigation";
import { getUserRole } from "@/app/apis/job/getJobs";
import { useTranslations } from "next-intl";

// Add these with your other interfaces
interface ScoreFilter {
  exam: string;
  minScore: number;
}

interface CandidateFilter {
  scoreFilters: ScoreFilter[];
  gender?: string;
  countryOfBirth?: string;
  requiredSkills: string[];
  minYearsExperience?: number;
  qualifications: string[];
}

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface JobPostingFormData {
  company_name: string;
  company_description: string;
  category: string[];
  skills: string[];
  salary_min: number;
  salary_max: number;
  responsibilities: string;
  who_you_are: string;
  additional_requirements: string;
  end_date: string;
  capacity: number;
  capacity_needed: number;
  status: string;
  job_type: string;
  role: string;
  email?: string;
  logo_url: string;
  active: boolean;
}

interface Option {
  value: string;
  label: string;
}

interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  email: string;
}

interface Country {
  name: string;
  iso2: string;
}

interface City {
  name: string;
  countryCode: string;
  stateCode?: string;
}

const JobPostingForm = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations(); // Initialize the translation hook

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobPostingFormData>();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(
    null
  );
  const [candidateFilters, setCandidateFilters] = useState<CandidateFilter>({
    scoreFilters: [],
    requiredSkills: [],
    qualifications: [],
  });
  const [scoreFilters, setScoreFilters] = useState<ScoreFilter[]>([]);
  const [showScoreFilter, setShowScoreFilter] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const [responsibilities, setResponsibilities] = useState("");
  const [whoYouAre, setWhoYouAre] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    50000, 100000,
  ]);
  const [jobType, setJobType] = useState("Full-time");
  const [role, setRole] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [endDate, setEndDate] = useState("");

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [city, setCity] = useState("");
  const [countries, setCountries] = useState<Option[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [totalPositions, setTotalPositions] = useState(0); // Start with 0 filled positions
  const [positionsAvailable, setPositionsAvailable] = useState(1);

  const [status, setStatus] = useState("Active");
  const [active, setActive] = useState(true);
  const router = useRouter();

  // Create translated options
  const categories: Option[] = [
    { value: "Software", label: t("JobPosting.categories.software") },
    { value: "Marketing", label: t("JobPosting.categories.marketing") },
    { value: "Finance", label: t("JobPosting.categories.finance") },
    { value: "Sales", label: t("JobPosting.categories.sales") },
    { value: "Design", label: t("JobPosting.categories.design") },
  ];

  const skills: Option[] = [
    { value: "React", label: "React" },
    { value: "JavaScript", label: "JavaScript" },
    { value: "Python", label: "Python" },
    { value: "Marketing", label: t("JobPosting.skills.marketing") },
    { value: "Sales", label: t("JobPosting.skills.sales") },
  ];

  const jobTypes = [
    { value: "Full-time", label: t("JobPosting.jobTypes.fullTime") },
    { value: "Part-time", label: t("JobPosting.jobTypes.partTime") },
    { value: "Contract", label: t("JobPosting.jobTypes.contract") },
    { value: "Freelance", label: t("JobPosting.jobTypes.freelance") },
  ];

  const statusOptions = [
    { value: "Active", label: t("JobPosting.status.active") },
    { value: "Inactive", label: t("JobPosting.status.inactive") },
  ];

  const genderOptions = [
    { value: "male", label: t("JobPosting.gender.male") },
    { value: "female", label: t("JobPosting.gender.female") },
    { value: "other", label: t("JobPosting.gender.other") },
  ];

  const qualificationOptions = [
    {
      value: "Advanced Level",
      label: t("JobPosting.qualifications.advancedLevel"),
    },
    {
      value: "Higher National Diploma",
      label: t("JobPosting.qualifications.higherNationalDiploma"),
    },
    {
      value: "Bachelor Degree",
      label: t("JobPosting.qualifications.bachelorDegree"),
    },
    {
      value: "Master Degree",
      label: t("JobPosting.qualifications.masterDegree"),
    },
    { value: "PhD", label: t("JobPosting.qualifications.phd") },
  ];

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const data = await response.json();

        if (data && data.data) {
          const countryOptions = data.data.map((country: any) => ({
            value: country.iso2 || country.country,
            label: country.country,
          }));
          setCountries(countryOptions);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error(t("JobPosting.errors.failedToLoadCountries"));
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [t]);

  const formatCreateLabel = (inputValue: string) => {
    const capitalizedInput =
      inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    return t("JobPosting.createOption", { value: capitalizedInput });
  };

  const handleCreateOption = (
    inputValue: string,
    setFunction: (value: string[]) => void,
    currentValues: string[]
  ) => {
    const capitalizedInput =
      inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    setFunction([...currentValues, capitalizedInput]);
  };

  const [userRole, setUserRole] = useState<string | any>();

  const getUser = async () => {
    try {
      const { role, email } = await getUserRole();
      setUserRole(role);
      return role;
    } catch (error) {
      console.error("Error getting user role:", error);
      toast.error(t("JobPosting.errors.checkingPermissions"));
      return null;
    }
  };

  const checkIfAdmin = async () => {
    try {
      setIsAdmin(userRole === "s_admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchCompanyProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_recruter")
        .select("*")
        .order("name");

      if (error) throw error;
      setCompanyProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching company profiles:", error);
      toast.error(t("JobPosting.errors.failedToLoadCompanyProfiles"));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        // Get user role
        const { role, email } = await getUserRole();
        setUserRole(role);

        // If role is s_admin, fetch all company profiles
        if (role === "s_admin") {
          setIsAdmin(true);
          await fetchCompanyProfiles();
        } else {
          // For recruiter role, fetch their specific profile
          setIsAdmin(false);
          await fetchProfileData(email);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        toast.error(t("JobPosting.errors.loadingData"));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [t]);

  const fetchProfileData = async (email: string | any) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profile_recruter")
        .select("*")
        .eq("email", email)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error(t("JobPosting.errors.profileNotFound"));
        return;
      }

      setProfileData(profile);
      setSelectedCompany(profile);
      setValue("company_name", profile.name);
      setValue("company_description", profile.description);
      setValue("email", email);
      setValue("logo_url", profile.logo_url);
    } catch (error: any) {
      console.error("Error fetching profile :", error);
      toast.error(t("JobPosting.errors.fetchingProfile"));
    }
  };

  const onSubmit = async (data: JobPostingFormData) => {
    try {
      setIsSubmitting(true);

      if (isAdmin && !selectedCompany) {
        toast.error(t("JobPosting.errors.selectCompany"));
        return;
      }

      // Validate location
      if (!selectedCountry) {
        toast.error(t("JobPosting.errors.selectCountry"));
        return;
      }

      const currentProfile = isAdmin ? selectedCompany : profileData;
      if (!currentProfile?.name || !currentProfile?.description) {
        return; // Silent return since we already show the warning
      }

      // Format the location string
      const locationString = city
        ? `${city}, ${selectedCountry.label}`
        : selectedCountry.label;

      // Use the who_we_are field from the recruiter's profile if available
      const profileWhoWeAre = currentProfile.who_we_are || "";

      const jobData = {
        ...data,
        categories: selectedCategories,
        skills: selectedSkills,
        salary_min: salaryRange[0],
        salary_max: salaryRange[1],
        responsibilities,
        location: locationString,
        country: selectedCountry.label,
        city: city,
        who_you_are: profileWhoWeAre || whoYouAre, // Use profile's who_we_are if available
        additional_requirements: additionalRequirements,
        job_type: jobType,
        role,
        status,
        created_at: new Date().toISOString(),
        company_name: currentProfile.name,
        company_description: currentProfile.description,
        logo_url: currentProfile.logo_url,
        email: currentProfile.email,
        end_date: endDate,
        capacity: totalPositions,
        capacity_needed: positionsAvailable,
        active,
        candidate_filters: {
          score_filters: candidateFilters.scoreFilters,
          gender: candidateFilters.gender,
          country_of_birth: candidateFilters.countryOfBirth,
          required_skills: candidateFilters.requiredSkills,
          min_years_experience: candidateFilters.minYearsExperience,
          qualifications: candidateFilters.qualifications,
        },
      };

      const { error } = await supabase.from("job_postings").insert([jobData]);

      if (error) throw error;

      toast.success(t("JobPosting.success.jobCreated"));
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error("Error creating job posting:", error);
      toast.error(t("JobPosting.errors.failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const CompanySelector = () => {
    if (!isAdmin) return null;

    // Create company options
    const companyOptions = companyProfiles.map((profile) => ({
      value: profile.email, // Use email as unique identifier instead of id
      label: profile.name,
      profile: profile,
    }));

    // Find the selected option
    const selectedOption = selectedCompany
      ? companyOptions.find(
          (option) => option.profile.email === selectedCompany.email
        )
      : null;

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          {t("JobPosting.selectCompany")}
        </label>
        <Select
          options={companyOptions}
          value={selectedOption}
          onChange={(option: any) => {
            console.log("Selected option:", option);
            if (option) {
              setSelectedCompany(option.profile);
              setValue("company_name", option.profile.name);
              setValue("company_description", option.profile.description);
              setValue("email", option.profile.email);
              setValue("logo_url", option.profile.logo_url);
            } else {
              setSelectedCompany(null);
              setValue("company_name", "");
              setValue("company_description", "");
              setValue("email", "");
              setValue("logo_url", "");
            }
          }}
          className="w-full"
          placeholder={t("JobPosting.placeholders.selectCompany")}
          isClearable
        />
      </div>
    );
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
          <div className="text-center">
            <p className="text-gray-700 font-medium">
              {t("JobPosting.loading.info")}
            </p>
            <p className="text-sm text-gray-500">
              {t("JobPosting.loading.pleaseWait")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      <CompanySelector />
      {((isAdmin &&
        selectedCompany &&
        (!selectedCompany.name || !selectedCompany.description)) ||
        (!isAdmin &&
          profileData &&
          (!profileData.name || !profileData.description))) && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 rounded w-full">
          <div className="flex w-full">
            <div className="flex-shrink-0 pt-1">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-grow">
              <h3 className="text-sm font-medium text-red-800">
                {t("JobPosting.warnings.incompleteProfile")}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="text-wrap">
                  {t("JobPosting.warnings.completeProfileFirst")}
                </p>
                <p className="mt-1">
                  {t("JobPosting.warnings.requiredFields")}:
                </p>
                <ul className="list-disc list-inside mt-1">
                  {isAdmin && selectedCompany && !selectedCompany.name && (
                    <li>{t("JobPosting.fields.companyName")}</li>
                  )}
                  {isAdmin &&
                    selectedCompany &&
                    !selectedCompany.description && (
                      <li>{t("JobPosting.fields.companyDescription")}</li>
                    )}
                  {!isAdmin && profileData && !profileData.name && (
                    <li>{t("JobPosting.fields.companyName")}</li>
                  )}
                  {!isAdmin && profileData && !profileData.description && (
                    <li>{t("JobPosting.fields.companyDescription")}</li>
                  )}
                </ul>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => (window.location.href = "/profile_recruiter")}
                  className="text-sm font-medium text-red-800 hover:text-red-700 inline-flex items-center"
                >
                  {t("JobPosting.actions.updateProfile")}
                  <span className="ml-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("JobPosting.sections.jobDetails")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.roleTitle")}
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border rounded-md"
              placeholder={t("JobPosting.placeholders.roleTitle")}
              required
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.jobType")}
            </label>
            <Select
              options={jobTypes}
              value={jobTypes.find((type) => type.value === jobType)}
              onChange={(option) => setJobType(option?.value || "Full-time")}
              className="w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.endDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border rounded-md"
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.status")}
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find((option) => option.value === status)}
              onChange={(option) => setStatus(option?.value || "Active")}
              className="w-full"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.categories")}
            </label>
            <CreatableSelect
              options={categories}
              isMulti
              value={selectedCategories.map((category) => ({
                value: category,
                label: category,
              }))}
              onChange={(
                selected: MultiValue<{ value: string; label: string }>
              ) => setSelectedCategories(selected.map((item) => item.value))}
              onCreateOption={(inputValue) =>
                handleCreateOption(
                  inputValue,
                  setSelectedCategories,
                  selectedCategories
                )
              }
              formatCreateLabel={formatCreateLabel}
              className="w-full"
              placeholder={t(
                "JobPosting.placeholders.selectOrCreateCategories"
              )}
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.requiredSkills")}
            </label>
            <CreatableSelect
              options={skills}
              isMulti
              value={selectedSkills.map((skill) => ({
                value: skill,
                label: skill,
              }))}
              onChange={(
                selected: MultiValue<{ value: string; label: string }>
              ) => setSelectedSkills(selected.map((item) => item.value))}
              onCreateOption={(inputValue) =>
                handleCreateOption(
                  inputValue,
                  setSelectedSkills,
                  selectedSkills
                )
              }
              formatCreateLabel={formatCreateLabel}
              className="w-full"
              placeholder={t("JobPosting.placeholders.selectOrCreateSkills")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.currentPositions")}
            </label>
            <input
              type="number"
              value={totalPositions}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value));
                setTotalPositions(value);
              }}
              className="w-full cursor-not-allowed p-2.5 border rounded-md"
              min="0"
              disabled
              required
            />
          </div>

          {/* Open Positions */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.positionsNeeded")}
            </label>
            <input
              type="number"
              value={positionsAvailable}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value));
                setPositionsAvailable(value);
              }}
              className="w-full p-2.5 border rounded-md"
              min="1"
              required
            />
            <span className="text-sm text-gray-500 mt-1">
              {t("JobPosting.positionsSummary", {
                filled: totalPositions,
                needed: positionsAvailable,
              })}
            </span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("JobPosting.fields.location")}
          </label>
          <div className="space-y-2">
            <div className="flex gap-4">
              {/* Country dropdown */}
              <div className="w-full">
                <Select
                  options={countries}
                  value={selectedCountry}
                  onChange={(option) => setSelectedCountry(option)}
                  className="w-full"
                  placeholder={
                    loadingCountries
                      ? t("JobPosting.placeholders.loadingCountries")
                      : t("JobPosting.placeholders.selectCountry")
                  }
                  isLoading={loadingCountries}
                  isDisabled={loadingCountries}
                  required
                />
              </div>

              {/* City/Place input */}
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border rounded-md"
                placeholder={t("JobPosting.placeholders.cityLocation")}
              />
            </div>
            <p className="text-xs text-gray-500">
              {selectedCountry
                ? t("JobPosting.selectedCountry", {
                    country: selectedCountry.label,
                  })
                : t("JobPosting.pleaseSelectCountry")}
              {city ? t("JobPosting.selectedCity", { city }) : ""}
            </p>
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("JobPosting.fields.salaryRange")}
          </label>
          <div className="space-y-2">
            <div className="flex gap-4">
              <input
                type="number"
                value={salaryRange[0]}
                onChange={(e) =>
                  setSalaryRange([+e.target.value, salaryRange[1]])
                }
                className="w-full p-2.5 border rounded-md"
                placeholder={t("JobPosting.placeholders.minimumSalary")}
                required
              />
              <input
                type="number"
                value={salaryRange[1]}
                onChange={(e) =>
                  setSalaryRange([salaryRange[0], +e.target.value])
                }
                className="w-full p-2.5 border rounded-md"
                placeholder={t("JobPosting.placeholders.maximumSalary")}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("JobPosting.sections.candidateRequirements")}
            </h2>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
            >
              {showFilters
                ? t("JobPosting.actions.hideFilters")
                : t("JobPosting.actions.showFilters")}
            </button>
          </div>

          <div
            className={` transition-all duration-300 ease-in-out
            ${showFilters ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"}
          `}
          >
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-6">
                {/* Demographics Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("JobPosting.filters.genderPreference")}
                    </label>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find(
                        (g) => g.value === candidateFilters.gender
                      )}
                      onChange={(option) => {
                        setCandidateFilters({
                          ...candidateFilters,
                          gender: option?.value,
                        });
                      }}
                      isClearable
                      placeholder={t("JobPosting.placeholders.anyGender")}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          zIndex: 50, // Add higher z-index
                        }),
                      }}
                    />
                  </div>

                  {/* Country of Birth */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("JobPosting.filters.countryOfBirth")}
                    </label>
                    <Select
                      options={countries}
                      value={countries.find(
                        (c) => c.label === candidateFilters.countryOfBirth
                      )}
                      onChange={(option) => {
                        setCandidateFilters({
                          ...candidateFilters,
                          countryOfBirth: option?.label,
                        });
                      }}
                      isClearable
                      placeholder={t(
                        "JobPosting.placeholders.selectCountryOfBirth"
                      )}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* Skills and Experience */}
                <div className="space-y-4">
                  {/* Required Skills */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("JobPosting.filters.requiredSkills")}
                    </label>
                    <CreatableSelect
                      isMulti
                      options={skills}
                      value={candidateFilters.requiredSkills.map((skill) => ({
                        value: skill,
                        label: skill,
                      }))}
                      onChange={(selected) => {
                        setCandidateFilters({
                          ...candidateFilters,
                          requiredSkills: selected.map((item) => item.value),
                        });
                      }}
                      placeholder={t(
                        "JobPosting.placeholders.selectOrCreateRequiredSkills"
                      )}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                        }),
                      }}
                    />
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("JobPosting.filters.minimumYearsExperience")}
                    </label>
                    <input
                      type="number"
                      value={candidateFilters.minYearsExperience || ""}
                      onChange={(e) => {
                        setCandidateFilters({
                          ...candidateFilters,
                          minYearsExperience: Math.max(
                            0,
                            parseInt(e.target.value) || 0
                          ),
                        });
                      }}
                      className="w-32 p-2.5 border rounded-md"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Qualifications */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">
                    {t("JobPosting.filters.requiredQualifications")}
                  </label>
                  <Select
                    isMulti
                    options={qualificationOptions}
                    value={candidateFilters.qualifications.map((qual) => ({
                      value: qual,
                      label: qual,
                    }))}
                    onChange={(selected) => {
                      setCandidateFilters({
                        ...candidateFilters,
                        qualifications: selected.map((item) => item.value),
                      });
                    }}
                    placeholder={t(
                      "JobPosting.placeholders.selectRequiredQualifications"
                    )}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        zIndex: 50, // Add higher z-index
                      }),
                      control: (base) => ({
                        ...base,
                        zIndex: 40, // Lower than menu but higher than other elements
                      }),
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Rich Text Editors */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.responsibilities")}
            </label>
            <ReactQuill
              value={responsibilities}
              onChange={setResponsibilities}
              className="h-40"
              theme="snow"
            />
          </div>

          {/* <div>
              <label className="block text-sm font-medium mb-1">
                {t("JobPosting.fields.whoYouAre")}
              </label>
              <ReactQuill
                value={whoYouAre}
                onChange={setWhoYouAre}
                className="h-40"
                theme="snow"
              />
            </div> */}

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("JobPosting.fields.additionalRequirements")}
            </label>
            <ReactQuill
              value={additionalRequirements}
              onChange={setAdditionalRequirements}
              className="h-40"
              theme="snow"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 border rounded-md hover:bg-gray-50"
        >
          {t("JobPosting.actions.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? t("JobPosting.actions.creating")
            : t("JobPosting.actions.createJobPosting")}
        </button>
      </div>
    </form>
  );
};

const Slider = ({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog
      open={shouldRender}
      onClose={handleClose}
      className="relative z-[100]"
    >
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              className={`
                  pointer-events-auto 
                  w-screen 
                  max-w-5xl 
                  transform 
                  transition-all 
                  duration-300 
                  ease-in-out
                  ${isVisible ? "translate-x-0" : "translate-x-full"}
                `}
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="sticky top-0 z-10 bg-white">
                  <div className="flex items-center justify-between p-4 border-b">
                    <DialogTitle className="text-lg font-semibold">
                      {t("JobPosting.title")}
                    </DialogTitle>
                    <button
                      onClick={handleClose}
                      className="rounded-md text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="relative flex-1">{children}</div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default function JobPostingPage() {
  const t = useTranslations(); // Initialize the translation hook
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsSliderOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" />
        {t("JobPosting.actions.newJobPosting")}
      </button>

      <Slider isOpen={isSliderOpen} onClose={() => setIsSliderOpen(false)}>
        <JobPostingForm onClose={() => setIsSliderOpen(false)} />
      </Slider>
    </div>
  );
}
