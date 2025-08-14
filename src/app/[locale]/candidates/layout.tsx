"use client";
import React, { FC, ReactNode } from "react";
import Candidate from "./page";
import DashboardLayout from "../layout/index";
import { AuthUser } from "@/app/apis/auth/islogin";

interface Props {
  children: ReactNode;
}

const CandidateLayout: FC<Props> = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};
export default CandidateLayout;
