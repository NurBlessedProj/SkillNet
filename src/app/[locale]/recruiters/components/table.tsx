'use client'

import MyTable from "@/components/table";
import Link from "next/link";

// import DeliveredDataUI from "../../dashboard/delivered/components/dataUIexpandable";
// import NewOrderDataUI from "./components/dataUiexpandable";

const columns = [
    {
        name: 'Full Name',
        selector: (row: any) => <div className="flex space-x-2" > <div><img className="h-10 w-10 rounded-full" src={row.img} alt="" /></div><div className="mt-1 text-lg">{row.name}</div></div>,
    },
    {
        name: 'Score',
        selector: (row: { score: any; }) => <div className="flex space-x-2"><i className="ri-star-fill text-yellow-600 text-[16px] mr-2"></i> {row.score} </div>,
    },
    {
        name: 'Hiring Stage',
        selector: (row: { hiring_stage: any }) => <div className="flex space-x-2"><button className="px-4 rounded-full py-1 border border-green-500 text-green-500 ">{row.hiring_stage}</button></div>,
    },
    {
        name: 'Applied Date',
        selector: (row: { applied_date: any }) => <div className="flex space-x-2">{row.applied_date}</div>,
    },
    {
        name: 'Job Role',
        selector: (row: { job_role: any }) => <div className="flex space-x-2">{row.job_role}</div>,
    },
    {
        name: 'Action',
        selector: (row: { action: any }) => <div className="flex space-x-2"> <button className="px-4  py-1 bg-blue-50 border border-[#4640DE] text-[#4640DE] ">{row.action}</button></div>,
    },
    {
        name: '',
        selector: (row: any) => <div className="flex w-[100%] space-x-2 justify-end"><Link href={"/candidates/details"}><div className="flex "><i className="ri-more-line text-xl"></i></div></Link></div>,
    },
];

const data = [
    {
        name: 'Jake Shyll',
        score: '0.0',
        hiring_stage: 'Short Listed',
        applied_date: '24 May 2020',
        job_role: "Software Developer",
        action: "See Aplication",
        img: '/icons/vicky.svg',

    },
]

const RecruiterTable = () => {

    return (
        <>
            <div className="mt-8">
                <MyTable columns={columns} data={data} expanded pagination={data.length > 9 ? true : false} ExpandableComponent={() => <></>} />
            </div>
        </>
    )
}
export default RecruiterTable;