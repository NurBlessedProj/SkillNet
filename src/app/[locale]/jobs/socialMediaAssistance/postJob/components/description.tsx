'use client'

import React, { useState } from "react";
import { EditorState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";


const Description = () => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const onEditorStateChange = (newEditorState: any) => {
        setEditorState(newEditorState);
    };
    return (
        <div className="px-4 mt-5 w-full">
            <div>
                <h2 className="font-semibold">Details</h2>
                <p>Add the description of the job, responsibilities, who you are, and nice-to-haves.</p>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Job Description</h2>
                    <p>Job titles must be describe one position</p>
                </div>
                <div className="w-[70%]">
                    <div className='w-[70%] border h-96'>
                        <Editor
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                        />
                    </div>
                    <p className="text-gray-500">Max 500 Characters</p>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Responsibilities</h2>
                    <p>Outline the core responsibilities of the position</p>
                </div>
                <div className="w-[70%]">
                    <div className='w-[70%] border h-96'>
                        <Editor
                            editorState={editorState}
                            wrapperClassName="demo-wrapper"
                            editorClassName="demo-editor"
                            onEditorStateChange={onEditorStateChange}
                        />
                    </div>
                    <p className="text-gray-500">Max 500 Characters</p>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Who are You</h2>
                    <p>Add your preferred candidates qualifications</p>
                </div>
                <div className="w-[70%]">
                    <div className='w-[70%] border h-96'>
                        <Editor
                            editorState={editorState}
                            wrapperClassName="demo-wrapper"
                            editorClassName="demo-editor"
                            onEditorStateChange={onEditorStateChange}
                        />
                    </div>
                    <p className="text-gray-500">Max 500 Characters</p>
                </div>
            </div>
            <hr className="my-5" />
            <div className="flex space-x-8 w-full">
                <div className="w-[30%]">
                    <h2 className="font-semibold">Nice-to-haves</h2>
                    <p>Add nice-to-have skills and qualifications for the role to encourage a more diverse set of candidates to apply</p>
                </div>
                <div className="w-[70%]">
                    <div className='w-[70%] border h-96'>
                        <Editor
                            editorState={editorState}
                            wrapperClassName="demo-wrapper"
                            editorClassName="demo-editor"
                            onEditorStateChange={onEditorStateChange}
                        />
                    </div>
                    <p className="text-gray-500">Max 500 Characters</p>
                </div>
            </div>

        </div>

    )
}
export default Description