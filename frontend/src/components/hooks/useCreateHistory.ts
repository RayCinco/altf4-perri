import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveHistory } from "@/lib/supabaseClient";

export function useCreateHistory() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      userId,
      analysisResult,
    }: {
      userId: string;
      analysisResult: Record<string, unknown>;
    }) => saveHistory(userId, analysisResult),
    onSuccess: (_data, variables) => {
      // Invalidate both full and recent history caches so they refetch
      queryClient.invalidateQueries({
        queryKey: ["histories", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recentHistories", variables.userId],
      });
    },
  });

  const createHistory = (
    userId: string,
    analysisResult: Record<string, unknown>,
  ) => mutation.mutateAsync({ userId, analysisResult });

  return {
    createHistory,
    loading: mutation.isPending,
    error: mutation.error,
  };
}
