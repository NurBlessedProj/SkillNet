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
}) => {
  return (
    <div className="w-full h-full">
      <style jsx global>{`
        .MuiDataGrid-root {
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          background-color: white !important;
        }
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
        .dark .MuiDataGrid-root {
          border: 1px solid #374151 !important;
          background-color: #1f2937 !important;
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
        .MuiDataGrid-checkboxInput {
          color: #10b981 !important;
        }
        .MuiDataGrid-checkboxInput.Mui-checked {
          color: #10b981 !important;
        }
        .MuiDataGrid-checkboxInput.MuiCheckbox-root {
          color: #10b981 !important;
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
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
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
        }}
      />
    </div>
  );
};

export default DataGridDemo;
