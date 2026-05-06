import "./globals.css";
import MeshGradientBackground from "@/components/MeshGradientBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import HeroHeading from "@/components/Heading";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
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

        {/* Header */}
        <Header />
        <aside>
          <Sidebar />
        </aside>
        {/* Page Content — flex-1 makes this fill the space between header and footer */}
        <main className="relative z-10 flex-1 overflow-x-hidden">
          <HeroHeading />
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
