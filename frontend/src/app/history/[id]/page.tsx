"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  Gauge,
  ReceiptText,
  ScrollText,
} from "lucide-react";
import { useGetHistory } from "@/components/hooks/useGetHistory";
import { Button } from "@/components/ui/button";

type AnalysisResult = {
  personality?: string;
  classification?: string;
  chismisLevel?: number;
  message?: string;
  details?: string;
  breakdown?: {
    reasons?: string[];
    redFlags?: string[];
  };
  harmScore?: {
    level?: string;
    score?: number;
    explanation?: string;
  };
  maritesMode?: string;
  resibo?: {
    verdict?: string;
    sources?: Array<{ title?: string; url?: string; credibility?: string }>;
  };
  linguisticFlags?: string[];
  factCorrection?: string;
  sourceCredibility?: {
    score?: number;
    trustedCount?: number;
    semiTrustedCount?: number;
    untrustedCount?: number;
  };
  literacyLesson?: {
    summary?: string;
    points?: Array<{ issue?: string; correction?: string }>;
    tip?: string;
  };
  inputType?: string;
  originalInput?: string;
};

const CLASS_BADGE: Record<string, string> = {
  fact: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
  opinion: "border-amber-400/30 bg-amber-400/15 text-amber-300",
  chismis: "border-pink-400/30 bg-pink-400/15 text-pink-300",
};

export default function HistoryByIdPage() {
  const params = useParams();
  const historyId = Number(params?.id);
  const { history, loading, error } = useGetHistory(historyId);

  const analysis = useMemo((): AnalysisResult => {
    // Handle both camelCase ("analysisResult") and lowercase ("analysisresult")
    // column name variants that PostgreSQL may return.
    const raw: unknown =
      history?.analysisResult ?? history?.analysisresult ?? null;
    if (!raw) return {} as AnalysisResult;
    // Handle the case where the value was accidentally stored as a JSON string.
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as AnalysisResult;
      } catch {
        return {} as AnalysisResult;
      }
    }
    return raw as AnalysisResult;
  }, [history]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6 md:pl-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/">
          <Button
            variant="outline"
            className="gap-2 border-[#001D3F] bg-[#000919] text-white hover:bg-[#0a1a3a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#000919]/80 p-6 text-white/70">
          Loading scan details...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/30 p-6 text-red-100">
          Failed to load this history item.
        </div>
      )}

      {!loading && !error && !history && (
        <div className="rounded-2xl border border-white/10 bg-[#000919]/80 p-6 text-white/70">
          This history entry does not exist or is not accessible.
        </div>
      )}

      {!loading && !error && history && (
        <div className="space-y-4">
          <article className="rounded-2xl border border-white/10 bg-[#000919]/80 p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {analysis.originalInput || "History Detail"}
              </h1>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                  CLASS_BADGE[analysis.classification || ""] ||
                  "border-white/20 bg-white/10 text-white/70"
                }`}
              >
                {analysis.classification || "unknown"}
              </span>
            </div>
            <p className="text-sm text-white/60">
              Personality: {analysis.personality || "n/a"} | Input type:{" "}
              {analysis.inputType || "n/a"}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#001128]/80 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Chismis Level
                </p>
                <p className="mt-1 text-2xl font-bold text-[#54A9FF]">
                  {analysis.chismisLevel ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#001128]/80 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Message
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {analysis.message || "No message"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#001128]/80 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Details
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {analysis.details || "No details"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#000919]/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <Gauge className="h-4 w-4 text-[#54A9FF]" /> Harm Score
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#001128]/70 p-3 text-sm text-white/80">
                Level:{" "}
                <span className="font-semibold capitalize text-white">
                  {analysis.harmScore?.level || "n/a"}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#001128]/70 p-3 text-sm text-white/80">
                Score:{" "}
                <span className="font-semibold text-white">
                  {analysis.harmScore?.score ?? "n/a"}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#001128]/70 p-3 text-sm text-white/80">
                Source credibility:{" "}
                <span className="font-semibold text-white">
                  {analysis.sourceCredibility?.score ?? "n/a"}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/70">
              {analysis.harmScore?.explanation ||
                "No harm explanation available."}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#000919]/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <ReceiptText className="h-4 w-4 text-[#54A9FF]" /> Resibo
            </h2>
            <p className="mb-3 text-sm text-white/75">
              {analysis.resibo?.verdict || "No verdict available."}
            </p>
            <div className="space-y-2">
              {(analysis.resibo?.sources || []).map((source, index) => (
                <a
                  key={`${source.url || source.title}-${index}`}
                  href={source.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#001128]/70 p-3 transition hover:border-[#054E98]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {source.title || "Untitled source"}
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      {source.url || "No URL"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/80 capitalize">
                      {source.credibility || "unknown"}
                    </span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 text-white/60" />
                  </div>
                </a>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#000919]/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <ScrollText className="h-4 w-4 text-[#54A9FF]" /> Breakdown
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#001128]/70 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
                  Reasons
                </p>
                <ul className="space-y-1 text-sm text-white/80">
                  {(analysis.breakdown?.reasons || []).map((reason, index) => (
                    <li
                      key={`${reason}-${index}`}
                      className="flex items-start gap-2"
                    >
                      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                      <span>{reason}</span>
                    </li>
                  ))}
                  {(analysis.breakdown?.reasons || []).length === 0 && (
                    <li className="text-white/50">No reasons listed.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#001128]/70 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
                  Red Flags
                </p>
                <ul className="space-y-1 text-sm text-white/80">
                  {(analysis.breakdown?.redFlags || []).map((flag, index) => (
                    <li
                      key={`${flag}-${index}`}
                      className="flex items-start gap-2"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
                      <span>{flag}</span>
                    </li>
                  ))}
                  {(analysis.breakdown?.redFlags || []).length === 0 && (
                    <li className="text-white/50">No red flags listed.</li>
                  )}
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#000919]/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <CircleHelp className="h-4 w-4 text-[#54A9FF]" /> Media Literacy
              Lesson
            </h2>
            <p className="text-sm text-white/80">
              {analysis.literacyLesson?.summary ||
                "No lesson summary available."}
            </p>
            <div className="mt-3 space-y-2">
              {(analysis.literacyLesson?.points || []).map((point, index) => (
                <div
                  key={`${point.issue}-${index}`}
                  className="rounded-xl border border-white/10 bg-[#001128]/70 p-3"
                >
                  <p className="text-sm text-white/70">
                    <span className="font-semibold text-white">Issue:</span>{" "}
                    {point.issue || "n/a"}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    <span className="font-semibold text-white">
                      Correction:
                    </span>{" "}
                    {point.correction || "n/a"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-[#54A9FF]">
              {analysis.literacyLesson?.tip || "Always verify before sharing."}
            </p>
          </article>

          {analysis.maritesMode && (
            <article className="rounded-2xl border border-pink-300/20 bg-pink-950/20 p-5">
              <h2 className="mb-2 text-base font-semibold text-pink-200">
                Marites Mode
              </h2>
              <p className="text-sm text-pink-100/90">{analysis.maritesMode}</p>
            </article>
          )}

          {analysis.factCorrection && (
            <article className="rounded-2xl border border-emerald-300/20 bg-emerald-950/20 p-5">
              <h2 className="mb-2 text-base font-semibold text-emerald-200">
                Fact Correction
              </h2>
              <p className="text-sm text-emerald-100/90">
                {analysis.factCorrection}
              </p>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
