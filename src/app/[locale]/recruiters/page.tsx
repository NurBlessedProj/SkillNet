import React from "react";
import Layout from "../layout";
import Filter from "@/components/filters";
import RecruiterTable from "./components/table";

const Candidate = () => {
    return (
            <div className="px-5 ">
                <div className="flex space-x-3">
                    <Filter />
                    <div className="w-fit mt-5 flex">
                    <div className="w-36 flex justify-center items-center h-12   text-[#4640DE] bg-blue-50 ">
                        <p>PipeLine View</p>
                    </div>
                    <div className="w-24 flex justify-center p-1 items-center h-12 border-y-2 border-r-2 text-[#4640DE] border-blue-50">
                        <p>Table View</p>
                    </div>
                </div>
                </div>
                <div className="mt-5">
                    <RecruiterTable />
                </div>
            </div>
    )
}
export default Candidate