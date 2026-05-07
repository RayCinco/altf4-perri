import { useState } from "react";
import { saveHistory } from "@/lib/supabaseClient";

export function useCreateHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createHistory = async (userId: string, analysisResult: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await saveHistory(userId, analysisResult);
      return data;
    } catch (err) {
      // Supabase throws PostgrestError which is not instanceof Error — extract message via duck-typing
      const message =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ??
            "Failed to save history");
      const errorObject = new Error(message);
      setError(errorObject);
      throw errorObject;
    } finally {
      setLoading(false);
    }
  };

  return { createHistory, loading, error };
}
