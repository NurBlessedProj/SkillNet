"use client";

import MyTable from "@/components/table";
import Link from "next/link";
import { GetJobsUser } from "@/app/apis/job/getjobUser";

// import DeliveredDataUI from "../../dashboard/delivered/components/dataUIexpandable";
// import NewOrderDataUI from "./components/dataUiexpandable";

const columns = [
  {
    name: "Role",
    selector: (row: any) => (
      <div className="font-medium text-gray-900 dark:text-white">
        {row.role}
      </div>
    ),
  },
  {
    name: "Status",
    selector: (row: { status: any }) => (
      <div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "live"
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
          }`}
        >
          {row.status}
        </span>
      </div>
    ),
  },
  {
    name: "Date Posted",
    selector: (row: { created_at: any }) => (
      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {row.created_at}
      </div>
    ),
  },
  {
    name: "Due Date",
    selector: (row: { end_date: any }) => (
      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {row.end_date}
      </div>
    ),
  },
  {
    name: "Job Type",
    selector: (row: { job_type: any }) => (
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
          {row.job_type}
        </span>
      </div>
    ),
  },
  {
    name: "Applicants",
    selector: (row: { capacity: any }) => (
      <div className="text-gray-900 dark:text-white font-medium">
        {row.capacity}
      </div>
    ),
  },
  {
    name: "Needs",
    selector: (row: { capacity_needed: any }) => (
      <div className="text-gray-900 dark:text-white font-medium">
        {row.capacity_needed}
      </div>
    ),
  },
  {
    name: "",
    selector: (row: any) => (
      <div className="flex justify-end">
        <Link href={`/jobs/socialMediaAssistance?${row.id}`}>
          <button className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
            <i className="ri-more-line text-xl"></i>
          </button>
        </Link>
      </div>
    ),
  },
];

// const data = [
//     {
//         role: 'Social Media Assistance',
//         status: 'live',
//         created_at: '15 August 2015',
//         due_date: '24 May 2020',
//         job_type: "Full Time",
//         applicants: "204",
//         needs: "4/11",

//     },
// ]

const JobTableUser = () => {
  const data = GetJobsUser().job;
  return (
    <>
      <div className="mt-8">
        <MyTable
          columns={columns}
          data={data}
          expanded
          pagination={data.length > 9 ? true : false}
          ExpandableComponent={() => <></>}
        />
      </div>
    </>
  );
};
export default JobTableUser;
