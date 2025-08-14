'use client'
import React, { useState } from 'react'
import { Register } from '@/api/registerUser'

const Registers = () => {
    const register = Register()
    const [username, setUsername] = useState("")

    const handleSubmit = () => {
        register.save(username)
    }

    return (
        <div className='h-screen w-full flex justify-center items-center'>
            <div className='w-full'>
                <div>
                    <input value={username} onChange={(e: any) => setUsername(e.target.value)} type="text" name="" className='py-2.5 w-[50%] my-4 pl-2' id="" />
                </div>
                <button className='py-2 border bg-green-500 text-white w-[50%] mt-4' onClick={handleSubmit}>{register.loading ? 'Saving ...' : 'Save'}</button>
            </div>
        </div>
    )
}
export default Registers