import React, { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from '@/lib/supabase'

// @get the Zone base on the area
export const GetProfileData = () => {
    const [profile_data, setprofile_data] = useState([])
    const [loading, setLoading] = useState(true)
    React.useEffect(() => {
        const fetchData = async () => {
            const { data, error }: any = await supabase.from('profiles_data').select('*')
            if (error) {
                console.error('Error fetching profile_data:', error)
            } else {
                setprofile_data(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [])
    return { profile_data };
};
