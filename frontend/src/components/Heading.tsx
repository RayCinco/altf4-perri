"use client";

export default function HeroHeading() {
  return (
    <section className="relative max-w-4xl mx-auto px-6 py-16 text-center">

      {/* Main Title */}
      <h1 className="text-4xl md:text-md font-bold tracking-tight text-white mb-6">
        Humanize AI Text with the{" "}
        <span className="text-[#0094c6] bg-clip-text">Most Trusted</span> AI Humanizer
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-md text-gray-400 leading-relaxed max-w-2xl mx-auto">
        Make your AI text human-sounding with Humbot! Powered by an LLM with
        billions of parameters, we help you turn robotic AI content into writing
        that sounds natural and easy to read.
      </p>
    </section>
  );
}
