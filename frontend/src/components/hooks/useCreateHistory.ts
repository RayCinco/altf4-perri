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
      const errorObject = err instanceof Error ? err : new Error("Failed to save history");
      setError(errorObject);
      throw errorObject;
    } finally {
      setLoading(false);
    }
  };

  return { createHistory, loading, error };
}
