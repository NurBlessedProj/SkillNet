import React, { FC, ReactNode } from "react";
import DashboardLayout from "../layout/index";

interface Props {
  children: ReactNode;
}

const ProfileLayout: FC<Props> = ({ children }) => {
  // AuthUser();
  return (
    // <div className="mt-8 ">
    <DashboardLayout>{children}</DashboardLayout>
    // </div>
  );
};
export default ProfileLayout;
