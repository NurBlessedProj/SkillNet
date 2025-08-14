// RoleTable.tsx
"use client";
import { GetRecruiterData } from "@/app/apis/recruiter/getall";
import { Building2, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";

const RoleTable = ({
  selectedPeriod = "7days",
}: {
  selectedPeriod?: string;
}) => {
  const t = useTranslations("AdminDashboard.Dashboard");
  const { recruiterData: rawData, loading } = GetRecruiterData();
  const [data, setData] = useState<any[]>([]);

  // Sort data in descending order by count when it's loaded
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const sortedData = [...rawData]
        .sort((a, b) => b.count - a.count)
        .map((item, index) => ({
          ...item,
          id: index, // MUI DataGrid requires a unique id field
        }));
      setData(sortedData);
    }
  }, [rawData]);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: t("Tables.roleTable.profile"),
      flex: 2,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <div className="flex items-center space-x-2 sm:space-x-3 py-2 sm:py-3 pl-2">
          {params.row.logo_url ? (
            <img
              className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-gray-200"
              src={params.row.logo_url}
              alt={params.value}
            />
          ) : (
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <span className="font-medium text-gray-900 text-sm sm:text-base">
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "count",
      headerName: t("Tables.roleTable.openPositions"),
      flex: 1,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <div className="flex items-center justify-end pr-4 sm:pr-8 space-x-1 sm:space-x-2">
          <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-medium text-gray-900 text-sm sm:text-base">
            {params.value}
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
        <Building2 className="h-8 w-8 mb-2" />
        <p>{t("Tables.roleTable.noRecruiters")}</p>
      </div>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        mt: 2,
        height: "100%",
        overflowX: "auto", // Enable horizontal scrolling
        "& .MuiDataGrid-root": {
          border: "none",
          backgroundColor: "white",
          borderRadius: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          minWidth: "400px", // Ensure minimum width for mobile
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "1px solid #f3f4f6",
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "1px solid #e5e7eb",
        },
        // Mobile-specific styles
        "@media (max-width: 768px)": {
          "& .MuiDataGrid-root": {
            minWidth: "500px", // Wider minimum width on mobile
          },
          "& .MuiDataGrid-cell": {
            padding: "8px 4px", // Reduce padding on mobile
          },
          "& .MuiDataGrid-columnHeaders": {
            padding: "8px 4px", // Reduce padding on mobile
          },
        },
      }}
    >
      <DataGrid
        rows={data}
        columns={columns}
        autoHeight
        rowHeight={50}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
          sorting: {
            sortModel: [{ field: "count", sort: "desc" }],
          },
        }}
        pageSizeOptions={[5]}
        disableRowSelectionOnClick
        disableColumnMenu
        hideFooterSelectedRowCount
        sx={{
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f9fafb",
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none", // Remove the focus outline
          },
          "& .MuiDataGrid-cell:focus-within": {
            outline: "none", // Remove the focus outline
          },
        }}
      />
    </Box>
  );
};

export default RoleTable;
