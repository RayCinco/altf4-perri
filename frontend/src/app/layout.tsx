import "./globals.css";
import MeshGradientBackground from "@/components/MeshGradientBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import HeroHeading  from "@/components/Heading";
import { Afacad } from "next/font/google";

const afacad = Afacad({ subsets: ["latin"] });

export const metadata = {
  icons: {
    icon: "/Perri.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${afacad.className} relative bg-black text-white`} suppressHydrationWarning={true}>
        <MeshGradientBackground />

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
