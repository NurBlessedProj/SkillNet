"use client";
import React, { FC, ReactNode } from "react";
import DashboardLayout from "../layout/index";
import { AuthUser } from "@/app/apis/auth/islogin";

interface Props {
  children: ReactNode;
}

const ProfileRecruiterLayout: FC<Props> = ({ children }) => {
  return (
    <div className="">
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};
export default ProfileRecruiterLayout;
