"use client";

import { FC, useState, useEffect } from "react";
import DataGridDemo from "@/components/muitable";
import moment from "moment";
import { GridColDef } from "@mui/x-data-grid";
import { GetJobs, JobPosting } from "@/app/apis/job/getJobs";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { Loader2 } from "lucide-react";
import JobFilter, {
  initialJobFilterState,
  JobFilterOptions,
} from "@/components/JobFilter";
import DeleteModalJob from "./modalDeleteJob";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation"; // Import router
import { useLocale } from "next-intl"; // Import useLocale

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
  const t = useTranslations(); // Initialize the translation hook
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
    },
    {
      field: "created_at",
      headerName: t("JobTable.columns.datePosted"),
      width: 120,
      minWidth: 100,
      flex: 1,
      renderCell: (params) => (
        <div className="flex space-x-2">
          {moment(params.row.created_at).format("MMMM D, YYYY")}
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
        <div className="flex space-x-2">
          {moment(params.row.end_date).format("MMMM D, YYYY")}
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
          <button className="px-4 rounded-full h-7 border border-green-500 text-green-500 mt-4">
            <p className="-mt-3">{params.row.job_type}</p>
          </button>
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
        // Determine if job is active or inactive
        const isActive = params.row.status?.toLowerCase() === "active";
        const borderColor = isActive ? "border-green-500" : "border-red-500";
        const textColor = isActive ? "text-green-500" : "text-red-500";

        return (
          <div className="flex space-x-2">
            <button
              className={`px-4 rounded-full h-7 border ${borderColor} ${textColor} mt-4`}
            >
              <p className="-mt-3">{params.row.status}</p>
            </button>
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
            <div className="text-sm font-medium">
              {stats.total} {t("JobTable.applications.total")}
            </div>
            <div className="text-xs text-gray-500">
              <span className="text-yellow-600">
                {stats.pending} {t("JobTable.applications.pending")}
              </span>{" "}
              •
              <span className="text-green-600 ml-1">
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
        <div className="flex items-center">
          <div className="mr-2">{params.row.capacity}</div>
          <div className="w-full max-w-[60px] bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                params.row.capacity >= params.row.capacity_needed
                  ? "bg-red-500"
                  : "bg-blue-600"
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
        // Get all job IDs
        const jobIds = job.map((j) => j.id);

        // Fetch applications for these jobs
        const { data: applications, error } = await supabase
          .from("applied")
          .select("id_job_postings, status")
          .in("id_job_postings", jobIds);

        if (error) throw error;

        // Process the data to get statistics by job ID
        const stats: Record<string, ApplicationStats> = {};

        // Initialize stats for all jobs
        jobIds.forEach((id) => {
          stats[id] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
        });

        // Count applications by status
        applications?.forEach((app) => {
          const jobId = app.id_job_postings.toString();
          const status = app.status || "pending"; // Default to pending if status is null

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

      // Apply search filter
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

      // Apply job type filter
      if (filters.jobType) {
        filtered = filtered.filter((item) => item.job_type === filters.jobType);
      }

      // Apply status filter
      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }

      // Apply categories filter
      if (filters.categories.length > 0) {
        filtered = filtered.filter((item) =>
          item.categories.some((category: string) =>
            filters.categories.includes(category)
          )
        );
      }

      // Apply capacity needed filter
      if (filters.capacityNeeded > 0) {
        filtered = filtered.filter(
          (item) => item.capacity_needed >= filters.capacityNeeded
        );
      }

      // Transform the filtered data and add user role information
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
      <div className="p-4 text-red-600 bg-red-100 rounded">
        {t("JobTable.errors.loadingJobs", { error: error.message })}
      </div>
    );
  }

  return (
    <div className="" style={{ width: "100%" }}>
      <JobFilter
        onFilterChange={setFilters}
        filters={filters}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
      />
      <div className="mt-4">
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
  const router = useRouter(); // Use Next.js router
  const locale = useLocale(); // Get current locale

  const handleView = async () => {
    setIsLoading(true);
    try {
      // Simulate a slight delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Use client-side navigation with the current locale
      router.push(`/${locale}/jobs/socialMediaAssistance?id=${params.row.id}`);
    } catch (error) {
      console.error("Error navigating to details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="px-2 mt-2 h-7 bg-white border-green-500 border text-green-500 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      onClick={handleView}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <p className="-mt-0.5">{t("JobTable.actions.view")}</p>
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
  // Only show delete option for s_admin or if admin owns the job
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
