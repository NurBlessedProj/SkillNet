// components/JobFilter.tsx
"use client";
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Select from "react-select";
import { Search, SlidersHorizontal, X, Filter, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export interface JobFilterOptions {
  searchTerm: string;
  jobType: string;
  status: string;
  categories: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
  capacityNeeded: number;
}

export const initialJobFilterState: JobFilterOptions = {
  searchTerm: "",
  jobType: "",
  status: "",
  categories: [],
  salaryRange: {
    min: 0,
    max: 1000000,
  },
  dateRange: {
    start: "",
    end: "",
  },
  capacityNeeded: 0,
};

interface FilterProps {
  onFilterChange: (filters: JobFilterOptions) => void;
  filters: JobFilterOptions;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const JobFilter: React.FC<FilterProps> = ({
  onFilterChange,
  filters,
  isOpen,
  setIsOpen,
}) => {
  const t = useTranslations();
  const [tempFilters, setTempFilters] =
    React.useState<JobFilterOptions>(filters);

  const jobTypeOptions = [
    { value: "", label: t("JobFilter.jobTypes.all") },
    { value: "Full-time", label: t("JobFilter.jobTypes.fullTime") },
    { value: "Part-time", label: t("JobFilter.jobTypes.partTime") },
    { value: "Contract", label: t("JobFilter.jobTypes.contract") },
    { value: "Freelance", label: t("JobFilter.jobTypes.freelance") },
  ];

  const statusOptions = [
    { value: "", label: t("JobFilter.statuses.all") },
    { value: "Active", label: t("JobFilter.statuses.active") },
    { value: "Live", label: t("JobFilter.statuses.live") },
    { value: "Closed", label: t("JobFilter.statuses.closed") },
  ];

  const categoryOptions = [
    { value: "Technology", label: t("JobFilter.categories.technology") },
    { value: "Marketing", label: t("JobFilter.categories.marketing") },
    { value: "Sales", label: t("JobFilter.categories.sales") },
    { value: "AI", label: t("JobFilter.categories.ai") },
    {
      value: "Machine Learning",
      label: t("JobFilter.categories.machineLearning"),
    },
    { value: "Digital", label: t("JobFilter.categories.digital") },
    { value: "Banking", label: t("JobFilter.categories.banking") },
    { value: "Environmental", label: t("JobFilter.categories.environmental") },
  ];

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "44px",
      borderRadius: "0.5rem",
      borderColor: "#e5e7eb",
      backgroundColor: "white",
      boxShadow: "none",
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
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "#d1fae5",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "#065f46",
      fontWeight: "500",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "#065f46",
      "&:hover": {
        backgroundColor: "#a7f3d0",
        color: "#064e3b",
      },
    }),
  };

  const darkSelectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "44px",
      borderRadius: "0.5rem",
      borderColor: "#4b5563",
      backgroundColor: "#374151",
      boxShadow: "none",
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
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "#065f46",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "#d1fae5",
      fontWeight: "500",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "#d1fae5",
      "&:hover": {
        backgroundColor: "#047857",
        color: "#ecfdf5",
      },
    }),
  };

  const applyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setTempFilters(initialJobFilterState);
    onFilterChange(initialJobFilterState);
  };

  return (
    <div>
      {/* Filter Modal */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <Filter className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-white">
                            {t("JobFilter.filterJobs")}
                          </Dialog.Title>
                          <p className="text-emerald-100 text-sm">
                            Refine your job search with advanced filters
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 space-y-6">
                    {/* Job Type Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("JobFilter.jobType")}
                      </label>
                      <Select
                        options={jobTypeOptions}
                        value={jobTypeOptions.find(
                          (option) => option.value === tempFilters.jobType
                        )}
                        onChange={(selectedOption) =>
                          setTempFilters({
                            ...tempFilters,
                            jobType: selectedOption?.value || "",
                          })
                        }
                        styles={selectStyles}
                        isClearable
                        placeholder={t("JobFilter.selectJobType")}
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("JobFilter.status")}
                      </label>
                      <Select
                        options={statusOptions}
                        value={statusOptions.find(
                          (option) => option.value === tempFilters.status
                        )}
                        onChange={(selectedOption) =>
                          setTempFilters({
                            ...tempFilters,
                            status: selectedOption?.value || "",
                          })
                        }
                        styles={selectStyles}
                        isClearable
                        placeholder={t("JobFilter.selectStatus")}
                      />
                    </div>

                    {/* Categories Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("JobFilter.categoriesLabel")}
                      </label>
                      <Select
                        options={categoryOptions}
                        isMulti
                        value={categoryOptions.filter((option) =>
                          tempFilters.categories.includes(option.value)
                        )}
                        onChange={(selectedOptions) =>
                          setTempFilters({
                            ...tempFilters,
                            categories: selectedOptions.map(
                              (option) => option.value
                            ),
                          })
                        }
                        styles={selectStyles}
                        placeholder={t("JobFilter.selectCategories")}
                      />
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("JobFilter.salaryRange")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
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
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder={t("JobFilter.min")}
                          />
                        </div>
                        <div>
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
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder={t("JobFilter.max")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capacity Needed */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("JobFilter.minimumPositionsNeeded")}
                      </label>
                      <input
                        type="number"
                        value={tempFilters.capacityNeeded}
                        onChange={(e) =>
                          setTempFilters({
                            ...tempFilters,
                            capacityNeeded: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder={t("JobFilter.minimumCapacity")}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      {t("JobFilter.reset")}
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      >
                        {t("JobFilter.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        {t("JobFilter.applyFilters")}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default JobFilter;
