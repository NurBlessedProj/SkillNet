"use client";
import React from "react";
import DashboardLayout from "../layout/index";

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default function TestLayout({ children, params }: Props) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
