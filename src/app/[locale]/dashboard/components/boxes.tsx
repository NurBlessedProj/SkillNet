"use client";
import Link from "next/link";
import React from "react";
import { GetProfileCount } from "@/app/apis/profile/countData";
import { GetJobCountLast7Days } from "@/app/apis/job/countJob";
import {
  ArrowRight,
  Users,
  Briefcase,
  UserPlus,
  TrendingUp,
} from "lucide-react"; // Import icons
import { useTranslations, useLocale } from "next-intl";
// Import the translation hook

const StatCard = ({
  count,
  label,
  bgColor,
  icon: Icon,
  trend,
  trendValue,
}: {
  count: number;
  label: string;
  bgColor: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
}) => (
  <div
    className={`relative group overflow-hidden rounded-xl ${bgColor} transition-all duration-300 hover:shadow-lg hover:scale-105`}
  >
    <Link href="#" className="block p-4 sm:p-6">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="p-2 sm:p-3 rounded-lg bg-white/10 backdrop-blur-sm">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            {count.toLocaleString()}
          </h3>
          <p className="text-white/90 text-xs sm:text-sm leading-tight mb-2">
            {label}
          </p>
          {trend && trendValue && (
            <div className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1 text-xs ${
                  trend === "up" ? "text-green-200" : "text-red-200"
                }`}
              >
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3 rotate-180" />
                )}
                <span>{trendValue}</span>
              </div>
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
    {/* Enhanced decorative gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
  </div>
);

const Boxes = () => {
  const t = useTranslations("AdminDashboard");
  // Initialize the translation hook
  const { adminCount = 0, userCount = 0 } = GetProfileCount() || {};
  const { jobCount = 0 } = GetJobCountLast7Days() || {};

  const stats = [
    {
      count: adminCount,
      label: t("Dashboard.stats.newRecruiters"),
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      icon: UserPlus,
      trend: "up" as const,
      trendValue:
        adminCount > 0 ? `+${Math.floor((adminCount / 10) * 100)}%` : "+0%",
    },
    {
      count: userCount,
      label: t("Dashboard.stats.newCandidates"),
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: Users,
      trend: "up" as const,
      trendValue:
        userCount > 0 ? `+${Math.floor((userCount / 20) * 100)}%` : "+0%",
    },
    {
      count: jobCount,
      label: t("Dashboard.stats.openPositions"),
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      icon: Briefcase,
      trend: "up" as const,
      trendValue:
        jobCount > 0 ? `+${Math.floor((jobCount / 15) * 100)}%` : "+0%",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            count={stat.count}
            label={stat.label}
            bgColor={stat.bgColor}
            icon={stat.icon}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>
    </div>
  );
};

export default Boxes;
