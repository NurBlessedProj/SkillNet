"use client";
import React, { FC, ReactNode } from "react";
import Candidate from "./page";
import { AuthUser } from "@/app/apis/auth/islogin";
import DashboardLayout from "../layout/index";

interface Props {
  children: ReactNode;
}

const RecruiterLayout: FC<Props> = ({ children }) => {
  AuthUser();
  return (
    <div>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};
export default RecruiterLayout;
