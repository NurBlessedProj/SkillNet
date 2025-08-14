// MyTable.tsx
import { FC, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import CustomLoader from "./loader";

interface TableProps {
  columns: any;
  data: any;
  expanded?: boolean;
  pagination?: boolean;
  ExpandableComponent: FC<any> | null;
  size?: "small" | "medium" | "large";
  onRowClick?: (row: any) => void;
}

const MyTable: FC<TableProps> = ({
  columns,
  data,
  expanded,
  pagination,
  ExpandableComponent,
  size = "medium",
  onRowClick,
}) => {
  const customStyles = {
    table: {
      style: {
        backgroundColor: "white",
        borderRadius: "0.5rem",
      },
    },
    headCells: {
      style: {
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "#1f2937",
        borderBottom: "1px solid #e5e7eb",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        minHeight:
          size === "small" ? "40px" : size === "large" ? "56px" : "48px",
      },
    },
    rows: {
      style: {
        minHeight:
          size === "small" ? "40px" : size === "large" ? "56px" : "48px",
        fontSize: "0.875rem",
        color: "#374151",
        borderBottom: "1px solid #f3f4f6",
        "&:hover": {
          backgroundColor: "#f0fdf4",
          cursor: onRowClick ? "pointer" : "default",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "1rem",
        paddingRight: "1rem",
        borderRight: "1px solid #f3f4f6",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #e5e7eb",
        color: "#6b7280",
        backgroundColor: "#f9fafb",
      },
      pageButtonsStyle: {
        borderRadius: "0.375rem",
        height: "2rem",
        width: "2rem",
        padding: "0",
        margin: "0 0.25rem",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:disabled": {
          cursor: "not-allowed",
          opacity: "0.5",
        },
        "&:hover:not(:disabled)": {
          backgroundColor: "#f3f4f6",
        },
      },
    },
    selectableRows: {
      style: {
        width: "1rem",
        height: "1rem",
        borderRadius: "0.25rem",
        border: "2px solid #d1d5db",
        "&:checked": {
          backgroundColor: "#10b981",
          borderColor: "#10b981",
        },
      },
    },
  };

  const [pending, setPending] = useState<boolean>(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPending(false);
    }, 1000); // Reduced from 2000ms to 1000ms for better UX
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <style jsx global>{`
        .rdt_Table {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
        }
        .rdt_TableHead {
          background-color: #f9fafb !important;
        }
        .rdt_TableHeadRow {
          border-bottom: 1px solid #e5e7eb !important;
        }
        .rdt_TableHeadCell {
          border-bottom: 1px solid #e5e7eb !important;
          color: #1f2937 !important;
        }
        .rdt_TableRow {
          border-bottom: 1px solid #f3f4f6 !important;
          color: #374151 !important;
        }
        .rdt_TableCell {
          border-right: 1px solid #f3f4f6 !important;
        }
        .rdt_TableRow:hover {
          background-color: #f0fdf4 !important;
        }
        .rdt_Pagination {
          border-top: 1px solid #e5e7eb !important;
          background-color: #f9fafb !important;
          color: #6b7280 !important;
        }
        .dark .rdt_Table {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        .dark .rdt_TableHead {
          background-color: #374151 !important;
        }
        .dark .rdt_TableHeadRow {
          border-bottom: 1px solid #4b5563 !important;
        }
        .dark .rdt_TableHeadCell {
          border-bottom: 1px solid #4b5563 !important;
          color: #d1d5db !important;
        }
        .dark .rdt_TableRow {
          border-bottom: 1px solid #374151 !important;
          color: #d1d5db !important;
          background-color: #1f2937 !important;
        }
        .dark .rdt_TableCell {
          border-right: 1px solid #374151 !important;
        }
        .dark .rdt_TableRow:hover {
          background-color: #374151 !important;
        }
        .dark .rdt_Pagination {
          border-top: 1px solid #4b5563 !important;
          background-color: #374151 !important;
          color: #d1d5db !important;
        }
        .dark .rdt_Pagination button {
          color: #d1d5db !important;
        }
        .dark .rdt_Pagination button:hover:not(:disabled) {
          background-color: #4b5563 !important;
        }
        .rdt_TableRow input[type="checkbox"] {
          border: 2px solid #d1d5db !important;
          border-radius: 0.25rem !important;
          background-color: white !important;
          color: #10b981 !important;
        }
        .rdt_TableRow input[type="checkbox"]:checked {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .rdt_TableRow input[type="checkbox"]:focus {
          outline: 2px solid #10b981 !important;
          outline-offset: 2px !important;
        }
        .dark .rdt_TableRow input[type="checkbox"] {
          border: 2px solid #6b7280 !important;
          background-color: #374151 !important;
          color: #10b981 !important;
        }
        .dark .rdt_TableRow input[type="checkbox"]:checked {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .dark .rdt_TableRow input[type="checkbox"]:focus {
          outline: 2px solid #10b981 !important;
          outline-offset: 2px !important;
        }
      `}</style>
      <DataTable
        customStyles={customStyles}
        columns={columns}
        data={data}
        selectableRows
        pagination={pagination !== false}
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 20, 30, 50]}
        expandableRows={!expanded}
        expandableRowsComponent={ExpandableComponent || (() => null)}
        progressPending={pending}
        progressComponent={<CustomLoader />}
        onRowClicked={onRowClick}
        noDataComponent={
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No records to display
          </div>
        }
      />
    </div>
  );
};

export default MyTable;
