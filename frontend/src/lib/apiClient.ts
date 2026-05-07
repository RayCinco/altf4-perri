// apiClient.ts
// Handles API requests for ChismiScan frontend

import type { AnalysisResult } from "@/app/types/analysis";

export async function analyzeChismisAPI({
  text,
  url,
  file,
  personality,
}: {
  text?: string;
  url?: string;
  file?: File | null;
  personality: "marites" | "formal";
}): Promise<AnalysisResult & { error?: string }> {
  const formData = new FormData();
  formData.append("personality", personality);
  if (text) formData.append("text", text);
  if (url) formData.append("url", url);
  if (file) formData.append("file", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });
  return response.json();
}
