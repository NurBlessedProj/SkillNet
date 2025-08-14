import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export const DeleteQuestion = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter()

    // Delete function to remove data from the Supabase table by ID
    const Delete = async (id: string) => {
        console.log(id)
        setLoading(true);
        try {
            // Delete data from the 'questions' table using the provided 'id'
            const { data, error } = await supabase
                .from("questions")
                .delete()
                .eq("Serial", parseInt(id));  // Match the question by its ID

            if (error) {
                console.error("Error deleting data:", error.message);
                setLoading(false);
                return { error: error.message };
            }

            console.log("Data deleted successfully:", data);
            setLoading(false);

            // Correct way to reload the page
            router.refresh();

            return { data };
        } catch (err) {
            console.error("Unexpected error:", err);
            setLoading(false);
            return { error: "Unexpected error occurred" };
        }
    };

    return { Delete, loading };
};
