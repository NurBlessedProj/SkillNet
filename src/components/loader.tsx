"use client";
import React, { FC, useState, useEffect } from "react";

const CustomLoader = () => {

    return (
        <div className="animate-pulse w-full">
            <div className="w-full    ">
                <div className="h-[37px] w-full border-b bg-gray-100">
                </div>
                <div className="  pt-3">
                    <div className=" flex  px-4 space-x-8 py-[15px]" >
                        <div className="w-full   rounded bg-gray-200 h-7">
                        </div>
                        <div className="w-full rounded bg-gray-200 h-7">
                        </div>
                        <div className="w-full rounded bg-gray-200 h-7">
                        </div>
                        <div className="w-full rounded bg-gray-200 h-7">
                        </div>
                        <div className="w-full rounded bg-gray-200 h-7">
                        </div>
                        <div className="w-full   rounded bg-gray-200 h-7">
                        </div>
                    </div>
                </div>
                {/* <div className="h-14 border-t w-full ">
                </div> */}
            </div>
        </div>
    )
}

export default CustomLoader;