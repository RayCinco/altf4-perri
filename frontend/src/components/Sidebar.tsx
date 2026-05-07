"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock3, History, Home, Menu, UserRound } from "lucide-react";
import { useGetUser } from "@/components/hooks/useGetUser";
import { useGetRecentHistories } from "@/components/hooks/useGetRecentHistories";
import AuthModal from "@/components/AuthModal";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useSidebar } from "@/components/SidebarContext";

const CLASSIFICATION_COLORS: Record<string, string> = {
  fact: "text-green-400",
  opinion: "text-yellow-400",
  chismis: "text-pink-400",
};

export default function Sidebar() {
  // Desktop uses local state; mobile state comes from shared context (toggled by Header hamburger)
  const {
    sidebarOpen: mobileSidebarOpen,
    setSidebarOpen: setMobileSidebarOpen,
  } = useSidebar();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const { user } = useGetUser();
  const { histories } = useGetRecentHistories(user?.id);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";
  const displayEmail = user?.email || "";

  return (
    <>
      {/* ── MOBILE OVERLAY ─────────────────────────────────────────── */}
      {/* Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in panel */}
      <div
        className={`sm:hidden fixed left-0 top-0 z-50 h-full w-72 flex flex-col bg-[#000919] border-r border-white/10 transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="/logo/Perri.png"
              alt="Perri"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-white font-semibold text-base">
              ChismiScan
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile nav items */}
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 space-y-1 text-sm text-white/80">
          <Link
            href="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white hover:bg-white/5 transition"
          >
            <Home className="h-4 w-4" />
            <span className="font-medium">Home</span>
          </Link>
          {user && (
            <Link
              href="/history"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white hover:bg-white/5 transition"
            >
              <History className="h-4 w-4" />
              <span className="font-medium">History</span>
            </Link>
          )}
          {user && histories.length > 0 && (
            <div className="pt-2">
              <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                Recent
              </h2>
              {histories.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/history/${item.id}`}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex flex-col rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">
                      {item.analysisResult?.originalInput || "Scan"}
                    </span>
                  </div>
                  <span
                    className={`ml-6 text-[10px] capitalize ${
                      CLASSIFICATION_COLORS[item.classification] ??
                      "text-white/50"
                    }`}
                  >
                    {item.classification}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile panel footer */}
        <div className="px-3 pb-4">
          {user ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {displayEmail}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setModal("login");
                  setMobileSidebarOpen(false);
                }}
                className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setModal("signup");
                  setMobileSidebarOpen(false);
                }}
                className="w-full rounded-lg bg-[#054E98] px-4 py-2 text-sm font-medium text-white hover:bg-[#04356A] transition"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR (unchanged) ─────────────────────────────── */}
      <aside
        className={`hidden sm:flex fixed left-0 top-0 z-50 h-screen flex-col overflow-visible border-r border-white/10 bg-[#000919]/95 backdrop-blur-[100px] transition-all duration-300 ${
          desktopOpen ? "w-64 p-5" : "w-16 p-3"
        }`}
      >
        <button
          type="button"
          onClick={() => setDesktopOpen((open) => !open)}
          className="group relative mt-2 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition hover:scale-105"
          aria-label="Toggle sidebar"
        >
          <img
            src="/logo/Perri.png"
            alt="Perri"
            className="mt-6 mb-6 h-11 w-11 rounded-full object-cover p-0.5 transition-opacity duration-200 group-hover:opacity-0"
          />
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
            <Menu className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
          </div>
        </button>

        {desktopOpen && (
          <div className="mt-12 flex flex-1 flex-col space-y-1 text-sm text-white/80">
            <div>
              <Link
                href="/"
                className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-white transition hover:bg-white/5"
              >
                <Home className="h-4 w-4" />
                <span className="font-semibold">Home</span>
              </Link>
            </div>
            {user && (
              <div>
                <Link
                  href="/history"
                  className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-white transition hover:bg-white/5"
                >
                  <History className="h-4 w-4" />
                  <span className="font-semibold">History</span>
                </Link>
              </div>
            )}
            {!user && (
              <div className="mb-2">
                <h2 className="text-xl font-bold text-white mb-1">
                  ChismiScan
                </h2>
                <p className="text-base text-white/80 leading-snug mb-1">
                  Gossip Analyzer & Fake News Detector
                </p>
                <p className="text-sm text-white/60 mb-1">
                  Analyze screenshots, text, or viral posts for rumors, facts,
                  or chismis.
                </p>
                <p className="text-sm text-white/60">
                  Sign up to save your scan history!
                </p>
              </div>
            )}

            {user ? (
              <>
                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Recent
                  </h2>
                  <div>
                    {histories.slice(0, 10).map((item) => (
                      <Link
                        key={item.id}
                        href={`/history/${item.id}`}
                        className="flex flex-col rounded-lg px-2 py-2 hover:bg-white/5 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {item.analysisResult?.originalInput || "Scan"}
                          </span>
                        </div>
                        <span
                          className={`ml-6 text-xs capitalize ${
                            CLASSIFICATION_COLORS[item.classification] ??
                            "text-white/50"
                          }`}
                        >
                          {item.classification}
                        </span>
                      </Link>
                    ))}
                    {histories.length === 0 && (
                      <p className="px-2 text-xs text-white/30">
                        No recent scans yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-white/60">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => setModal("login")}
                  className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => setModal("signup")}
                  className="w-full rounded-lg bg-[#054E98] px-4 py-2 text-sm font-medium text-white hover:bg-[#04356A] transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}

        {!desktopOpen && (
          <div className="mt-8 flex flex-1 flex-col items-center text-white/80">
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/"
                className="group relative flex items-center justify-center"
              >
                <Home className="h-5 w-5 hover:text-white" />
                <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                  Home
                </div>
              </Link>
              {user && (
                <>
                  <Link
                    href="/history"
                    className="group relative flex items-center justify-center"
                  >
                    <History className="h-5 w-5 hover:text-white" />
                    <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                      History
                    </div>
                  </Link>
                  <div className="group relative flex items-center justify-center">
                    <Clock3 className="h-5 w-5 hover:text-white" />
                    <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                      Recent
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="group relative mt-auto rounded-full border border-white/10 bg-white/5 p-2">
              <UserRound className="h-5 w-5" />
              <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                {user ? displayName : "Account"}
              </div>
            </div>
          </div>
        )}
      </aside>

      <AuthModal isOpen={modal === "login"} onClose={() => setModal(null)}>
        <LoginForm onSuccess={() => setModal(null)} />
      </AuthModal>
      <AuthModal isOpen={modal === "signup"} onClose={() => setModal(null)}>
        <SignupForm onSuccess={() => setModal(null)} />
      </AuthModal>
    </>
  );
}
