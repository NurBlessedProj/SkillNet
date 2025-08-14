"use client";
import React, { FC, ReactNode } from "react";
import DashboardLayout from "../layout/index";

interface Props {
  children: ReactNode;
}

const ProfileJobLayout: FC<Props> = ({ children }) => {
  return (
    <div>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};
export default ProfileJobLayout;
