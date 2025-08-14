import Select from "@/components/select";
import React from "react";


const Information = () => {
    return (
        <div className="px-4 mt-5 w-full">
            <div>
                <h2 className="font-semibold">Basic Information</h2>
                <p>This information will be displayed publicly</p>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Job Title</h2>
                    <p>Job titles must be describe one position</p>
                </div>
                <div className="w-[70%]">
                    <input type="text" className="w-64 py-2.5 border pl-2 text-gray-500" name="" placeholder="eg. Software Engineering" id="" />
                    <p className="text-gray-500">At least 80 Character</p>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Type of Employment</h2>
                    <p>You can select multiple type of employment</p>
                </div>
                <div className="w-[70%]">
                    <div className="flex space-x-2 mt-2">
                        <input type="checkbox" id="fulltime" />
                        <label htmlFor="fulltime" className="cursor-pointer text-gray-500">Full-Time</label>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <input type="checkbox" id="partime" />
                        <label htmlFor="partime" className="cursor-pointer text-gray-500">Part-Time</label>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <input type="checkbox" id="remote" />
                        <label htmlFor="remote" className="cursor-pointer text-gray-500">Remote</label>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <input type="checkbox" id="internship" />
                        <label htmlFor="internship" className="cursor-pointer text-gray-500">Internship</label>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <input type="checkbox" id="contract" />
                        <label htmlFor="contract" className="cursor-pointer text-gray-500">Contract</label>
                    </div>
                </div>

            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Salary</h2>
                    <p>Please specify the estimated salary range for the role. *You can leave this blank</p>
                </div>
                <div className="w-[70%]">
                    <div className="flex space-x-8">
                        <div>
                            <div className="border flex w-28 py-2">
                                <div className="w-full text-center">
                                    <p>XAF</p>
                                </div>
                                <div className="border-l w-full text-center ">
                                    <p className="text-gray-500">5,000</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="mt-2 text-xl">To</p>
                        </div>
                        <div>
                            <div className="border flex w-28 py-2">
                                <div className="w-full text-center">
                                    <p>XAF</p>
                                </div>
                                <div className="border-l w-full text-center ">
                                    <p className="text-gray-500">5,000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Categories</h2>
                    <p>You can select multiple job categories</p>
                </div>
                <div className="w-[70%]">
                    <p className="text-gray-500">Select Job Categories</p>
                    <div className="w-64">
                        <Select options={[{ label: "Select Job Categories", value: "Select Job Categories" }]} selectedValue={"Select Job Categories"} bg={""} />
                    </div>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Required Skilled</h2>
                    <p>Add required skills for the job</p>
                </div>
                <div className="w-[70%]">
                    <button className="flex px-4 py-2 text-[#4640DE] font-semibold bg-[#CCCCF5] "><i className="ri-add-line mr-2"></i>Add Skills</button>
                    <div className="flex mt-3">
                    <button className="flex px-4 py-2 text-[#4640DE] bg-[#CCCCF5] ">Graphic Design <i className="ri-close-line text-xl ml-2"></i></button>
                    </div>
                </div>
            </div>
        </div>

    )
}
export default Information