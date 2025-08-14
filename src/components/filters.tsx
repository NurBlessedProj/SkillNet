"use client";
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Select from "react-select";
import { Switch } from "@headlessui/react";
import { useTranslations } from "next-intl"; // Add this import

interface FilterProps {
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  maxSalary?: number;
  minSalary?: number;
  categories?: string[];
  skills?: string[];
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

const Filter: React.FC<FilterProps> = ({
  onSearch,
  onFilter,
  maxSalary = 200000,
  minSalary = 0,
  categories = [],
  skills = [],
}) => {
  const t = useTranslations(); // Initialize the translation hook
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    appliedStatus: null,
    salaryRange: {
      min: minSalary,
      max: maxSalary,
    },
    showAvailableOnly: false,
    jobType: null,
    categories: [],
    skills: [],
    experienceLevel: null,
  });

  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const jobTypes = [
    { value: "all", label: t("ViewJobs.filter.options.allTypes") },
    { value: "full-time", label: t("ViewJobs.filter.options.fullTime") },
    { value: "part-time", label: t("ViewJobs.filter.options.partTime") },
    { value: "contract", label: t("ViewJobs.filter.options.contract") },
    { value: "internship", label: t("ViewJobs.filter.options.internship") },
  ];

  const experienceLevels = [
    { value: "all", label: t("ViewJobs.filter.options.allLevels") },
    { value: "senior", label: t("ViewJobs.filter.options.senior") },
    { value: "mid-level", label: t("ViewJobs.filter.options.midLevel") },
    { value: "junior", label: t("ViewJobs.filter.options.junior") },
    { value: "entry", label: t("ViewJobs.filter.options.entry") },
  ];

  const applicationStatus = [
    { value: "all", label: t("ViewJobs.filter.options.allJobs") },
    { value: "applied", label: t("ViewJobs.filter.options.appliedJobs") },
    {
      value: "not-applied",
      label: t("ViewJobs.filter.options.notAppliedJobs"),
    },
  ];

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category,
  }));

  const skillOptions = skills.map((skill) => ({
    value: skill,
    label: skill,
  }));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    if (onFilter) {
      onFilter(tempFilters);
    }
    setIsOpen(false);
  };

  const resetFilters = () => {
    const resetState: FilterOptions = {
      appliedStatus: null,
      salaryRange: {
        min: minSalary,
        max: maxSalary,
      },
      showAvailableOnly: false,
      jobType: null,
      categories: [],
      skills: [],
      experienceLevel: null,
    };
    setTempFilters(resetState);
    if (onFilter) {
      onFilter(resetState);
    }
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "42px",
      border: "1px solid rgb(75 85 99)",
      borderRadius: "0.5rem",
      boxShadow: "none",
      backgroundColor: "rgb(31 41 55)",
      "&:hover": {
        border: "1px solid rgb(16 185 129)",
      },
      "&:focus-within": {
        border: "1px solid rgb(16 185 129)",
        boxShadow: "0 0 0 1px rgb(16 185 129)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "rgb(31 41 55)",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      border: "1px solid rgb(75 85 99)",
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      padding: "4px",
    }),
    option: (
      base: any,
      state: { isSelected: boolean; isFocused: boolean }
    ) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgb(16 185 129)"
        : state.isFocused
        ? "rgb(55 65 81)"
        : "rgb(31 41 55)",
      color: state.isSelected ? "white" : "rgb(209 213 219)",
      borderRadius: "0.375rem",
      margin: "2px 0",
      "&:active": {
        backgroundColor: "rgb(16 185 129)",
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "rgb(16 185 129)",
      borderRadius: "0.375rem",
      margin: "2px",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "white",
      fontWeight: "500",
      padding: "2px 6px",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "white",
      borderRadius: "0 0.375rem 0.375rem 0",
      "&:hover": {
        backgroundColor: "rgb(239 68 68)",
        color: "white",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "rgb(209 213 219)",
      fontWeight: "500",
    }),
    input: (base: any) => ({
      ...base,
      color: "rgb(209 213 219)",
      margin: "0",
      padding: "0",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "rgb(156 163 175)",
      fontWeight: "400",
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "8px 12px",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      padding: "0 8px",
    }),
    indicatorSeparator: (base: any) => ({
      ...base,
      backgroundColor: "rgb(75 85 99)",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "rgb(156 163 175)",
      "&:hover": {
        color: "rgb(16 185 129)",
      },
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: "rgb(156 163 175)",
      "&:hover": {
        color: "rgb(239 68 68)",
      },
    }),
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={t("ViewJobs.filter.searchPlaceholder")}
              className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 py-2 sm:py-2.5 pl-8 sm:pl-10 pr-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition-colors duration-200"
            />
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          {t("ViewJobs.filter.filtersButton")}
        </button>
      </div>

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
                      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                            {t("ViewJobs.filter.title")}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="sr-only">
                                {t("ViewJobs.filter.closePanel")}
                              </span>
                              <X
                                className="h-5 w-5 sm:h-6 sm:w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                          {/* Application Status */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.applicationStatus")}
                            </label>
                            <Select
                              value={tempFilters.appliedStatus}
                              onChange={(option) =>
                                setTempFilters({
                                  ...tempFilters,
                                  appliedStatus: option,
                                })
                              }
                              options={applicationStatus}
                              styles={selectStyles}
                              isClearable
                            />
                          </div>

                          {/* Job Type */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.jobType")}
                            </label>
                            <Select
                              value={tempFilters.jobType}
                              onChange={(option) =>
                                setTempFilters({
                                  ...tempFilters,
                                  jobType: option,
                                })
                              }
                              options={jobTypes}
                              styles={selectStyles}
                              isClearable
                            />
                          </div>

                          {/* Experience Level */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.experienceLevel")}
                            </label>
                            <Select
                              value={tempFilters.experienceLevel}
                              onChange={(option) =>
                                setTempFilters({
                                  ...tempFilters,
                                  experienceLevel: option,
                                })
                              }
                              options={experienceLevels}
                              styles={selectStyles}
                              isClearable
                            />
                          </div>

                          {/* Categories */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.categories")}
                            </label>
                            <Select
                              isMulti
                              value={tempFilters.categories}
                              onChange={(options) =>
                                setTempFilters({
                                  ...tempFilters,
                                  categories: options as {
                                    value: string;
                                    label: string;
                                  }[],
                                })
                              }
                              options={categoryOptions}
                              styles={selectStyles}
                            />
                          </div>

                          {/* Skills */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.skills")}
                            </label>
                            <Select
                              isMulti
                              value={tempFilters.skills}
                              onChange={(options) =>
                                setTempFilters({
                                  ...tempFilters,
                                  skills: options as {
                                    value: string;
                                    label: string;
                                  }[],
                                })
                              }
                              options={skillOptions}
                              styles={selectStyles}
                            />
                          </div>

                          {/* Salary Range */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.salaryRange")}
                            </label>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                              <input
                                type="number"
                                value={tempFilters.salaryRange.min}
                                onChange={(e) =>
                                  setTempFilters({
                                    ...tempFilters,
                                    salaryRange: {
                                      ...tempFilters.salaryRange,
                                      min: Number(e.target.value),
                                    },
                                  })
                                }
                                placeholder={t(
                                  "ViewJobs.filter.minPlaceholder"
                                )}
                                className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 py-2 px-2 sm:px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm transition-colors duration-200"
                              />
                              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                {t("ViewJobs.filter.to")}
                              </span>
                              <input
                                type="number"
                                value={tempFilters.salaryRange.max}
                                onChange={(e) =>
                                  setTempFilters({
                                    ...tempFilters,
                                    salaryRange: {
                                      ...tempFilters.salaryRange,
                                      max: Number(e.target.value),
                                    },
                                  })
                                }
                                placeholder={t(
                                  "ViewJobs.filter.maxPlaceholder"
                                )}
                                className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 py-2 px-2 sm:px-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm transition-colors duration-200"
                              />
                            </div>
                          </div>

                          {/* Available Jobs Toggle */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("ViewJobs.filter.showAvailableOnly")}
                            </span>
                            <Switch
                              checked={tempFilters.showAvailableOnly}
                              onChange={(checked) =>
                                setTempFilters({
                                  ...tempFilters,
                                  showAvailableOnly: checked,
                                })
                              }
                              className={`${
                                tempFilters.showAvailableOnly
                                  ? "bg-emerald-600"
                                  : "bg-gray-200 dark:bg-gray-600"
                              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  tempFilters.showAvailableOnly
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 space-x-2 sm:space-x-3">
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors duration-200"
                          onClick={applyFilters}
                        >
                          {t("ViewJobs.filter.applyFilters")}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          onClick={resetFilters}
                        >
                          {t("ViewJobs.filter.resetFilters")}
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

export default Filter;
