import DetectorPanel from "@/components/DetectorPanel";
import HeroHeading from "@/components/Heading";
import DetectorBottomShowcase from "@/components/DetectorBottomShowcase";
export default function Page() {
  return (
    <>
      <HeroHeading />
      <main className="p-6">
        <DetectorPanel />
        <DetectorBottomShowcase />
      </main>
    </>
  );
}
