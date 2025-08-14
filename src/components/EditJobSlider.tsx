"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { MultiValue } from "react-select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css";
import { useTranslations } from "next-intl";

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
interface JobPosting {
  id: string;
  company_name: string;
  company_description?: string; // Optional property
  logo_url?: string;
  categories: string[];
  skills: string[];
  capacity: number;
  location: string;
  country?: string; // Added for country storage
  city?: string; // Added for city storage
  capacity_needed: number;
  salary_min?: number;
  salary_max?: number;
  responsibilities?: string;
  who_you_are?: string;
  additional_requirements?: string;
  end_date: string;
  job_type: string;
  role: string;
  status: string;
  active: boolean;
  email: string;
}

interface Option {
  value: string;
  label: string;
}

interface EditJobFormProps {
  jobData: any;
  onClose: () => void;
  onUpdate: (updatedData: JobPosting) => void;
}

// Add these interfaces
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

const EditJobForm = ({ jobData, onClose, onUpdate }: EditJobFormProps) => {
  const t = useTranslations(); // Initialize translation hook
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(jobData.role);
  const [jobType, setJobType] = useState(jobData.job_type);
  const [showFilters, setShowFilters] = useState(false);
  const [candidateFilters, setCandidateFilters] = useState<CandidateFilter>({
    scoreFilters: jobData.candidate_filters?.score_filters || [],
    gender: jobData.candidate_filters?.gender || undefined,
    countryOfBirth: jobData.candidate_filters?.country_of_birth || undefined,
    requiredSkills: jobData.candidate_filters?.required_skills || [],
    minYearsExperience:
      jobData.candidate_filters?.min_years_experience || undefined,
    qualifications: jobData.candidate_filters?.qualifications || [],
  });
  const [selectedCategories, setSelectedCategories] = useState(
    jobData.categories.map((category: any) => ({
      value: category,
      label: category,
    }))
  );
  const [selectedSkills, setSelectedSkills] = useState(
    jobData.skills.map((skill: any) => ({ value: skill, label: skill }))
  );
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    jobData.salary_min,
    jobData.salary_max,
  ]);
  const [responsibilities, setResponsibilities] = useState(
    jobData.responsibilities || ""
  );
  const [whoYouAre, setWhoYouAre] = useState(jobData.who_you_are || "");
  const [additionalRequirements, setAdditionalRequirements] = useState(
    jobData.additional_requirements || ""
  );
  const [endDate, setEndDate] = useState(jobData.end_date);
  const [capacity, setCapacity] = useState(jobData.capacity);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [city, setCity] = useState(jobData.city || "");
  const [countries, setCountries] = useState<Option[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [capacityNeeded, setCapacityNeeded] = useState(jobData.capacity_needed);
  const [status, setStatus] = useState(jobData.status);
  const [active, setActive] = useState(jobData.active);
  const [useRecruiterWhoWeAre, setUseRecruiterWhoWeAre] = useState(false);

  // Define options with translations
  const categories = [
    { value: "Software", label: t("EditJobForm.categories.software") },
    { value: "Marketing", label: t("EditJobForm.categories.marketing") },
    { value: "Finance", label: t("EditJobForm.categories.finance") },
    { value: "Sales", label: t("EditJobForm.categories.sales") },
    { value: "Design", label: t("EditJobForm.categories.design") },
  ];

  const skills = [
    { value: "React", label: "React" },
    { value: "JavaScript", label: "JavaScript" },
    { value: "Python", label: "Python" },
    { value: "Marketing", label: t("EditJobForm.skills.marketing") },
    { value: "Sales", label: t("EditJobForm.skills.sales") },
  ];

  const jobTypes = [
    { value: "Full-time", label: t("EditJobForm.jobTypes.fullTime") },
    { value: "Part-time", label: t("EditJobForm.jobTypes.partTime") },
    { value: "Contract", label: t("EditJobForm.jobTypes.contract") },
    { value: "Freelance", label: t("EditJobForm.jobTypes.freelance") },
  ];

  const statusOptions = [
    { value: "Active", label: t("EditJobForm.status.active") },
    { value: "Inactive", label: t("EditJobForm.status.inactive") },
  ];

  const genderOptions = [
    { value: "male", label: t("EditJobForm.gender.male") },
    { value: "female", label: t("EditJobForm.gender.female") },
    { value: "other", label: t("EditJobForm.gender.other") },
  ];

  const qualificationOptions = [
    {
      value: "Advanced Level",
      label: t("EditJobForm.qualifications.advancedLevel"),
    },
    {
      value: "Higher National Diploma",
      label: t("EditJobForm.qualifications.higherNationalDiploma"),
    },
    {
      value: "Bachelor Degree",
      label: t("EditJobForm.qualifications.bachelorDegree"),
    },
    {
      value: "Master Degree",
      label: t("EditJobForm.qualifications.masterDegree"),
    },
    { value: "PhD", label: t("EditJobForm.qualifications.phd") },
  ];

  useEffect(() => {
    const fetchRecruiterProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profile_recruter")
          .select("*")
          .eq("email", jobData.email)
          .single();

        if (error) throw error;
        setRecruiterProfile(data);
      } catch (error) {
        console.error("Error fetching recruiter profile:", error);
      }
    };

    fetchRecruiterProfile();
  }, [jobData.email]);

  // Fetch countries on component mount and set initial country
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

          // Set initial country if it exists
          if (jobData.country) {
            const countryOption = countryOptions.find(
              (c: Option) => c.label === jobData.country
            );
            if (countryOption) {
              setSelectedCountry(countryOption);
            }
          } else if (jobData.location) {
            // Try to parse location if no specific country field
            const locationParts = jobData.location.split(",");
            if (locationParts.length > 1) {
              const countryName =
                locationParts[locationParts.length - 1].trim();
              const countryOption = countryOptions.find(
                (c: Option) => c.label === countryName
              );
              if (countryOption) {
                setSelectedCountry(countryOption);
                // Set city from the first part
                setCity(locationParts[0].trim());
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error(t("EditJobForm.errors.failedToLoadCountries"));
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [jobData.country, jobData.location, jobData.city, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate location
      if (!selectedCountry) {
        toast.error(t("EditJobForm.errors.selectCountry"));
        setLoading(false);
        return;
      }

      // Format the location string
      const locationString = city
        ? `${city}, ${selectedCountry.label}`
        : selectedCountry.label;

      // Use recruiter's who_we_are if checkbox is checked
      const finalWhoYouAre =
        useRecruiterWhoWeAre && recruiterProfile?.who_we_are
          ? recruiterProfile.who_we_are
          : whoYouAre;

      const updatedJobData = {
        ...jobData,
        role,
        job_type: jobType,
        categories: selectedCategories.map((cat: any) => cat.value),
        skills: selectedSkills.map((skill: any) => skill.value),
        salary_min: salaryRange[0],
        salary_max: salaryRange[1],
        responsibilities,
        location: locationString,
        country: selectedCountry.label,
        city: city,
        who_you_are: finalWhoYouAre,
        additional_requirements: additionalRequirements,
        end_date: endDate,
        capacity: Number(capacity),
        capacity_needed: Number(capacityNeeded),
        status,
        active,
        candidate_filters: {
          score_filters: candidateFilters.scoreFilters,
          gender: candidateFilters.gender,
          country_of_birth: candidateFilters.countryOfBirth,
          required_skills: candidateFilters.requiredSkills,
          min_years_experience: candidateFilters.minYearsExperience,
          qualifications: candidateFilters.qualifications,
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("job_postings")
        .update(updatedJobData)
        .eq("id", jobData.id);

      if (error) throw error;

      onUpdate(updatedJobData);
      toast.success(t("EditJobForm.success.jobUpdated"));
      onClose();
    } catch (error) {
      console.error("Error updating job posting:", error);
      toast.error(t("EditJobForm.errors.failedToUpdate"));
    } finally {
      setLoading(false);
    }
  };

  const formatCreateLabel = (inputValue: string) => {
    const capitalizedInput =
      inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    return t("EditJobForm.actions.addOption", { option: capitalizedInput });
  };

  const handleCreateOption = (
    inputValue: string,
    setFunction: (value: any) => void,
    currentValues: any[]
  ) => {
    const capitalizedInput =
      inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    const newOption = { value: capitalizedInput, label: capitalizedInput };
    setFunction([...currentValues, newOption]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("EditJobForm.titles.editJob")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.roleTitle")}
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border rounded-md"
              required
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.jobType")}
            </label>
            <Select
              options={jobTypes}
              value={jobTypes.find((type) => type.value === jobType)}
              onChange={(option) => setJobType(option?.value || "Full-time")}
              className="w-full"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.categories")}
            </label>
            <CreatableSelect
              options={categories}
              isMulti
              value={selectedCategories}
              onChange={(
                selected: MultiValue<{ value: string; label: string }>
              ) =>
                setSelectedCategories(
                  selected as { value: string; label: string }[]
                )
              }
              onCreateOption={(inputValue) =>
                handleCreateOption(
                  inputValue,
                  setSelectedCategories,
                  selectedCategories
                )
              }
              formatCreateLabel={formatCreateLabel}
              className="w-full"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.requiredSkills")}
            </label>
            <CreatableSelect
              options={skills}
              isMulti
              value={selectedSkills}
              onChange={(
                selected: MultiValue<{ value: string; label: string }>
              ) =>
                setSelectedSkills(
                  selected as { value: string; label: string }[]
                )
              }
              onCreateOption={(inputValue) =>
                handleCreateOption(
                  inputValue,
                  setSelectedSkills,
                  selectedSkills
                )
              }
              formatCreateLabel={formatCreateLabel}
              className="w-full"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.currentFilledPositions")}
            </label>
            <input
              disabled
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(0, Number(e.target.value)))}
              className="w-full cursor-not-allowed p-2.5 border rounded-md"
              min="0"
              required
            />
          </div>

          {/* Positions Needed */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.positionsNeeded")}
            </label>
            <input
              type="number"
              value={capacityNeeded}
              onChange={(e) =>
                setCapacityNeeded(Math.max(1, Number(e.target.value)))
              }
              className="w-full p-2.5 border rounded-md"
              min="1"
              required
            />
            <span className="text-sm text-gray-500 mt-1">
              {t("EditJobForm.info.applicantPositions", {
                capacity,
                needed: capacityNeeded,
              })}
            </span>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.endDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border rounded-md"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.status")}
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find((option) => option.value === status)}
              onChange={(option) => setStatus(option?.value || "Active")}
              className="w-full"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("EditJobForm.labels.location")}
          </label>
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
                    ? t("EditJobForm.placeholders.loadingCountries")
                    : t("EditJobForm.placeholders.selectCountry")
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
              placeholder={t("EditJobForm.placeholders.cityLocation")}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedCountry
              ? t("EditJobForm.info.selectedCountry", {
                  country: selectedCountry.label,
                })
              : t("EditJobForm.info.pleaseSelectCountry")}
            {city ? t("EditJobForm.info.citySelected", { city }) : ""}
          </p>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("EditJobForm.labels.salaryRange")}
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              value={salaryRange[0]}
              onChange={(e) =>
                setSalaryRange([+e.target.value, salaryRange[1]])
              }
              className="w-full p-2.5 border rounded-md"
              placeholder={t("EditJobForm.placeholders.minimumSalary")}
              required
            />
            <input
              type="number"
              value={salaryRange[1]}
              onChange={(e) =>
                setSalaryRange([salaryRange[0], +e.target.value])
              }
              className="w-full p-2.5 border rounded-md"
              placeholder={t("EditJobForm.placeholders.maximumSalary")}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("EditJobForm.titles.candidateRequirements")}
            </h2>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
            >
              {showFilters
                ? t("EditJobForm.actions.hideFilters")
                : t("EditJobForm.actions.showFilters")}
            </button>
          </div>

          <div
            className={`
            overflow-hidden transition-all duration-300 ease-in-out
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
                      {t("EditJobForm.labels.genderPreference")}
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
                      placeholder={t("EditJobForm.placeholders.anyGender")}
                    />
                  </div>

                  {/* Country of Birth */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("EditJobForm.labels.countryOfBirth")}
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
                        "EditJobForm.placeholders.selectCountryOfBirth"
                      )}
                      isLoading={loadingCountries}
                      isDisabled={loadingCountries}
                    />
                  </div>
                </div>

                {/* Skills and Experience */}
                <div className="space-y-4">
                  {/* Required Skills */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("EditJobForm.labels.requiredSkills")}
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
                        "EditJobForm.placeholders.selectOrCreateSkills"
                      )}
                    />
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("EditJobForm.labels.minYearsExperience")}
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("EditJobForm.labels.requiredQualifications")}
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
                      "EditJobForm.placeholders.selectQualifications"
                    )}
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
              {t("EditJobForm.labels.responsibilities")}
            </label>
            <ReactQuill
              value={responsibilities}
              onChange={setResponsibilities}
              className="h-40"
              theme="snow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("EditJobForm.labels.additionalRequirements")}
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
          {t("EditJobForm.actions.cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? t("EditJobForm.actions.updating")
            : t("EditJobForm.actions.updateJobPosting")}
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
  const t = useTranslations(); // Initialize translation hook
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
      // Wait for the animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // This should match the duration in the CSS transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <Dialog
      open={shouldRender}
      onClose={() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }}
      className="relative z-50"
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
                duration-500 
                ease-in-out
                ${isVisible ? "translate-x-0" : "translate-x-full"}
              `}
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="sticky top-0 z-10 bg-white">
                  <div className="flex items-center justify-between p-4 border-b">
                    <DialogTitle className="text-lg font-semibold">
                      {t("EditJobForm.titles.editJobPosting")}
                    </DialogTitle>
                    <button
                      onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => {
                          onClose();
                        }, 300);
                      }}
                      className="rounded-md text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
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

export { Slider, EditJobForm };
