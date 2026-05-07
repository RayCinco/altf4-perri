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
    <>
      <section className="relative mx-auto mt-16 w-full max-w-5xl rounded-2xl border border-[#04356A] bg-[#000919] p-5 md:mt-20 md:p-8">
        <div className="pointer-events-none absolute -top-12 right-6 h-24 w-24 overflow-hidden rounded-full border-4 border-[#04356A] bg-[#001D3F] shadow-lg md:h-32 md:w-32">
          <Image
            src="/logo/Perri.png"
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

            <div className="relative mx-auto h-48 w-full max-w-[280px] overflow-hidden rounded-md border border-[#04356A] bg-[#001D3F]">
              <Image
                src="/showcase/gossip.png"
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
              <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
                How Perri helps
              </h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-gray-400 md:text-base lg:text-lg">
                Perri helps you separate facts from fake narratives by analyzing
                text, links, and images.{" "}
                <span className="text-[#54A9FF]">Formal Mode</span> gives clear
                evidence-based insights, while{" "}
                <span className="text-[#54A9FF]">Perri Mode</span> turns the
                breakdown into a fun style that still builds media literacy and
                critical thinking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Duplicate below with avatar on left and image on right */}
      <section className="relative mx-auto mt-20 mb-12 w-full max-w-5xl rounded-2xl border border-[#04356A] bg-[#000919] p-6 md:mt-24 md:mb-16 md:p-8">
        <div className="pointer-events-none absolute -top-12 left-6 h-24 w-24 overflow-hidden rounded-full border-4 border-[#04356A] bg-[#001D3F] shadow-lg md:h-32 md:w-32">
          <Image
            src="/logo/Perri.png"
            alt="Perri avatar"
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover object-left"
            priority
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <div className="flex items-start pt-12 pb-4 md:pt-18 md:pb-6">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
                How to use the system
              </h3>
              <ol className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-gray-400 md:text-base lg:text-lg">
                <li>
                  1. Choose mode{" "}
                  <span className="text-[#54A9FF]">Perri Mode</span> or{" "}
                  <span className="text-[#54A9FF]">Formal Mode</span>.
                </li>
                <li>2. Paste or upload the url, image and text.</li>
                <li>3. Read the result and check the reason why.</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end items-center">
            <div className="relative mx-auto h-48 w-full max-w-[320px] overflow-hidden rounded-md border border-[#04356A] bg-[#001D3F]">
              <Image
                src="/showcase/how.png"
                alt="Truth analysis visual"
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover grayscale contrast-125 brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-[#000919]/70 via-transparent to-[#000919]/80" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-20 mb-20 w-full max-w-5xl rounded-2xl border border-[#04356A] bg-[#000919] p-8 md:mt-24 md:mb-24 md:p-10">
        <div className="pointer-events-none absolute -top-12 right-6 h-24 w-24 overflow-hidden rounded-full border-4 border-[#04356A] bg-[#001D3F] shadow-lg md:h-32 md:w-32">
          <Image
            src="/logo/Perri.png"
            alt="Perri avatar"
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover object-left scale-x-[-1]"
            priority
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
          <div className="flex items-center justify-start">
            <div className="w-full max-w-[320px] rounded-2xl border border-[#04356A] bg-[#001D3F]/50 p-6 text-center shadow-lg md:p-8">
              <div className="text-6xl font-bold tracking-tight text-[#f8dd68] md:text-7xl">
                86%
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Users Exposed to Misinformation
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
              Fake news rate
            </h3>
            <p className="text-sm font-medium leading-relaxed text-gray-400 md:text-base lg:text-lg">
              Fake news is a significant global concern, with 86% of internet
              users reporting exposure to false information and a similar
              percentage having believed it at least once.
            </p>
            <a
              href="https://www.ipsos.com/en-us/news-polls/cigi-fake-news-global-epidemic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors underline underline-offset-4"
            >
              Source: Ipsos CIGI Fake News Global Epidemic
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
