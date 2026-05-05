"use client";

export default function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-[#080705] via-[#000919] to-[#0C0C0F]" />

      {/* Static Circle */}
      <div
        className="absolute w-150 h-150 bg-[#054E98] rounded-full blur-3xl opacity-40"
        style={{ top: "5%", left: "10%" }}
      />

      <div
        className="absolute w-125 h-125 bg-[#04356A] rounded-full blur-3xl opacity-40"
        style={{ bottom: "10%", right: "15%" }}
      />

      <div
        className="absolute w-100 h-100 bg-[#001D3F] rounded-full blur-3xl opacity-40"
        style={{ top: "40%", left: "50%" }}
      />

      <div
        className="absolute w-md h-112 bg-[#0a1a3a] rounded-full blur-3xl opacity-30"
        style={{ top: "20%", right: "25%" }}
      />

      <div
        className="absolute w-87 h-87 bg-[#020617] rounded-full blur-3xl opacity-30"
        style={{ bottom: "20%", left: "30%" }}
      />
    </div>
  );
}