import { useQuery } from "@tanstack/react-query";
import { getUserHistories } from "@/lib/supabaseClient";

export function useGetHistories(userId: string | undefined) {
  const {
    data: histories,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["histories", userId],
    queryFn: () => getUserHistories(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  return { histories: histories ?? [], loading, error };
}
