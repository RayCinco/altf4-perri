import DetectorPanel from "@/components/DetectorPanel";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import HeroHeading from "@/components/Heading";

export default function Page() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <HeroHeading />

        <section className="p-6">
          <DetectorPanel />
        </section>
      </main>

      <Footer />
    </div>
  );
}