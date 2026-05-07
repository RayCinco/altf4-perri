"use client";

import { useState } from "react";
import { Clock3, History, Home, Menu, UserRound } from "lucide-react";
import { useGetUser } from "@/components/hooks/useGetUser";
import { useGetRecentHistories } from "@/components/hooks/useGetRecentHistories";
import AuthModal from "@/components/AuthModal";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";

const CLASSIFICATION_COLORS: Record<string, string> = {
  fact: "text-green-400",
  opinion: "text-yellow-400",
  chismis: "text-pink-400",
};

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-visible border-r border-white/10 bg-[#000919]/95 backdrop-blur-[100px] transition-all duration-300 ${
          sidebarOpen ? "w-64 p-5" : "w-16 p-3"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
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

        {sidebarOpen && (
          <div className="mt-12 flex flex-1 flex-col space-y-5 text-sm text-white/80">
            <div>
              <div className="mb-2 flex items-center gap-2 text-white">
                <Home className="h-4 w-4" />
                <span className="font-semibold">Home</span>
              </div>
            </div>

            {user ? (
              <>
                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Recent
                  </h2>
                  <div className="space-y-2">
                    {histories.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
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
                      </div>
                    ))}
                    {histories.length === 0 && (
                      <p className="px-2 text-xs text-white/30">
                        No recent scans yet.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    History
                  </h2>
                  <div className="space-y-2">
                    {histories.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col rounded-lg px-2 py-2 hover:bg-white/5 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 shrink-0" />
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
                      </div>
                    ))}
                    {histories.length === 0 && (
                      <p className="px-2 text-xs text-white/30">
                        No history yet.
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

        {!sidebarOpen && (
          <div className="mt-8 flex flex-1 flex-col items-center text-white/80">
            <div className="flex flex-col items-center gap-4">
              <div className="group relative flex items-center justify-center">
                <Home className="h-5 w-5 hover:text-white" />
                <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                  Home
                </div>
              </div>
              {user && (
                <>
                  <div className="group relative flex items-center justify-center">
                    <Clock3 className="h-5 w-5 hover:text-white" />
                    <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                      Recent
                    </div>
                  </div>
                  <div className="group relative flex items-center justify-center">
                    <History className="h-5 w-5 hover:text-white" />
                    <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-2xl group-hover:block">
                      History
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AuthModal isOpen={modal === "login"} onClose={() => setModal(null)}>
        <LoginForm />
      </AuthModal>
      <AuthModal isOpen={modal === "signup"} onClose={() => setModal(null)}>
        <SignupForm />
      </AuthModal>
    </>
  );
}
