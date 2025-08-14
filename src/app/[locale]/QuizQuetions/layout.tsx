"use client";
import React, { FC, ReactNode } from "react";
import DashboardLayout from "../layout/index";
import { AuthUser } from "@/app/apis/auth/islogin";

interface Props {
  children: ReactNode;
}

const QuizLayout: FC<Props> = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};
export default QuizLayout;
