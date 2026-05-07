"use client";

import { useState } from "react";
import { Scan } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useGetUser } from "@/components/hooks/useGetUser";
import { signOut } from "@/lib/supabaseClient";

export function Header() {
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const { user, loading } = useGetUser();

  return (
    <>
      <header className="relative top-0 z-10 bg-[#000919]/70 backdrop-blur-[100px] border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">
              <Scan className="w-7 h-7 text-[#054E98]" />

              <div>
                <h1 className="text-xl font-semibold text-white">ChismiScan</h1>
                <p className="text-xs text-[#054E98]">
                  Gossip Analyzer &amp; Fake News Detector
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            {!loading && (
              <div className="flex items-center gap-3">
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-1.5 rounded-lg border border-[#001D3F] text-white hover:bg-[#0a1a3a] transition"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => setModal("signup")}
                    className="px-4 py-1.5 rounded-lg bg-[#054E98] text-white hover:bg-[#04356A] transition"
                  >
                    Sign Up
                  </button>
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
