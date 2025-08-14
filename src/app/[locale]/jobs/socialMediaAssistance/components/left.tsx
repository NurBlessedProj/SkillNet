import React, { FC } from "react";

// Define the prop interface
interface Data {
    job: any;  // Type for the job data (you can specify a more detailed type based on the structure of your job data)
}

const Left: FC<Data> = ({ job }) => {
    // Log the job data to see if it's passed correctly
    console.log(job);

    return (
        <div className="w-full px-4">
            <div className="mt-8">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="font-thin text-[15px]">{job.company_description}</p>
            </div>
            <div className="mt-5">
                <h3 className="text-lg font-semibold">Responsibilities</h3>
                <div
                    className="font-thin text-[15px]"
                    dangerouslySetInnerHTML={{ __html: job?.responsibilities || "Description not available" }}
                />

            </div>
            <div className="mt-5">
                <h3 className="text-lg font-semibold">Who You are </h3>
                <div
                    className="font-thin text-[15px]"
                    dangerouslySetInnerHTML={{ __html: job?.who_you_are || "Description not available" }}
                />

            </div>
            <div className="mt-5">
                <h3 className="text-lg font-semibold">Nice-To-Haves</h3>
                <div
                    className="font-thin text-[15px]"
                    dangerouslySetInnerHTML={{ __html: job?.additional_requirements || "Description not available" }}
                />


            </div>
        </div>
    )
}
export default Left