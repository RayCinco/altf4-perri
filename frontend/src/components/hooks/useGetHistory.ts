import { useQuery } from "@tanstack/react-query";
import { getHistoryById } from "@/lib/supabaseClient";

async function fetchHistory(
  historyId: number,
): Promise<Record<string, unknown> | null> {
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
  return data ?? null;
}

export function useGetHistory(historyId: number | undefined) {
  const {
    data: history,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["history", historyId],
    queryFn: () => fetchHistory(historyId!),
    enabled: !!historyId && !Number.isNaN(historyId),
    staleTime: 30 * 1000,
  });

  return { history: history ?? null, loading, error };
}
