"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
//ADD
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AuthModal({
  isOpen,
  onClose,
  children,
}: AuthModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#04356A] border border-[#04356A] text-white hover:bg-[#0a1a3a] transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        {children}
      </div>
    </div>
  );
}
