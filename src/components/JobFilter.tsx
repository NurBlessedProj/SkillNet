// components/JobFilter.tsx
"use client";
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Select from "react-select";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
      minHeight: "42px",
      borderRadius: "0.25rem",
      borderColor: "#e5e7eb",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#bfdbfe"
        : "white",
      color: state.isSelected ? "white" : "#374151",
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
              placeholder={t("JobFilter.searchPlaceholder")}
              className="block w-full rounded-md border border-gray-200 py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          {t("JobFilter.filters")}
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
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-medium text-gray-900">
                            {t("JobFilter.filterJobs")}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="sr-only">
                                {t("JobFilter.closePanel")}
                              </span>
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-8 space-y-6">
                          {/* Job Type Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
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
                            />
                          </div>

                          {/* Status Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
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
                            />
                          </div>

                          {/* Categories Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
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
                            />
                          </div>

                          {/* Salary Range */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {t("JobFilter.salaryRange")}
                            </label>
                            <div className="flex items-center space-x-4">
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
                                className="w-full px-4 py-2 border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder={t("JobFilter.min")}
                              />
                              <span className="text-gray-500">
                                {t("JobFilter.to")}
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
                                className="w-full px-4 py-2 border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder={t("JobFilter.max")}
                              />
                            </div>
                          </div>

                          {/* Capacity Needed */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
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
                              className="w-full px-4 py-2 border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder={t("JobFilter.minimumCapacity")}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 px-6 py-4 space-x-3">
                        <button
                          type="button"
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          onClick={applyFilters}
                        >
                          {t("JobFilter.applyFilters")}
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          onClick={resetFilters}
                        >
                          {t("JobFilter.reset")}
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

export default JobFilter;
