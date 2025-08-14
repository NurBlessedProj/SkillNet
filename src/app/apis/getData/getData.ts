import { supabase } from '@/lib/supabase'

const fetchTableNames = async () => {
    const { data, error } = await supabase
        .rpc('get_table_names');  // This should match the function name

    if (error) {
        console.error('Error fetching table names:', error);
        return [];
    }

    // Return the table names from the data object
    return data.map((table: any) => table.table_name);
};

export default fetchTableNames;