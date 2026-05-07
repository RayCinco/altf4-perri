import { motion } from "motion/react";

interface ChismisMeterProps {
  level: number;
  classification: "fact" | "opinion" | "chismis";
  personality?: "marites" | "formal";
  reason?: string;
}

export function ChismisMeter({
  level,
  classification,
  personality = "marites",
  reason,
}: ChismisMeterProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = circumference - (level / 100) * circumference;

  const getGradient = () => {
    if (classification === "fact") return ["#22c55e", "#86efac"];
    if (classification === "opinion") return ["#f59e0b", "#fdba74"];
    return ["#054E98", "#7FB3FF"];
  };

  const getLabel = () => {
    if (personality === "formal") {
      if (level < 30) return "Reliable";
      if (level < 60) return "Unclear";
      return "Likely Chismis";
    } else {
      if (level < 30) return "Legit na Legit!";
      if (level < 60) return "Hmm... Medyo Chismis Vibes";
      return "Chismis Alert!";
    }
  };

  const getDefaultReason = () => {
    if (personality === "formal") {
      if (classification === "fact")
        return "The content is supported by consistent and verifiable information.";
      if (classification === "opinion")
        return "The content appears subjective and lacks strong supporting evidence.";
      return "The content shows signs of misinformation, exaggeration, or missing credible sources.";
    } else {
      if (classification === "fact")
        return "Legit ‘to, bes! May mga resibo at solid na sources.";
      if (classification === "opinion")
        return "Hmm, parang opinion lang—kulang sa pruweba, sis.";
      return "Grabe, puro chismis vibes! Walang matibay na ebidensya, ingat sa pag-share.";
    }
  };

  const [start, end] = getGradient();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-4">
      {/* Meter */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#0a1a3a"
            strokeWidth="16"
            fill="none"
          />

          {/* Glow */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={end}
            strokeWidth="16"
            fill="none"
            opacity={0.15}
          />

          {/* Progress */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#grad)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <defs>
            <linearGradient id="grad">
              <stop offset="0%" stopColor={start} />
              <stop offset="100%" stopColor={end} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-[#7FB3FF]"
          >
            {level}%
          </motion.div>

          <div className="text-xs text-[#7FB3FF]/70 mt-1 uppercase tracking-wide">
            Chismis Level
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-4 text-sm font-semibold text-[#7FB3FF]">
        {getLabel()}
      </div>

      {/* Reason */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-2 text-md text-[#7FB3FF]/80 max-w-xs leading-relaxed"
      >
        {reason || getDefaultReason()}
      </motion.div>
    </div>
  );
}
