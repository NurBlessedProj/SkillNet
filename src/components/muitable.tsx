import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { JobPosting } from "@/app/apis/job/getJobs";

type DataGridDemoProps = {
  rows: any;
  columns: GridColDef[];
  loading: boolean;
  initialState?: any | null;
};

const DataGridDemo: React.FC<DataGridDemoProps> = ({
  rows,
  columns,
  loading,
  initialState,
}) => {
  return (
    <div className="w-full h-full">
      <style jsx global>{`
        .MuiDataGrid-root {
          border: none !important;
          border-radius: 0.75rem !important;
          background-color: transparent !important;
          font-family: "Outfit", sans-serif !important;
        }

        .MuiDataGrid-cell {
          white-space: normal !important;
          padding: 16px !important;
          align-items: center !important;
          border-color: #e5e7eb !important;
          border-bottom: 1px solid #f3f4f6 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          min-height: 64px !important;
          display: flex !important;
          align-items: center !important;
        }

        .MuiDataGrid-virtualScroller {
          overflow-y: auto !important;
          background-color: white !important;
          border-radius: 0.75rem !important;
        }

        .MuiDataGrid-row {
          min-height: 64px !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }

        .MuiDataGrid-row:hover {
          background-color: #f0fdf4 !important;
          transition: background-color 0.2s ease !important;
        }

        .MuiDataGrid-row.Mui-selected {
          background-color: #ecfdf5 !important;
        }

        .MuiDataGrid-row.Mui-selected:hover {
          background-color: #d1fae5 !important;
        }

        .MuiDataGrid-columnHeader {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
          border-color: #e5e7eb !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding: 16px !important;
          min-height: 56px !important;
          display: flex !important;
          align-items: center !important;
        }

        .MuiDataGrid-columnHeaderTitle {
          font-weight: 600 !important;
          color: #374151 !important;
          font-size: 14px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .MuiDataGrid-footerContainer {
          border-color: #e5e7eb !important;
          background-color: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
        }

        .MuiDataGrid-footerContainer .MuiTablePagination-root {
          color: #374151 !important;
        }

        .MuiDataGrid-checkboxInput {
          color: #10b981 !important;
        }

        .MuiDataGrid-checkboxInput.Mui-checked {
          color: #10b981 !important;
        }

        .MuiDataGrid-checkboxInput.MuiCheckbox-root {
          color: #10b981 !important;
        }

        /* Dark mode styles */
        .dark .MuiDataGrid-root {
          border: none !important;
          background-color: transparent !important;
        }

        .dark .MuiDataGrid-cell {
          border-color: #374151 !important;
          color: #d1d5db !important;
          background-color: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
        }

        .dark .MuiDataGrid-row:hover {
          background-color: #374151 !important;
        }

        .dark .MuiDataGrid-row.Mui-selected {
          background-color: #065f46 !important;
        }

        .dark .MuiDataGrid-row.Mui-selected:hover {
          background-color: #047857 !important;
        }

        .dark .MuiDataGrid-columnHeader {
          background-color: #374151 !important;
          border-color: #4b5563 !important;
          border-bottom: 2px solid #4b5563 !important;
        }

        .dark .MuiDataGrid-columnHeaderTitle {
          color: #d1d5db !important;
        }

        .dark .MuiDataGrid-footerContainer {
          border-color: #4b5563 !important;
          background-color: #374151 !important;
          border-top: 1px solid #4b5563 !important;
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

        .dark .MuiDataGrid-checkboxInput {
          color: #10b981 !important;
        }

        .dark .MuiDataGrid-checkboxInput.Mui-checked {
          color: #10b981 !important;
        }

        .dark .MuiDataGrid-checkboxInput.MuiCheckbox-root {
          color: #10b981 !important;
        }

        /* Custom scrollbar for the table */
        .MuiDataGrid-virtualScroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .MuiDataGrid-virtualScroller::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }

        .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        .dark .MuiDataGrid-virtualScroller::-webkit-scrollbar-track {
          background: #374151;
        }

        .dark .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb {
          background: #10b981;
        }

        .dark .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationMode="client"
        slotProps={{
          loadingOverlay: {
            variant: "linear-progress",
            noRowsVariant: "skeleton",
          },
        }}
        checkboxSelection
        disableRowSelectionOnClick
        initialState={
          initialState || {
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            sorting: {
              sortModel: [{ field: "created_at", sort: "desc" }],
            },
          }
        }
        sx={{
          height: "100%",
          width: "100%",
          "& .MuiDataGrid-root": {
            width: "100%",
          },
          "& .MuiDataGrid-columnHeaders": {
            display: "flex",
          },
          "& .MuiDataGrid-virtualScroller": {
            overflow: "auto",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            whiteSpace: "normal",
          },
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          },
          "& .MuiDataGrid-columnHeader": {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          },
        }}
      />
    </div>
  );
};

export default DataGridDemo;
