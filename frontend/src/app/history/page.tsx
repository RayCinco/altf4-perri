"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock3, Plus, Search } from "lucide-react";
import { useGetUser } from "@/components/hooks/useGetUser";
import { useGetHistories } from "@/components/hooks/useGetHistories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HistoryRecord = {
  id: number;
  classification?: string;
  created_at?: string;
  analysisResult?: {
    originalInput?: string;
    message?: string;
    details?: unknown;
  };
};

const CLASS_BADGE: Record<string, string> = {
  fact: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
  opinion: "border-amber-400/30 bg-amber-400/15 text-amber-300",
  chismis: "border-pink-400/30 bg-pink-400/15 text-pink-300",
};

function formatDate(dateValue?: string) {
  if (!dateValue) return "Unknown date";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getTitle(item: HistoryRecord) {
  return item.analysisResult?.originalInput || "Untitled scan";
}

function getPreview(item: HistoryRecord) {
  if (item.analysisResult?.message) return item.analysisResult.message;
  const details = item.analysisResult?.details;
  if (typeof details === "string") return details;
  if (details && typeof details === "object") {
    return Object.values(details as Record<string, unknown>)
      .filter((value) => typeof value === "string")
      .join(" ")
      .slice(0, 220);
  }
  return "No summary available yet.";
}

export default function HistoryPage() {
  const { user, loading: userLoading } = useGetUser();
  const { histories, loading, error } = useGetHistories(user?.id);
  const [query, setQuery] = useState("");

  const filteredHistories = useMemo(() => {
    const records = (histories || []) as HistoryRecord[];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;

    return records.filter((item) => {
      const title = getTitle(item).toLowerCase();
      const preview = getPreview(item).toLowerCase();
      const classification = (item.classification || "").toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        preview.includes(normalizedQuery) ||
        classification.includes(normalizedQuery)
      );
    });
  }, [histories, query]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 md:pl-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">History</h1>
        <Link href="/">
          <Button className="gap-2 rounded-xl bg-[#054E98] hover:bg-[#04356A]">
            <Plus className="h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your past scans..."
          className="h-11 rounded-xl border-white/15 bg-[#000919]/80 pl-10 text-white placeholder:text-white/45"
        />
      </div>

      {userLoading && (
        <div className="rounded-2xl border border-white/10 bg-[#000919]/70 p-6 text-white/70">
          Checking session...
        </div>
      )}

      {!userLoading && !user && (
        <div className="rounded-2xl border border-white/10 bg-[#000919]/80 p-6 text-white/80">
          <p className="text-lg font-semibold text-white">
            Sign in to view your history.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Your previous scans and classifications will appear here once you
            are logged in.
          </p>
        </div>
      )}

      {user && loading && (
        <div className="rounded-2xl border border-white/10 bg-[#000919]/70 p-6 text-white/70">
          Loading history...
        </div>
      )}

      {user && error && (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/30 p-6 text-red-100">
          Failed to load history. Please refresh and try again.
        </div>
      )}

      {user && !loading && !error && (
        <div className="space-y-3">
          {filteredHistories.map((item) => (
            <Link key={item.id} href={`/history/${item.id}`} className="block">
              <article className="rounded-2xl border border-white/10 bg-[#000919]/70 p-5 transition hover:border-[#054E98]/70 hover:bg-[#001128]/80">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="line-clamp-1 text-lg font-semibold text-white">
                    {getTitle(item)}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      CLASS_BADGE[item.classification || ""] ||
                      "border-white/20 bg-white/10 text-white/70"
                    }`}
                  >
                    {item.classification || "unknown"}
                  </span>
                </div>

                <p className="line-clamp-2 text-sm leading-relaxed text-white/65">
                  {getPreview(item)}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </article>
            </Link>
          ))}

          {filteredHistories.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#000919]/70 p-6 text-center text-white/60">
              {histories.length === 0
                ? "No history yet. Run your first scan to start building your timeline."
                : "No matching history found for your search."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
