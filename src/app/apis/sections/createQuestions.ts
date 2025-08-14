import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export const CreateSections = () => {
    const [loading, setLoading] = useState(false);

    // Save function to insert data into the Supabase table
    const Save = async (name: string) => {
        setLoading(true)
        try {
            // Insert data into the 'users' table
            const { data, error } = await supabase.from("section").insert([{ name }]);

            if (error) {
                console.error("Error inserting data:", error.message);
                return { error: error.message };
            }

            console.log("Data inserted successfully:", data);
            setLoading(false)
            return { data };
        } catch (err) {
            console.error("Unexpected error:", err);
            setLoading(false)
            return { error: "Unexpected error occurred" };
        }
    };

    return {
        loading,
        Save, // Ensure the `Save` function is returned so it can be used externally
    };
};
