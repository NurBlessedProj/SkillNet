// components/CandidateFilter.tsx
"use client";
import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Select from "react-select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Switch } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

interface FilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  filters: FilterOptions;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface FilterOptions {
  searchTerm: string;
  country: string;
  qualification: string;
  experience: string;
  skills: string[];
  gender: string;
  language: string;
  discipline: string; // Added discipline/section filter
  showHighScoreOnly: boolean;
  scoreRange: {
    min: number;
    max: number;
  };
}

interface DisciplineOption {
  value: string;
  label: string;
}

const CandidateFilter: React.FC<FilterProps> = ({
  onFilterChange,
  filters,
  isOpen,
  setIsOpen,
}) => {
  const t = useTranslations(); // Initialize translation hook
  const [tempFilters, setTempFilters] = React.useState<FilterOptions>(filters);
  const [disciplineOptions, setDisciplineOptions] = useState<
    DisciplineOption[]
  >([{ value: "", label: t("CandidateFilter.disciplines.all") }]);
  const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(false);

  // Default sections that are commonly used
  const DEFAULT_SECTIONS = [
    "Finance",
    "Sales",
    "Marketing",
    "Operations",
    "Legal",
    "Management",
    "Business development",
    "HSE",
    "IT",
    "Engineering",
    "Driver",
  ];

  useEffect(() => {
    // Fetch disciplines/sections from the database
    const fetchDisciplines = async () => {
      setIsLoadingDisciplines(true);
      try {
        // First add all default sections as options
        const defaultOptions = DEFAULT_SECTIONS.map((section) => ({
          value: section,
          label: section,
        }));

        // Then fetch any additional sections from the database
        const { data, error } = await supabase
          .from("section")
          .select("id, name")
          .eq("is_active", "true");

        if (error) {
          console.error("Error fetching disciplines:", error);
          return;
        }

        // Add database sections that aren't already in the default list
        if (data) {
          const dbOptions = data
            .filter((section) => !DEFAULT_SECTIONS.includes(section.name))
            .map((section) => ({
              value: section.id,
              label: section.name,
            }));

          // Combine default and database options with "All" at the beginning
          setDisciplineOptions([
            { value: "", label: t("CandidateFilter.disciplines.all") },
            ...defaultOptions,
            ...dbOptions,
          ]);
        }
      } catch (error) {
        console.error("Error fetching disciplines:", error);
      } finally {
        setIsLoadingDisciplines(false);
      }
    };

    fetchDisciplines();
  }, [t]);

  const qualificationOptions = [
    { value: "", label: t("CandidateFilter.qualifications.all") },
    {
      value: "Advanced Level",
      label: t("CandidateFilter.qualifications.advancedLevel"),
    },
    {
      value: "Higher National Diploma",
      label: t("CandidateFilter.qualifications.higherNationalDiploma"),
    },
    {
      value: "Bachelor's Degree",
      label: t("CandidateFilter.qualifications.bachelorsDegree"),
    },
    {
      value: "Master's Degree",
      label: t("CandidateFilter.qualifications.mastersDegree"),
    },
    {
      value: "PhD Degree",
      label: t("CandidateFilter.qualifications.phdDegree"),
    },
  ];

  const genderOptions = [
    { value: "", label: t("CandidateFilter.genders.all") },
    { value: "male", label: t("CandidateFilter.genders.male") },
    { value: "female", label: t("CandidateFilter.genders.female") },
  ];

  const languageOptions = [
    { value: "", label: t("CandidateFilter.languages.all") },
    { value: "English", label: t("CandidateFilter.languages.english") },
    { value: "French", label: t("CandidateFilter.languages.french") },
  ];

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "0.5rem",
      borderColor: "#e5e7eb",
      backgroundColor: "white",
      "&:hover": {
        borderColor: "#10b981",
      },
      "&:focus-within": {
        borderColor: "#10b981",
        boxShadow: "0 0 0 1px #10b981",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#10b981"
        : state.isFocused
        ? "#d1fae5"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#10b981" : "#d1fae5",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#374151",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  const darkSelectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "0.5rem",
      borderColor: "#4b5563",
      backgroundColor: "#374151",
      "&:hover": {
        borderColor: "#10b981",
      },
      "&:focus-within": {
        borderColor: "#10b981",
        boxShadow: "0 0 0 1px #10b981",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#10b981"
        : state.isFocused
        ? "#374151"
        : "#1f2937",
      color: state.isSelected ? "white" : "#d1d5db",
      "&:hover": {
        backgroundColor: state.isSelected ? "#10b981" : "#374151",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#1f2937",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#d1d5db",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  const applyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const resetState: FilterOptions = {
      searchTerm: "",
      country: "",
      qualification: "",
      experience: "",
      skills: [],
      gender: "",
      language: "",
      discipline: "", // Reset discipline as well
      showHighScoreOnly: false,
      scoreRange: {
        min: 0,
        max: 11,
      },
    };
    setTempFilters(resetState);
    onFilterChange(resetState);
  };

  return (
    <div>
      {/* Search and Filter Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) =>
                onFilterChange({ ...filters, searchTerm: e.target.value })
              }
              placeholder={t("CandidateFilter.searchPlaceholder")}
              className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 pl-10 pr-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 sm:text-sm transition-colors"
            />
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          {t("CandidateFilter.filters")}
        </button>
      </div>

      {/* Filter Slide-out Panel */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                            {t("CandidateFilter.filterCandidates")}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="sr-only">
                                {t("CandidateFilter.closePanel")}
                              </span>
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-8 space-y-6">
                          {/* Discipline/Section Filter - Added new filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.discipline")}
                            </label>
                            <Select
                              options={disciplineOptions}
                              value={disciplineOptions.find(
                                (option) =>
                                  option.value === tempFilters.discipline
                              )}
                              onChange={(selectedOption) =>
                                setTempFilters({
                                  ...tempFilters,
                                  discipline: selectedOption?.value || "",
                                })
                              }
                              styles={
                                typeof window !== "undefined" &&
                                document.documentElement.classList.contains(
                                  "dark"
                                )
                                  ? darkSelectStyles
                                  : selectStyles
                              }
                              isLoading={isLoadingDisciplines}
                              placeholder={t(
                                "CandidateFilter.selectDiscipline"
                              )}
                              isClearable
                            />
                          </div>

                          {/* Country Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.country")}
                            </label>
                            <input
                              type="text"
                              placeholder={t(
                                "CandidateFilter.countryPlaceholder"
                              )}
                              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors"
                              value={tempFilters.country}
                              onChange={(e) =>
                                setTempFilters({
                                  ...tempFilters,
                                  country: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Qualification Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.qualification")}
                            </label>
                            <Select
                              options={qualificationOptions}
                              value={qualificationOptions.find(
                                (option) =>
                                  option.value === tempFilters.qualification
                              )}
                              onChange={(selectedOption) =>
                                setTempFilters({
                                  ...tempFilters,
                                  qualification: selectedOption?.value || "",
                                })
                              }
                              styles={
                                typeof window !== "undefined" &&
                                document.documentElement.classList.contains(
                                  "dark"
                                )
                                  ? darkSelectStyles
                                  : selectStyles
                              }
                              isClearable
                            />
                          </div>

                          {/* Experience Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.minimumExperience")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder={t("CandidateFilter.minimumYears")}
                              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors"
                              value={tempFilters.experience}
                              onChange={(e) =>
                                setTempFilters({
                                  ...tempFilters,
                                  experience: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Gender Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.gender")}
                            </label>
                            <Select
                              options={genderOptions}
                              value={genderOptions.find(
                                (option) => option.value === tempFilters.gender
                              )}
                              onChange={(selectedOption) =>
                                setTempFilters({
                                  ...tempFilters,
                                  gender: selectedOption?.value || "",
                                })
                              }
                              styles={
                                typeof window !== "undefined" &&
                                document.documentElement.classList.contains(
                                  "dark"
                                )
                                  ? darkSelectStyles
                                  : selectStyles
                              }
                              isClearable
                            />
                          </div>

                          {/* Language Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.language")}
                            </label>
                            <Select
                              options={languageOptions}
                              value={languageOptions.find(
                                (option) =>
                                  option.value === tempFilters.language
                              )}
                              onChange={(selectedOption) =>
                                setTempFilters({
                                  ...tempFilters,
                                  language: selectedOption?.value || "",
                                })
                              }
                              styles={
                                typeof window !== "undefined" &&
                                document.documentElement.classList.contains(
                                  "dark"
                                )
                                  ? darkSelectStyles
                                  : selectStyles
                              }
                              isClearable
                            />
                          </div>

                          {/* Score Range */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.scoreRange")}
                            </label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="number"
                                min="0"
                                max="11"
                                value={tempFilters.scoreRange.min}
                                onChange={(e) =>
                                  setTempFilters({
                                    ...tempFilters,
                                    scoreRange: {
                                      ...tempFilters.scoreRange,
                                      min: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors"
                                placeholder={t("CandidateFilter.min")}
                              />
                              <span className="text-gray-500 dark:text-gray-400">
                                {t("CandidateFilter.to")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                max="11"
                                value={tempFilters.scoreRange.max}
                                onChange={(e) =>
                                  setTempFilters({
                                    ...tempFilters,
                                    scoreRange: {
                                      ...tempFilters.scoreRange,
                                      max: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors"
                                placeholder={t("CandidateFilter.max")}
                              />
                            </div>
                          </div>

                          {/* High Score Toggle */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("CandidateFilter.showOnlyHighScoring")}
                            </span>
                            <Switch
                              checked={tempFilters.showHighScoreOnly}
                              onChange={(checked) =>
                                setTempFilters({
                                  ...tempFilters,
                                  showHighScoreOnly: checked,
                                })
                              }
                              className={`${
                                tempFilters.showHighScoreOnly
                                  ? "bg-emerald-600"
                                  : "bg-gray-200 dark:bg-gray-600"
                              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  tempFilters.showHighScoreOnly
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-x-3">
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
                          onClick={applyFilters}
                        >
                          {t("CandidateFilter.applyFilters")}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          onClick={resetFilters}
                        >
                          {t("CandidateFilter.reset")}
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default CandidateFilter;
