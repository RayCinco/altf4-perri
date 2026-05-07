import { useQuery } from "@tanstack/react-query";
import { getRecentHistories } from "@/lib/supabaseClient";

export function useGetRecentHistories(userId: string | undefined) {
  const {
    data: histories,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["recentHistories", userId],
    queryFn: () => getRecentHistories(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  return { histories: histories ?? [], loading, error };
}
