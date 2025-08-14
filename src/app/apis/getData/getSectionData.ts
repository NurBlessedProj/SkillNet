import { supabase } from '@/lib/supabase';

export const fetchSectionData = async () => {
    // Fetch data from the given table name
    const { data, error } = await supabase
        .from("section")  // Use the table name directly
        .select('*');  // Fetch all columns in the table (you can adjust this as needed)
    console.log(data)
    if (error) {
        console.error(`Error fetching data from table:`, error);
        return [];
    }
    // Return the data retrieved from the table
    return data;
};

