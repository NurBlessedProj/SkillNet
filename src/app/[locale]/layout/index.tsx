"use client";
import { Inter } from "next/font/google";
import Navbar from "./navbar";
import { use, useContext } from "react";
import { ContextData } from "@/components/context";
import SidebarsExpenses from "./sidebar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = useContext(ContextData);
  const pathname = usePathname();

  // Check if the current path includes QuizQuetions (with the correct spelling)
  const isQuizQuestionsPage = pathname.includes("/QuizQuetions");
  const isJobsPage = pathname.includes("/jobs");
  const isCandidatesPage = pathname.includes("/candidates");
  const isExaminersPage = pathname.includes("/examiners");
  const isExaminersCheckPage = pathname.includes("/evaluation_check");

  // For debugging
  console.log("Current pathname:", pathname);
  console.log("Is Quiz Questions page:", isQuizQuestionsPage);

  return (
    <div className="relative flex flex-col w-full h-screen">
      {/* Navbar should cover full width */}
      <div className="w-full">
        <Navbar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar fixed on the left - hidden on mobile */}
        <div
          className={`hidden md:block fixed z-50 transition-all duration-300 ease-in-out ${
            context?.toggle ? "w-[65px]" : "w-[200px]"
          }`}
        >
          <SidebarsExpenses />
        </div>

        {/* Mobile sidebar */}
        <div className="md:hidden fixed z-50">
          <SidebarsExpenses />
        </div>

        {/* Content area */}
        <div
          className={`transition-all duration-300 ease-in-out w-full overflow-y-hidden ${
            context?.toggle
              ? isQuizQuestionsPage ||
                isJobsPage ||
                isCandidatesPage ||
                isExaminersPage ||
                isExaminersCheckPage
                ? "md:ml-[60px]"
                : "md:ml-0"
              : "md:ml-[200px]"
          }`}
        >
          <div className="h-screen w-full">
            {/* Increased top margin to account for navbar */}
            <div className={`h-[calc(100vh-80px)] mt-16 pr-0`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
