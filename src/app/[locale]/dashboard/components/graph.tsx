"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { GetProfileCount } from "@/app/apis/profile/countData";
import { GetJobCountLast7Days } from "@/app/apis/job/countJob";
import { Calendar, UserPlus, Users, Briefcase } from "lucide-react";
import Loader from "@/components/spinnerLoade";
import { useTranslations, useLocale } from "next-intl";
// Import the translation hook

// Dynamically import ApexCharts for client-side rendering
const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const Chart = () => {
  const t = useTranslations("AdminDashboard");
  // Initialize the translation hook
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const { adminCount, userCount, adminDailyData, userDailyData } =
    GetProfileCount(selectedPeriod) || {};
  const { jobCount, jobDailyData } = GetJobCountLast7Days(selectedPeriod) || {};

  // Show loading state while data is being fetched
  if (!adminDailyData || !userDailyData || !jobDailyData) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const chartData = [
    {
      name: t("Dashboard.chart.newRecruiters"),
      data: adminDailyData,
      color: "#10b981", // emerald-500
      icon: UserPlus,
    },
    {
      name: t("Dashboard.chart.newCandidates"),
      data: userDailyData,
      color: "#3b82f6", // blue-500
      icon: Users,
    },
    {
      name: t("Dashboard.chart.openPositions"),
      data: jobDailyData,
      color: "#8b5cf6", // purple-500
      icon: Briefcase,
    },
  ];

  // Generate dates based on selected period
  const getDates = () => {
    const dates = [];
    const daysToShow =
      {
        "7days": 7,
        "30days": 30,
        "90days": 90,
      }[selectedPeriod] || 7;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    }
    return dates;
  };

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    colors: chartData.map((item) => item.color),
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: getDates(),
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
        rotate: selectedPeriod === "90days" ? -45 : 0,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
        formatter: (value) => Math.round(value).toString(),
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (value) =>
          `${Math.round(value)} ${t("Dashboard.chart.items")}`,
      },
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const value = series[seriesIndex][dataPointIndex];
        const name = w.globals.seriesNames[seriesIndex];
        const color = w.globals.colors[seriesIndex];

        return `
           <div class="bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
             <div class="flex items-center gap-2 mb-1">
               <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
               <span class="text-white font-medium text-sm">${name}</span>
             </div>
             <div class="text-emerald-400 font-bold text-lg">${Math.round(
               value
             )} ${t("Dashboard.chart.items")}</div>
           </div>
         `;
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      markers: {
        size: 12,
      },
    },
  };

  const series = chartData.map((item) => ({
    name: item.name,
    data: item.data,
  }));

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value);
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case "30days":
        return t("Dashboard.chart.last30Days");
      case "90days":
        return t("Dashboard.chart.last90Days");
      default:
        return t("Dashboard.chart.last7Days");
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          <span className="text-xs sm:text-sm text-gray-500">
            {getPeriodText()}
          </span>
        </div>
        <select
          className="px-2 sm:px-3 py-1.5 sm:py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          value={selectedPeriod}
          onChange={handlePeriodChange}
        >
          <option value="7days">{t("Dashboard.chart.option7Days")}</option>
          <option value="30days">{t("Dashboard.chart.option30Days")}</option>
          <option value="90days">{t("Dashboard.chart.option90Days")}</option>
        </select>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center space-x-1 sm:space-x-2">
            <div
              className={`p-1.5 sm:p-2 rounded-lg`}
              style={{ backgroundColor: item.color }}
            >
              <item.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-xs sm:text-sm text-gray-600">
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full h-[300px] sm:h-[400px]">
        <ApexChart
          options={options}
          series={series}
          type="area"
          height="100%"
        />
      </div>
    </div>
  );
};

export default Chart;
