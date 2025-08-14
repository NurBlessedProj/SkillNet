import React from "react";
import CandidateTable from "./components/table";
import ProtectedRoute from "@/components/ProtectedRoute";

const Candidate = () => {
  return (
    <ProtectedRoute allowedRoles={["admin", "s_admin"]}>
      <div className="px-4 bg-gray-50 dark:bg-gray-900 h-screen overflow-hidden pb-20 pt-5">
        <div className="h-full">
          <CandidateTable />
        </div>
      </div>
    </ProtectedRoute>
  );
};
export default Candidate;
