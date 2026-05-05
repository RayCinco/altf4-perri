import { motion } from 'motion/react';

interface ChismisMeterProps {
  level: number;
  classification: 'fact' | 'opinion' | 'chismis';
  personality?: 'marites' | 'formal';
}

export function ChismisMeter({ level, classification, personality = 'marites' }: ChismisMeterProps) {
  const getColor = () => {
    if (classification === 'fact') return 'from-green-500 to-emerald-500';
    if (classification === 'opinion') return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-700';
  };

  const getLabel = () => {
    if (personality === 'formal') {
      if (level < 30) return 'High Credibility';
      if (level < 60) return 'Mixed Credibility';
      return 'Low Credibility';
    } else {
      if (level < 30) return 'Low Chismis';
      if (level < 60) return 'Medium Chismis';
      return 'HIGH CHISMIS';
    }
  };

  const getEmoji = () => {
    if (personality === 'formal') {
      if (classification === 'fact') return '✅';
      if (classification === 'opinion') return '⚖️';
      return '⚠️';
    } else {
      if (classification === 'fact') return '✅';
      if (classification === 'opinion') return '🤔';
      return '🫖';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">{getEmoji()}</div>
        <h3 className="text-xl font-bold text-gray-800">
          {personality === 'formal' ? 'Credibility Meter' : 'Chismis Meter'}
        </h3>
      </div>

      <div className="relative h-40 flex items-end justify-center">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Colored arc based on level */}
          <motion.path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${(level / 100) * 251.2} 251.2`}
            initial={{ strokeDasharray: '0 251.2' }}
            animate={{ strokeDasharray: `${(level / 100) * 251.2} 251.2` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`stop-color-${classification}`} stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: (level / 100) * 180 - 90 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transformOrigin: '100px 90px' }}
          >
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="90" r="6" fill="#1f2937" />
          </motion.g>
        </svg>
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-center mt-4"
      >
        <div className={`text-4xl font-bold bg-linear-to-r ${getColor()} bg-clip-text text-transparent mb-2`}>
          {level}%
        </div>
        <div className="text-gray-600 font-semibold">{getLabel()}</div>
      </motion.div>
    </div>
  );
}
