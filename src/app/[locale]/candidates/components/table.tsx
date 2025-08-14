// components/CandidateTable.tsx
"use client";
import React, { FC, useEffect, useState } from "react";
import moment from "moment";
import ModalDelete from "../../jobs/components/modalDelete";
import DataGridDemo from "@/components/muitable";
import { Loader2 } from "lucide-react";
import { GetAnswers } from "@/app/apis/getData/getAnswers";
import CandidateFilter from "@/components/CandidatesFilter";
import { getUserRole } from "@/app/apis/job/getJobs";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";

export interface FilterOptions {
  searchTerm: string;
  country: string;
  qualification: string;
  experience: string;
  skills: string[];
  gender: string;
  language: string;
  discipline: string;
  showHighScoreOnly: boolean;
  scoreRange: {
    min: number;
    max: number;
  };
}

export const initialFilterState: FilterOptions = {
  searchTerm: "",
  country: "",
  qualification: "",
  experience: "",
  skills: [],
  gender: "",
  language: "",
  discipline: "",
  showHighScoreOnly: false,
  scoreRange: {
    min: 0,
    max: 100,
  },
};

const CandidateTable = () => {
  const t = useTranslations();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilterState);

  const getUser = async () => {
    const { role, email } = await getUserRole();
    setRole(role);
  };

  // Modify the fetchAllCandidates function to join with profiles_data table
  const fetchAllCandidates = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user"); // Only get candidates

      if (profilesError) {
        throw profilesError;
      }

      // Also fetch profiles_data to get additional information
      const { data: profilesData, error: profilesDataError } = await supabase
        .from("profiles_data")
        .select("*");

      if (profilesDataError) {
        console.error("Error fetching profiles_data:", profilesDataError);
      }

      // Also fetch test answers to merge with profiles
      const { data: answers, error: answersError } = await supabase
        .from("answers")
        .select("*");

      if (answersError) {
        console.error("Error fetching answers:", answersError);
      }

      // Map profiles to the expected format
      const formattedCandidates = profiles.map((profile) => {
        // Find matching profile data
        const profileData = profilesData?.find(
          (data) => data.email === profile.email
        );

        // Find matching test answers for this candidate if any
        const candidateAnswers =
          answers?.filter((answer) => answer.email === profile.email) || [];

        // Get the highest score answer instead of the most recent one
        const highestScoreAnswer =
          candidateAnswers.length > 0
            ? candidateAnswers.sort(
                (a, b) => parseInt(b.score || "0") - parseInt(a.score || "0")
              )[0]
            : null;

        // Use the score and overall from the highest score answer
        const score = highestScoreAnswer
          ? parseInt(highestScoreAnswer.score) || 0
          : 0;
        const overall = highestScoreAnswer
          ? parseInt(highestScoreAnswer.overall) || 0
          : 0;
        const exam = highestScoreAnswer ? highestScoreAnswer.exam : null;
        const subject_score = highestScoreAnswer
          ? highestScoreAnswer.subject_score
          : null;

        // Get experience from profiles_data if available
        const experience =
          profileData?.years_of_experience || profile.experience || "0";

        return {
          id: profile.id,
          email: profile.email,
          fullName:
            profile.full_name || profile.name || profile.email?.split("@")[0],
          section: profile.section,
          location: profile.country || profile.location || "Not specified",
          experience: experience,
          qualification:
            profileData?.highest_qualification ||
            profile.qualification ||
            "Not specified",
          gender: profileData?.gender || profile.gender || "Not specified",
          countryOfBirth:
            profileData?.country_of_birth || profile.country || "Not specified",
          created_at: profile.created_at,
          score: score,
          overall: overall,
          exam: exam,
          subject_score: subject_score,
          profile: {
            ...profile,
            gender: profileData?.gender || profile.gender,
            language: profile.language,
            section: profile.section,
          },
        };
      });

      setData(formattedCandidates);
      setFilteredData(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Modified to actually delete the candidate from the database
  const handleDelete = async (id: string, email: string) => {
    try {
      // Delete from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("email", email);

      if (profileError) {
        console.error("Error deleting from profiles:", profileError);
        return;
      }

      // Delete from profiles_data table
      const { error: profileDataError } = await supabase
        .from("profiles_data")
        .delete()
        .eq("email", email);

      if (profileDataError) {
        console.error("Error deleting from profiles_data:", profileDataError);
      }

      // Delete from answers table if exists
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("email", email);

      if (answersError) {
        console.error("Error deleting from answers:", answersError);
      }

      // Remove the deleted item from both data and filteredData
      const newData = data.filter((item) => item.email !== email);
      const newFilteredData = filteredData.filter(
        (item) => item.email !== email
      );

      setData(newData);
      setFilteredData(newFilteredData);
    } catch (error) {
      console.error("Error during deletion:", error);
    }
  };

  const column = [
    {
      field: "fullName",
      headerName: t("CandidateTable.columns.candidate"),
      width: 200,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div className="flex items-center gap-3">
          
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {params.row.fullName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {params.row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      field: "score",
      headerName: t("CandidateTable.columns.scoreOverall"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => {
        // Check if both score and overall are 0 (no test taken)
        if (params.row.score === 0 && params.row.overall === 0) {
          return (
            <div className="text-gray-400 dark:text-gray-500 text-sm">N/A</div>
          );
        }

        const percentage =
          params.row.overall > 0
            ? (params.row.score / params.row.overall) * 100
            : 0;
        const getScoreColor = (percent: number) => {
          if (percent >= 80) return "text-emerald-600 dark:text-emerald-400";
          if (percent >= 60) return "text-yellow-600 dark:text-yellow-400";
          return "text-red-600 dark:text-red-400";
        };

        return (
          <div className="flex items-center space-x-2">
            <i
              className={`ri-star-fill text-[16px] ${getScoreColor(
                percentage
              )}`}
            ></i>
            <span className={`font-medium ${getScoreColor(percentage)}`}>
              {params.row.score || 0} / {params.row.overall || 0}
            </span>
            {params.row.exam && (
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                ({params.row.exam})
              </span>
            )}
          </div>
        );
      },
    },
    {
      field: "location",
      headerName: t("CandidateTable.columns.location"),
      width: 150,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div className="text-gray-700 dark:text-gray-300">
          {params.row.location}
        </div>
      ),
    },
    {
      field: "experience",
      headerName: t("CandidateTable.columns.experience"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => {
        // Handle the +10 format from profiles_data
        const exp = params.row.experience;
        if (!exp || exp === "0") {
          return (
            <div className="text-gray-400 dark:text-gray-500 text-sm">N/A</div>
          );
        }

        // Check if experience starts with "+"
        if (exp.startsWith("+")) {
          return (
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              {exp.substring(1)} {t("CandidateTable.years")}
            </div>
          );
        }

        return (
          <div className="text-gray-700 dark:text-gray-300 font-medium">
            {exp} {t("CandidateTable.years")}
          </div>
        );
      },
    },
    {
      field: "qualification",
      headerName: t("CandidateTable.columns.highestQualification"),
      width: 150,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div className="text-gray-700 dark:text-gray-300">
          {params.row.qualification}
        </div>
      ),
    },
    {
      field: "section",
      headerName: t("CandidateTable.columns.discipline"),
      width: 150,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
            {params.row.section}
          </span>
        </div>
      ),
    },
    {
      field: "created_date",
      headerName: t("CandidateTable.columns.registrationDate"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {moment(params.row.created_at).format("MMMM D, YYYY")}
        </div>
      ),
    },
    {
      field: "actions",
      headerName: t("CandidateTable.columns.actions"),
      width: 120,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
        <div className="flex gap-2">
          <ViewButton email={params.row.email} />
          {role !== "admin" && (
            <MoreIcon
              id={params.row.id}
              email={params.row.email}
              handleDelete={handleDelete}
            />
          )}
        </div>
      ),
    },
  ];

  // Use our new function to fetch all candidates
  useEffect(() => {
    fetchAllCandidates();
    getUser();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      let filtered = [...data];

      // Apply search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.fullName?.toLowerCase().includes(searchLower) ||
            item.email?.toLowerCase().includes(searchLower) ||
            item.location?.toLowerCase().includes(searchLower)
        );
      }

      // Apply country filter
      if (filters.country) {
        filtered = filtered.filter((item) =>
          item.countryOfBirth
            ?.toLowerCase()
            .includes(filters.country.toLowerCase())
        );
      }

      // Apply discipline/section filter
      if (filters.discipline) {
        filtered = filtered.filter((item) => {
          // Check both section field and profile.section field
          const section = item.section || item.profile?.section;
          return section === filters.discipline;
        });
      }

      // Apply qualification filter
      if (filters.qualification) {
        filtered = filtered.filter(
          (item) => item.qualification === filters.qualification
        );
      }

      // Apply experience filter
      if (filters.experience) {
        filtered = filtered.filter(
          (item) =>
            parseInt(item.experience || 0) >= parseInt(filters.experience)
        );
      }

      // Apply gender filter
      if (filters.gender) {
        filtered = filtered.filter(
          (item) => item.profile?.gender === filters.gender
        );
      }

      // Apply language filter
      if (filters.language) {
        filtered = filtered.filter((item) => {
          const language = item.profile?.language;
          if (typeof language === "string") {
            return language.toLowerCase() === filters.language.toLowerCase();
          } else if (language && typeof language === "object") {
            return (
              language.value.toLowerCase() === filters.language.toLowerCase()
            );
          }
          return false;
        });
      }

      // Modified score range filter to be more inclusive and handle higher scores
      filtered = filtered.filter((item) => {
        const score = parseInt(item.score || 0);
        return (
          (!filters.scoreRange.min || score >= filters.scoreRange.min) &&
          (!filters.scoreRange.max || score <= filters.scoreRange.max)
        );
      });

      // Apply high score only filter
      if (filters.showHighScoreOnly) {
        filtered = filtered.filter((item) => parseInt(item.score || 0) >= 9);
      }

      setFilteredData(filtered);
    }
  }, [data, filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CandidateFilter
        onFilterChange={handleFilterChange}
        filters={filters}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
      />

      {/* Table container with proper height and scrolling */}
      <div className="flex-1 overflow-hidden mt-6">
        <div className="h-full" style={{ height: "calc(100vh - 180px)" }}>
          {/* Add global styles for MUI DataGrid to ensure proper scrolling */}
          <style jsx global>{`
            .MuiDataGrid-cell {
              white-space: normal !important;
              padding: 8px !important;
              align-items: center !important;
              border-color: #e5e7eb !important;
            }
            .MuiDataGrid-virtualScroller {
              overflow-y: auto !important;
            }
            .MuiDataGrid-row {
              min-height: 48px !important;
            }
            .MuiDataGrid-row:hover {
              background-color: #f0fdf4 !important;
            }
            .MuiDataGrid-columnHeader {
              background-color: #f9fafb !important;
              font-weight: bold !important;
              border-color: #e5e7eb !important;
            }
            .MuiDataGrid-columnHeaderTitle {
              font-weight: bold !important;
              color: #374151 !important;
            }
            .MuiDataGrid-footerContainer {
              border-color: #e5e7eb !important;
            }
            .MuiDataGrid-footerContainer .MuiTablePagination-root {
              color: #374151 !important;
            }
            .dark .MuiDataGrid-cell {
              border-color: #374151 !important;
              color: #d1d5db !important;
              background-color: #1f2937 !important;
            }
            .dark .MuiDataGrid-row:hover {
              background-color: #374151 !important;
            }
            .dark .MuiDataGrid-columnHeader {
              background-color: #374151 !important;
              border-color: #4b5563 !important;
            }
            .dark .MuiDataGrid-columnHeaderTitle {
              color: #d1d5db !important;
            }
            .dark .MuiDataGrid-footerContainer {
              border-color: #4b5563 !important;
              background-color: #374151 !important;
            }
            .dark .MuiDataGrid-footerContainer .MuiTablePagination-root {
              color: #d1d5db !important;
            }
            .dark .MuiDataGrid-virtualScroller {
              background-color: #1f2937 !important;
            }
            .dark .MuiDataGrid-virtualScrollerRenderZone {
              background-color: #1f2937 !important;
            }
          `}</style>
          <DataGridDemo
            rows={filteredData}
            columns={column}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

// ViewButton Component updated to use client-side navigation
const ViewButton: FC<ViewButtonProps> = ({ email }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleView = async () => {
    setIsLoading(true);
    try {
      // Simulate a slight delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Use client-side navigation with the current locale
      router.push(
        `/${locale}/candidates/details?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      console.error("Error navigating to details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      onClick={handleView}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span>{t("CandidateTable.actions.view")}</span>
      )}
    </button>
  );
};

interface MoreIconProps {
  id: string;
  email: string;
  handleDelete: (id: string, email: string) => void;
}

const MoreIcon: FC<MoreIconProps> = ({ id, email, handleDelete }) => {
  const t = useTranslations();

  return (
    <div className="flex items-center">
      <ModalDelete
        id={id}
        email={email}
        tableName="profiles_data"
        itemName={t("CandidateTable.items.candidateData")}
        onDelete={() => handleDelete(id, email)}
      />
    </div>
  );
};

interface ViewButtonProps {
  email: string;
}

export default CandidateTable;
