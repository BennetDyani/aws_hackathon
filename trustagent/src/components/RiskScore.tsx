'use client';

import { RiskLevel } from '@/lib/types';

interface RiskScoreProps {
  score: number | null;
  level: RiskLevel | null;
  size?: 'sm' | 'lg';
}

const levelColors: Record<string, string> = {
  LOW: 'text-green-600 bg-green-50 border-green-200',
  MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
  CRITICAL: 'text-red-600 bg-red-50 border-red-200',
};

const levelBgRing: Record<string, string> = {
  LOW: 'stroke-green-500',
  MEDIUM: 'stroke-yellow-500',
  HIGH: 'stroke-orange-500',
  CRITICAL: 'stroke-red-500',
};

export default function RiskScore({ score, level, size = 'lg' }: RiskScoreProps) {
  if (score === null || level === null) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-400 text-sm">Risk assessment pending...</div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const isLarge = size === 'lg';

  return (
    <div className={`flex flex-col items-center ${isLarge ? 'gap-3' : 'gap-1'}`}>
      <div className={`relative ${isLarge ? 'w-32 h-32' : 'w-16 h-16'}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className={levelBgRing[level]}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${isLarge ? 'text-2xl' : 'text-sm'} ${levelColors[level].split(' ')[0]}`}>
            {score}
          </span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${levelColors[level]}`}>
        {level}
      </div>
    </div>
  );
}
