// GetProfileCount.ts
import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

export const GetProfileCount = (period = "7days") => {
    const [adminCount, setAdminCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [adminDailyData, setAdminDailyData] = useState<number[]>([]);
    const [userDailyData, setUserDailyData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const daysToFetch = {
                "7days": 7,
                "30days": 30,
                "90days": 90
            }[period] || 7;

            const userDailyCounts = [];
            const adminDailyCounts = [];

            for (let i = 0; i < daysToFetch; i++) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - i);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);

                // Fetch users count for this day
                const { count: userCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .eq('role', 'user')
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());

                // Fetch admins count for this day
                const { count: adminCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .eq('role', 'admin')
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());

                userDailyCounts.unshift(userCount || 0);
                adminDailyCounts.unshift(adminCount || 0);
            }

            setUserCount(userDailyCounts.reduce((a, b) => a + b, 0));
            setAdminCount(adminDailyCounts.reduce((a, b) => a + b, 0));
            setUserDailyData(userDailyCounts);
            setAdminDailyData(adminDailyCounts);
            setLoading(false);
        };

        fetchData();
    }, [period]);

    return { adminCount, userCount, adminDailyData, userDailyData, loading };
};
