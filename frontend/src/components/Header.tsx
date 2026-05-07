"use client";

import { useState } from "react";
import { Menu, Scan } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useGetUser } from "@/components/hooks/useGetUser";
import { signOut } from "@/lib/supabaseClient";
import { useSidebar } from "@/components/SidebarContext";

export function Header() {
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const { user, loading } = useGetUser();
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <header className="relative top-0 z-20 bg-[#000919]/70 backdrop-blur-[100px] border-b border-white/10">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            {/* LEFT — hamburger (mobile only) + brand */}
            <div className="flex items-center gap-3">
              {/* Hamburger: mobile only */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Brand */}
              <div className="flex items-center gap-2">
                <Scan className="w-6 h-6 sm:w-7 sm:h-7 text-[#054E98]" />
                <div>
                  <h1 className="text-base sm:text-xl font-semibold text-white leading-tight">
                    ChismiScan
                  </h1>
                  <p className="text-[10px] sm:text-xs text-[#054E98] leading-tight">
                    Gossip Analyzer &amp; Fake News Detector
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT — auth buttons */}
            {!loading && (
              <div className="flex items-center gap-2">
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 rounded-lg border border-[#001D3F] text-white text-sm hover:bg-[#0a1a3a] transition"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    {/* Login: mobile only */}
                    <button
                      onClick={() => setModal("login")}
                      className="sm:hidden px-3 py-1.5 rounded-lg border border-white/20 text-white text-sm hover:bg-white/5 transition"
                    >
                      Login
                    </button>
                    {/* Sign Up: always visible */}
                    <button
                      onClick={() => setModal("signup")}
                      className="px-3 py-1.5 rounded-lg bg-[#054E98] text-white text-sm hover:bg-[#04356A] transition"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={modal === "login"} onClose={() => setModal(null)}>
        <LoginForm />
      </AuthModal>
      <AuthModal isOpen={modal === "signup"} onClose={() => setModal(null)}>
        <SignupForm />
      </AuthModal>
    </>
  );
}
