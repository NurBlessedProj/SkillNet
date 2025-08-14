'use client'
import React, { FC } from "react";
import ProgressBar from "@ramonak/react-progress-bar";
import moment from "moment";
// Define the prop interface
interface Data {
    job: any;  // Type for the job data (you can specify a more detailed type based on the structure of your job data)
}

const Right: FC<Data> = ({ job }) => {
    // Log the job data to see if it's passed correctly
    console.log(job);
    return (
        <div className="w-full mt-5 px-4">
            <h3 className="text-xl font-medium">About This Role</h3>
            <div className="mt-5 py-4 px-4 bg-[#F8F8FD] rounded">
                <div className="">
                    <p><span className="font-semibold">{job.capacity} Applied</span> of {job.capacity_needed} Capacity</p>
                </div>
                <div className="w-full mt-3">
                    <ProgressBar height="16px" bgColor="#56CDAD" completed={job.capacity_needed / job.capacity * 100} />
                </div>
            </div>
            <div className="mt-5 px-4">
                <div className="flex mt-3 justify-between">
                    <div>
                        <p className="text-gray-700">Apply Before</p>
                    </div>
                    <div className="text-end">
                        <p className="text-sm">{moment(job.end_date).format('MMMM D YYYY')}</p>
                    </div>
                </div>
                <div className="flex mt-3 justify-between">
                    <div>
                        <p className="text-gray-700">Job Posted On</p>
                    </div>
                    <div className="text-end">
                        <p className="text-sm">{moment(job.created_at).format('MMMM D YYYY')}</p>
                    </div>
                </div>
                <div className="flex mt-3 justify-between">
                    <div>
                        <p className="text-gray-700">Job Type</p>
                    </div>
                    <div className="text-end">
                        <p className="text-sm">{job.job_type}</p>
                    </div>
                </div>
                <div className="flex mt-3 justify-between">
                    <div>
                        <p className="text-gray-700">Salary</p>
                    </div>
                    <div className="text-end">
                        <p className="text-sm">${job.salary_min}-${job.salary_max} USD</p>
                    </div>
                </div>
            </div>
            <hr className="my-5" />
            <div className="px-4">
                <h3 className="text-2xl font-thin">Category</h3>
                <div className="flex mt-3 space-x-3">
                    {
                        job?.categories?.map((item: any, id: string) => {
                            return <button key={id} className="px-4 py-0.5 text-sm rounded-full text-green-600 bg-green-100">{item}</button>
                        })
                    }
                </div>
            </div>
            <hr className="my-5" />
            <div className="px-4">
                <h3 className="text-2xl font-semibold">Requirement Skill</h3>
                <div className="flex mt-3 space-x-3">
                    {
                        job?.skills?.map((item: any, id: string) => {
                            return <button key={id} className="px-4 py-0.5 text-sm rounded-full text-blue-500 bg-blue-100">{item}</button>
                        })
                    }
                </div>
            </div>
        </div>
    )
}
export default Right