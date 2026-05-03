import "./globals.css";
import { Header } from "@/components/Header";
import { Google_Sans } from "next/font/google";

const sans = Google_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "ChismiScan",
  description: "Gossip Analyzer & Fake News Detector",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sans.className} bg-linear-to-br from-red-50 via-orange-50 to-yellow-50 min-h-screen`}>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </main>
        <footer className="text-center py-6 text-sm text-gray-500">
          <p>ChismiScan v1.0 - Powered by AltF4</p>
        </footer>
      </body>
    </html>
  );
}
