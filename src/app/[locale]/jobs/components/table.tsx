"use client";

import { FC, useState, useEffect } from "react";
import DataGridDemo from "@/components/muitable";
import moment from "moment";
import { GridColDef } from "@mui/x-data-grid";
import { GetJobs, JobPosting } from "@/app/apis/job/getJobs";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { Loader2, Search, Filter, Eye, MoreHorizontal } from "lucide-react";
import JobFilter, {
  initialJobFilterState,
  JobFilterOptions,
} from "@/components/JobFilter";
import DeleteModalJob from "./modalDeleteJob";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface UserRole {
  role: string;
  email: string | null;
}

interface ApplicationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

const JobTable: FC = () => {
  const t = useTranslations();
  const { job, error, isLoading } = GetJobs();
  const [userRole, setUserRole] = useState<UserRole>({ role: "", email: null });
  const [filters, setFilters] = useState<JobFilterOptions>(
    initialJobFilterState
  );
  const [applicationStats, setApplicationStats] = useState<
    Record<string, ApplicationStats>
  >({});
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Define columns with translations
  const columns: GridColDef[] = [
    {
      field: "role",
      headerName: t("JobTable.columns.role"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {params.row.role}
        </div>
      ),
    },
    {
      field: "created_at",
      headerName: t("JobTable.columns.datePosted"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {moment(params.row.created_at).format("MMM D, YYYY")}
        </div>
      ),
    },
    {
      field: "end_date",
      headerName: t("JobTable.columns.dueDate"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {moment(params.row.end_date).format("MMM D, YYYY")}
        </div>
      ),
    },
    {
      field: "job_type",
      headerName: t("JobTable.columns.type"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="flex space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            {params.row.job_type}
          </span>
        </div>
      ),
    },
    {
      field: "status",
      headerName: t("JobTable.columns.status"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.status?.toLowerCase() === "active";
        const isLive = params.row.status?.toLowerCase() === "live";

        let badgeClass =
          "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600";

        if (isActive || isLive) {
          badgeClass =
            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700";
        } else if (params.row.status?.toLowerCase() === "closed") {
          badgeClass =
            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700";
        }

        return (
          <div className="flex space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}
            >
              {params.row.status}
            </span>
          </div>
        );
      },
    },
    {
      field: "applications",
      headerName: t("JobTable.columns.applications"),
      width: 150,
      minWidth: 120,
      flex: 1,
      renderCell: (params) => {
        const stats = params.row.applicationStats || {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
        };
        return (
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.total} {t("JobTable.applications.total")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-yellow-600 dark:text-yellow-400">
                {stats.pending} {t("JobTable.applications.pending")}
              </span>{" "}
              •
              <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                {stats.accepted} {t("JobTable.applications.accepted")}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      field: "capacity",
      headerName: t("JobTable.columns.positionsFilled"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {params.row.capacity}
          </div>
          <div className="w-full max-w-[60px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                params.row.capacity >= params.row.capacity_needed
                  ? "bg-red-500"
                  : "bg-emerald-600"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (params.row.capacity / params.row.capacity_needed) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      field: "capacity_needed",
      headerName: t("JobTable.columns.positionsNeeded"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {params.row.capacity_needed}
        </div>
      ),
    },
    {
      field: "actions",
      headerName: t("JobTable.columns.actions"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="flex gap-2">
          <ViewButton params={params} />
          <MoreIcon id={params.row.id} userRole={params.row.userRole} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const encryptedProfile = localStorage.getItem("userProfile");
        if (!encryptedProfile) return;

        const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
        const role = bytes.toString(CryptoJS.enc.Utf8);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const email = session?.user?.email || null;

        setUserRole({ role, email });
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };

    getUserRole();
  }, []);

  // Fetch application statistics for all jobs
  useEffect(() => {
    const fetchApplicationStats = async () => {
      if (!job || job.length === 0) return;

      try {
        const jobIds = job.map((j) => j.id);
        const { data: applications, error } = await supabase
          .from("applied")
          .select("id_job_postings, status")
          .in("id_job_postings", jobIds);

        if (error) throw error;

        const stats: Record<string, ApplicationStats> = {};
        jobIds.forEach((id) => {
          stats[id] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
        });

        applications?.forEach((app) => {
          const jobId = app.id_job_postings.toString();
          const status = app.status || "pending";

          if (!stats[jobId]) {
            stats[jobId] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
          }

          stats[jobId].total += 1;

          if (status.toLowerCase() === "pending") {
            stats[jobId].pending += 1;
          } else if (status.toLowerCase() === "accepted") {
            stats[jobId].accepted += 1;
          } else if (status.toLowerCase() === "rejected") {
            stats[jobId].rejected += 1;
          }
        });

        setApplicationStats(stats);
      } catch (error) {
        console.error("Error fetching application statistics:", error);
      }
    };

    fetchApplicationStats();
  }, [job]);

  useEffect(() => {
    if (job) {
      let filtered = [...job];

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.role?.toLowerCase().includes(searchLower) ||
            item.company_name?.toLowerCase().includes(searchLower) ||
            (item.skills &&
              item.skills.some((skill: string) =>
                skill.toLowerCase().includes(searchLower)
              ))
        );
      }

      if (filters.jobType) {
        filtered = filtered.filter((item) => item.job_type === filters.jobType);
      }

      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }

      if (filters.categories.length > 0) {
        filtered = filtered.filter((item) =>
          item.categories.some((category: string) =>
            filters.categories.includes(category)
          )
        );
      }

      if (filters.capacityNeeded > 0) {
        filtered = filtered.filter(
          (item) => item.capacity_needed >= filters.capacityNeeded
        );
      }

      const transformedRows = filtered.map((item: JobPosting) => ({
        ...item,
        id: item.id,
        userRole: userRole.role,
        applicationStats: applicationStats[item.id] || {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
        },
      }));

      setFilteredJobs(transformedRows);
    }
  }, [job, filters, userRole.role, applicationStats]);

  if (error) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        {t("JobTable.errors.loadingJobs", { error: error.message })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("JobTable.filters.title")}
            </span>
          </button>
          {filters.searchTerm && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredJobs.length} {t("JobTable.filters.results")}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("JobTable.filters.searchPlaceholder")}
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <JobFilter
        onFilterChange={setFilters}
        filters={filters}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <DataGridDemo
          rows={filteredJobs}
          columns={columns}
          loading={isLoading}
          initialState={{
            sorting: {
              sortModel: [{ field: "created_at", sort: "desc" }],
            },
          }}
        />
      </div>
    </div>
  );
};

// ViewButton component updated to use client-side navigation
interface ViewButtonProps {
  params: any;
}

const ViewButton: FC<ViewButtonProps> = ({ params }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleView = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/${locale}/jobs/socialMediaAssistance?id=${params.row.id}`);
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
        <>
          <Eye className="h-4 w-4" />
          <span>{t("JobTable.actions.view")}</span>
        </>
      )}
    </button>
  );
};

// MoreIcon component with translations
interface MoreIconProps {
  id: string;
  userRole: string;
}

const MoreIcon: FC<MoreIconProps> = ({ id, userRole }) => {
  const t = useTranslations();
  const canDelete = userRole !== "user";

  if (!canDelete) {
    return null;
  }

  return (
    <div className="p-1 flex flex-col gap-2">
      <div className="text-xs cursor-pointer py-0.5 px-2 rounded-[2px] text-red-600">
        <DeleteModalJob
          id={id}
          tableName="job_postings"
          itemName={t("JobTable.items.jobPosting")}
        />
      </div>
    </div>
  );
};

export default JobTable;
