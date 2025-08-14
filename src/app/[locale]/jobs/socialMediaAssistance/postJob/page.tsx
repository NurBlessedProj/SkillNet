'use client'
import React, { useState } from "react";
import Information from "./components/information";

import Link from "next/link";

import dynamic from "next/dynamic"


const Description = dynamic(() => import("./components/description"), {
    // Do not import in server side
    ssr: false,
})



const PostJob = () => {
    const [active, setActive] = useState("Description")
    return (
        <div className="">
            <Link href={"./"} ><div className='w-full flex my-5 space-x-2'>
                <i className="ri-arrow-left-line text-xl"></i>
                <h2 className='text-xl'>Post a Job</h2>
            </div></Link>

            <div className="flex justify-between border py-2">
                <div className="flex justify-center mt-2 w-full">
                    <div className="flex space-x-2">
                        <div>
                            <img src="/icons/info.svg" alt="" />
                        </div>
                        <div>
                            <p className="text-blue-400">Step 1/3</p>
                            <h3>Job Information</h3>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center py-2 border-x w-full">
                    <div className="flex space-x-2">
                        <div>
                            <img src="/icons/description.svg" alt="" />
                        </div>
                        <div>
                            <p className="text-blue-400">Step 2/3</p>
                            <h3>Job Description</h3>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center w-full">
                    <div className="flex mt-2 space-x-2">
                        <div>
                            <img src="/icons/perk.svg" alt="" />
                        </div>
                        <div>
                            <p className="text-blue-400">Step 3/3</p>
                            <h3>Perks & Benifits</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="  ">
                {
                    active == "Information" && <Information />
                }
                {
                    active == "Description" && <Description />
                }
            </div>
            <div className="mt-5 flex w-full px-4 flex justify-end">
                <button className="bg-[#4640DE] text-white px-4 py-2 ">Next Step</button>
            </div>
        </div>
    )
}
export default PostJob