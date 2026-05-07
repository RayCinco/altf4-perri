import DetectorPanel from "@/components/DetectorPanel";
import HeroHeading from "@/components/Heading";

export default function Page() {
  return (
    <>
      <HeroHeading />
      <main className="p-6">
        <DetectorPanel />
      </main>
    </>
  );
}
