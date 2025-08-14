"use client";
import React from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "../layout/index";

export default function Layout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Examiners");

  return <DashboardLayout>{children}</DashboardLayout>;
}
