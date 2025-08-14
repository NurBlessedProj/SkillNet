"use client";
import React, { FC, ReactNode } from "react";
import Candidate from "./page";
import DashboardLayout from "../layout/index";

interface Props {
  children: ReactNode;
}

const viewJobs: FC<Props> = ({ children }) => {
  return (
    <div>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};
export default viewJobs;
