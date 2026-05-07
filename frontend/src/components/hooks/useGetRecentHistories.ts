import { useState, useEffect } from "react";
import { getRecentHistories } from "@/lib/supabaseClient";

export function useGetRecentHistories(userId: string | undefined) {
    const [histories, setHistories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setHistories([]);
            return;
        }

        const fetchHistories = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getRecentHistories(userId);
                setHistories(data || []);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to fetch recent histories"));
            } finally {
                setLoading(false);
            }
        };

        fetchHistories();
    }, [userId]);

    return { histories, loading, error };
}
