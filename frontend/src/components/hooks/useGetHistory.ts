import { useEffect, useState } from "react";
import { getHistoryById } from "@/lib/supabaseClient";

export function useGetHistory(historyId: number | undefined) {
  const [history, setHistory] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      if (!historyId || Number.isNaN(historyId)) {
        if (!cancelled) {
          setHistory(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = (await getHistoryById(historyId)) as Record<
          string,
          unknown
        > | null;
        if (data) {
          // Normalize column name: PostgreSQL lowercases unquoted identifiers,
          // so "analysisResult" may come back as "analysisresult".
          if (
            data["analysisresult"] !== undefined &&
            data["analysisResult"] === undefined
          ) {
            data["analysisResult"] = data["analysisresult"];
          }
        }
        if (!cancelled) setHistory(data ?? null);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err : new Error("Failed to fetch history."),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [historyId]);

  return { history, loading, error };
}
