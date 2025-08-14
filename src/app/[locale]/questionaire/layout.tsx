'use client'
import React, { FC, ReactNode } from "react";




interface Props {
    children: ReactNode
}

const QuestionaireLayout: FC<Props> = ({ children }) => {
    return (
        <div>
            {children}
        </div>
    )
}
export default QuestionaireLayout;



