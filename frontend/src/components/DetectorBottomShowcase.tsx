"use client";

import Image from "next/image";

const factLetters = [
  { char: "f", cls: "bg-[#7a68d6] text-[#001D3F]" },
  { char: "a", cls: "bg-[#f3c63f] text-[#001D3F]" },
  { char: "c", cls: "bg-[#f8dd68] text-[#001D3F]" },
  { char: "t", cls: "bg-[#ef3c96] text-white" },
];

const fakeLetters = [
  { char: "F", cls: "bg-[#1b91ff] text-[#001D3F]" },
  { char: "a", cls: "bg-[#8ad4da] text-[#001D3F]" },
  { char: "k", cls: "bg-[#88df8a] text-[#001D3F]" },
  { char: "e", cls: "bg-[#f2a6b2] text-[#001D3F]" },
];

function CollageWord({
  letters,
}: {
  letters: Array<{ char: string; cls: string }>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {letters.map((item, index) => (
        <span
          key={`${item.char}-${index}`}
          className={`inline-flex h-11 w-10 items-center justify-center rounded-sm text-4xl font-black lowercase leading-none shadow-sm ${item.cls}`}
          style={{ transform: `rotate(${index % 2 === 0 ? -3 : 2}deg)` }}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
}

export default function DetectorBottomShowcase() {
  return (
    <section className="relative mx-auto mt-16 w-full max-w-5xl rounded-[26px] border border-[#054E98] bg-[#00133A]/95 p-5 md:mt-20 md:p-8">
      <div className="pointer-events-none absolute -top-12 right-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white/80 bg-[#001D3F] shadow-lg md:h-32 md:w-32">
        <Image
          src="/Perri.png"
          alt="Perri avatar"
          fill
          sizes="(max-width: 768px) 96px, 128px"
          className="object-cover object-left scale-x-[-1]"
          priority
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        <div className="space-y-6">
          <CollageWord letters={factLetters} />

          <div className="relative mx-auto h-48 w-full max-w-[280px] overflow-hidden rounded-md border border-[#054E98]/50 bg-[#000919]">
            <Image
              src="/gossip.png"
              alt="Truth analysis visual"
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-cover grayscale contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#000919]/70 via-transparent to-[#000919]/80" />
          </div>

          <CollageWord letters={fakeLetters} />
        </div>

        <div className="flex items-start pt-10 md:pt-18">
          <div className="max-w-xl text-right">
            <h3 className="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              How Perri helps
            </h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-100 md:text-base lg:text-lg">
              Perri helps you separate facts from fake narratives by analyzing
              text, links, and images. Smart Mode gives clear evidence-based
              insights, while Chismis Mode turns the breakdown into a fun style
              that still builds media literacy and critical thinking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
