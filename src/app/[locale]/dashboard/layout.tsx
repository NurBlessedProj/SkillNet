"use client";
import React, { FC, ReactNode } from "react";
import DashboardLayout from "../layout/index";

interface Props {
  children: ReactNode;
}

const JobLayout: FC<Props> = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};
export default JobLayout;
