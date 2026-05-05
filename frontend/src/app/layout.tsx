import "./globals.css";
import MeshGradientBackground from "@/components/MeshGradientBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import HeroHeading  from "@/components/Heading";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative bg-black text-white`}>
        <MeshGradientBackground />

        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="relative z-10">
          <HeroHeading />
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
