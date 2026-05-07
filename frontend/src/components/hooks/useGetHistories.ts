import { useState, useEffect } from "react";
import { getUserHistories } from "@/lib/supabaseClient";

export function useGetHistories(userId: string | undefined) {
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
        const data = await getUserHistories(userId);
        setHistories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch histories"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [userId]);

  return { histories, loading, error };
}
