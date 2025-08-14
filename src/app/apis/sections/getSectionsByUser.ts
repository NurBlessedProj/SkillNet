import React, { useState } from "react";
import { supabase } from '@/lib/supabase'

export const GetSection = () => {
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            // Get the logged-in user using getUser()
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                console.error("Error fetching user:", error);
                setLoading(false);
                return;
            }
            console.log(user)
            if (user) {
                // Query sections based on the user's email and get a single section
                const { data, error: fetchError }: any = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("email", user.email)
                    .single(); // Use single() to get a single result

                if (fetchError) {
                    console.error("Error fetching section:", fetchError);
                } else {
                    setSection(data);
                    console.log(data)
                }
            } else {
                console.log("User is not logged in.");
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    return { section };
};
