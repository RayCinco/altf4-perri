import "./globals.css";
import MeshGradientBackground from "@/components/MeshGradientBackground";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black text-white flex flex-col min-h-screen`}
      >
        <MeshGradientBackground />

        {children}
      </body>
    </html>
  );
}
