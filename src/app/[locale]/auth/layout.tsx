"use client";
import React, { FC, ReactNode } from "react";
import AuthPage from "./page";

interface Props {
  children: ReactNode;
}

const AuthLayout: FC<Props> = ({ children }) => {
  return <div className="w-full h-screen ">{children}</div>;
};
export default AuthLayout;
