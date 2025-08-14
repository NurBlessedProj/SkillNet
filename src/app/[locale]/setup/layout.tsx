'use client'
import React, { FC, ReactNode } from "react";

interface Props {
    children: ReactNode
}

const SetUpLayout: FC<Props> = ({ children }) => {
    return (
        <div>
            {children}
        </div>
    )
}
export default SetUpLayout;