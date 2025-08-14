"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DataGridDemo from "@/components/muitable";
import { Loader2, Plus, Mail, Edit, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import moment from "moment";
import { getUserRole } from "@/app/apis/job/getJobs";
import ModalDelete from "../jobs/components/modalDelete";
import AddExaminerSlider from "./components/AddExaminerSlider";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Examiner {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  created_at: string;
  last_login: string | null;
  disciplines?: string[];
  subcategories?: string[];
  assignedTests: number;
  completedReviews: number;
}

const ExaminersPage = () => {
  const t = useTranslations("Examiners");
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>();
  const [selectedExaminer, setSelectedExaminer] = useState<Examiner | null>(
    null
  );
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sliderMode, setSliderMode] = useState<"add" | "edit">("add");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const getUser = async () => {
    const { role } = await getUserRole();
    setRole(role);
  };

  const fetchAllExaminers = async () => {
    setLoading(true);
    try {
      // First, check if the examiner_stats view exists
      const { data: viewCheck, error: viewCheckError } = await supabase
        .from("information_schema.views")
        .select("table_name")
        .eq("table_name", "examiner_stats")
        .eq("table_schema", "public");

      if (viewCheckError) {
        console.error("Error checking for view:", viewCheckError);
      }

      // If the view doesn't exist, create it
      if (!viewCheck || viewCheck.length === 0) {
        console.log("Examiner stats view doesn't exist, creating it...");
        await createExaminerStatsView();
      }

      // Fetch examiners with their statistics from the examiner_stats view
      const { data: statsData, error: statsError } = await supabase
        .from("examiner_stats")
        .select("*");

      if (statsError) {
        console.error("Error fetching stats:", statsError);
        throw statsError;
      }

      console.log("Stats data:", statsData);

      // For each examiner, fetch their disciplines and subcategories
      const { data: examinersData, error: examinersError } = await supabase
        .from("examiners")
        .select(
          "id, name, email, status, created_at, last_login, disciplines, subcategories"
        );

      if (examinersError) throw examinersError;

      // Combine the data from both queries
      const combinedData = examinersData.map((examiner) => {
        const stats = statsData.find(
          (stat) => stat.examiner_id === examiner.id
        ) || {
          total_assigned_tests: 0,
          completed_reviews: 0,
        };

        return {
          id: examiner.id,
          name: examiner.name,
          email: examiner.email,
          status: examiner.status,
          created_at: examiner.created_at,
          last_login: examiner.last_login,
          disciplines: examiner.disciplines || [],
          subcategories: examiner.subcategories || [],
          assignedTests: stats.total_assigned_tests || 0,
          completedReviews: stats.completed_reviews || 0,
        };
      });

      setExaminers(combinedData);
    } catch (error) {
      console.error("Error fetching examiners:", error);
      // If the examiner_stats view doesn't exist yet, fall back to just fetching examiners
      try {
        const { data, error } = await supabase.from("examiners").select("*");

        if (error) throw error;

        // Map the data to include zeros for the stats that might not exist yet
        const mappedData = data.map((examiner) => ({
          ...examiner,
          assignedTests: 0,
          completedReviews: 0,
        }));

        setExaminers(mappedData);
      } catch (fallbackError) {
        console.error("Error in fallback examiner fetch:", fallbackError);
        setExaminers([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to create the examiner_stats view
  const createExaminerStatsView = async () => {
    try {
      // We'll use a raw SQL query to create the view
      const viewSQL = `
        CREATE OR REPLACE VIEW public.examiner_stats AS
        SELECT 
            e.id AS examiner_id,
            e.name AS examiner_name,
            e.email AS examiner_email,
            COUNT(DISTINCT ra.test_id) AS total_assigned_tests,
            COUNT(DISTINCT CASE WHEN ra.status = 'completed' THEN ra.test_id END) AS completed_reviews
        FROM 
            examiners e
        LEFT JOIN 
            review_assignments ra ON e.id = ra.examiner_id
        GROUP BY 
            e.id, e.name, e.email;
      `;

      // Execute the SQL query
      const { error } = await supabase.rpc("execute_sql", { sql: viewSQL });

      if (error) {
        console.error("Error creating examiner_stats view:", error);
        // If the RPC method doesn't exist, we'll need to handle this differently
        // This would typically be done through a server-side API

        // For now, just log that this needs to be done manually
        console.log(
          "Please create the examiner_stats view manually using the SQL provided"
        );
      } else {
        console.log("Successfully created examiner_stats view");
      }
    } catch (error) {
      console.error("Error in createExaminerStatsView:", error);
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    // Increment the refresh trigger to cause a re-fetch
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDelete = async (id: string, email: string) => {
    try {
      // First, get the user_id from the examiners table
      const { data: examinerData, error: examinerError } = await supabase
        .from("examiners")
        .select("user_id")
        .eq("id", id)
        .single();

      if (examinerError) throw examinerError;

      // Delete from examiners table
      const { error: deleteExaminerError } = await supabase
        .from("examiners")
        .delete()
        .eq("id", id);

      if (deleteExaminerError) throw deleteExaminerError;

      // Update profile to inactive
      if (examinerData?.user_id) {
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({ active: false })
          .eq("id", examinerData.user_id);

        if (updateProfileError) throw updateProfileError;
      }

      // Remove the deleted item from the state
      setExaminers(examiners.filter((examiner) => examiner.id !== id));
      toast.success(t("deleteSuccess"));
    } catch (error) {
      console.error("Error during deletion:", error);
      // toast.error(t("deleteError"));
    }
  };

  const handleOpenAddSlider = () => {
    setSliderMode("add");
    setSelectedExaminer(null);
    setIsSliderOpen(true);
  };

  const handleOpenEditSlider = (examiner: Examiner) => {
    setSliderMode("edit");
    setSelectedExaminer(examiner);
    setIsSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false);
    setSelectedExaminer(null);
  };

  const handleExaminerSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleCloseSlider();
  };

  const handleSendInvite = async (email: string, name: string) => {
    try {
      // Get examiner details to include in the invitation
      const { data: examiner, error: examinerError } = await supabase
        .from("examiners")
        .select("disciplines, subcategories")
        .eq("email", email)
        .single();

      if (examinerError) throw examinerError;

      // Send invitation email
      await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: "examiner",
          name,
          disciplines: examiner.disciplines || [],
          subcategories: examiner.subcategories || [],
        }),
      });

      toast.success(t("inviteSent", { email }));
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast.error(t("inviteError"));
    }
  };

  useEffect(() => {
    fetchAllExaminers();
    getUser();
  }, [refreshTrigger]);

  const columns = [
    {
      field: "name",
      headerName: t("table.examiner"),
      width: 200,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div className="flex items-center gap-3">
       
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {params.row.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {params.row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      field: "status",
      headerName: t("table.status"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div>
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              params.row.status === "active"
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            }`}
          >
            {params.row.status === "active"
              ? t("status.active")
              : t("status.inactive")}
          </span>
        </div>
      ),
    },
    {
      field: "assignedTests",
      headerName: t("table.assignedTests"),
      width: 150,
      flex: 1,
      sortable: true,
    },
    {
      field: "completedReviews",
      headerName: t("table.completedReviews"),
      width: 150,
      flex: 1,
      sortable: true,
    },
    // {
    //   field: "last_login",
    //   headerName: t("table.lastActive"),
    //   width: 150,
    //   flex: 1,
    //   sortable: true,
    //   renderCell: (params: any) => (
    //     <div>
    //       {params.row.last_login
    //         ? moment(params.row.last_login).fromNow()
    //         : t("table.neverLoggedIn")}
    //     </div>
    //   ),
    // },
    {
      field: "created_at",
      headerName: t("table.dateAdded"),
      width: 150,
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
      headerName: t("table.actions"),
      width: 180,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
        <div className="flex gap-2">
          {/* <InviteButton
          //   email={params.row.email}
          //   name={params.row.name}
          //   onSendInvite={handleSendInvite}
          // /> */}
          <EditButton examiner={params.row} onEdit={handleOpenEditSlider} />
          <DeleteButton
            id={params.row.id}
            email={params.row.email}
            handleDelete={handleDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["s_admin"]}>
      <div>
        <div className="flex justify-between items-center mb-6 p-3">
          <p className="text-gray-600">{t("description")}</p>
          <div className="flex gap-3">
            <button
              className="text-gray-600 px-4 space-x-2 flex items-center py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              onClick={handleRefreshStats}
              disabled={refreshing}
            >
              <RefreshCw
                size={18}
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>
                {refreshing
                  ? t("buttons.refreshing")
                  : t("buttons.refreshStats")}
              </span>
            </button>
            <button
              className="text-white px-4 space-x-2 flex items-center py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              onClick={handleOpenAddSlider}
            >
              <Plus size={18} className="mr-2" />
              <span>{t("buttons.addExaminer")}</span>
            </button>
          </div>
        </div>

        {/* Table container with overflow properties */}
        <div className="mt-6 overflow-x-auto max-w-full">
          <div className="min-w-[1000px]">
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
              rows={examiners}
              columns={columns}
              loading={loading}
            />
          </div>
        </div>

        {/* Add/Edit Examiner Slider */}
        <AddExaminerSlider
          isOpen={isSliderOpen}
          onClose={handleCloseSlider}
          mode={sliderMode}
          examiner={selectedExaminer}
          onSave={handleExaminerSaved}
        />
      </div>
    </ProtectedRoute>
  );
};

// InviteButton Component
const InviteButton = ({
  email,
  name,
  onSendInvite,
}: {
  email: string;
  name: string;
  onSendInvite: (email: string, name: string) => void;
}) => {
  const t = useTranslations("Examiners");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    setIsLoading(true);
    try {
      await onSendInvite(email, name);
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="px-2 mt-2 h-7 bg-white border-blue-500 border text-blue-500 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      onClick={handleInvite}
      disabled={isLoading}
      title={t("buttons.sendInvite")}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
    </button>
  );
};

// EditButton Component
const EditButton = ({
  examiner,
  onEdit,
}: {
  examiner: Examiner;
  onEdit: (examiner: Examiner) => void;
}) => {
  const t = useTranslations("Examiners");

  return (
    <button
      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
      onClick={() => onEdit(examiner)}
      title={t("buttons.edit")}
    >
      <Edit className="h-4 w-4" />
      <span>{t("buttons.edit")}</span>
    </button>
  );
};
// DeleteButton Component
const DeleteButton = ({
  id,
  email,
  handleDelete,
}: {
  id: string;
  email: string;
  handleDelete: (id: string, email: string) => Promise<void>;
}) => {
  const t = useTranslations("Examiners");

  const handleExaminerDeleted = async () => {
    await handleDelete(id, email);
  };

  return (
    <div className="flex items-center">
      <ModalDelete
        id={id}
        email={email}
        tableName="examiners"
        itemName={t("items.examinerData")}
        onDelete={handleExaminerDeleted}
      />
    </div>
  );
};

export default ExaminersPage;
