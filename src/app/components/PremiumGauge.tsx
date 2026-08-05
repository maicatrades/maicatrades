"use client";

import { useEffect, useState } from "react";

type PremiumMarketScoreGaugeProps = {
  score: number;
  label: string;
  loading: boolean;
};

function getGaugeTheme(score: number) {
  if (score <= 30) {
    return {
      primary: "#ef4444",
      secondary: "#fb7185",
      glow: "rgba(239, 68, 68, 0.34)",
    };
  }

  if (score <= 50) {
    return {
      primary: "#f97316",
      secondary: "#fb923c",
      glow: "rgba(249, 115, 22, 0.34)",
    };
  }

  if (score <= 64) {
    return {
      primary: "#eab308",
      secondary: "#facc15",
      glow: "rgba(234, 179, 8, 0.34)",
    };
  }

  if (score <= 85) {
    return {
      primary: "#22c55e",
      secondary: "#2dd4bf",
      glow: "rgba(34, 197, 94, 0.34)",
    };
  }

  return {
    primary: "#10b981",
    secondary: "#34d399",
    glow: "rgba(16, 185, 129, 0.42)",
  };
}

export default function PremiumMarketScoreGauge({
  score,
  label,
  loading,
}: PremiumMarketScoreGaugeProps) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (loading) {
      setAnimatedScore(0);
      return;
    }

    let animationFrame = 0;
    const startValue = animatedScore;
    const difference = safeScore - startValue;
    const duration = 1100;
    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(
        Math.round(startValue + difference * easedProgress),
      );

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [safeScore, loading]);

  const theme = getGaugeTheme(animatedScore);
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - animatedScore / 100);
  const tickMarks = Array.from({ length: 40 }, (_, index) => index);

  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      <div
        className="absolute inset-6 rounded-full blur-2xl transition-colors duration-500"
        style={{ backgroundColor: theme.glow }}
      />

      <svg
        viewBox="0 0 240 240"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Market Score ${animatedScore} out of 100`}
      >
        <defs>
          <linearGradient
            id="premiumMarketScoreGradient"
            x1="25%"
            y1="10%"
            x2="80%"
            y2="90%"
          >
            <stop offset="0%" stopColor={theme.secondary} />
            <stop offset="100%" stopColor={theme.primary} />
          </linearGradient>

          <filter
            id="premiumGaugeGlow"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform="translate(120 120)">
          {tickMarks.map((tick) => {
            const angle = tick * 9;
            const isMajor = tick % 4 === 0;

            return (
              <line
                key={tick}
                x1="0"
                y1={isMajor ? -113 : -110}
                x2="0"
                y2={isMajor ? -103 : -105}
                stroke={
                  tick / 40 <= animatedScore / 100
                    ? theme.primary
                    : "#334155"
                }
                strokeWidth={isMajor ? 2.4 : 1.2}
                strokeLinecap="round"
                opacity={isMajor ? 0.9 : 0.55}
                transform={`rotate(${angle})`}
                className="transition-all duration-300"
              />
            );
          })}
        </g>

        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="rgba(5, 11, 18, 0.72)"
          stroke="#1e293b"
          strokeWidth="15"
        />

        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#premiumMarketScoreGradient)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 120 120)"
          filter="url(#premiumGaugeGlow)"
          style={{
            transition:
              "stroke-dashoffset 140ms linear, stroke 300ms ease",
          }}
        />

        <circle
          cx="120"
          cy="120"
          r="70"
          fill="none"
          stroke={theme.primary}
          strokeOpacity="0.12"
          strokeWidth="1"
        />
      </svg>

      <div className="relative z-10 text-center">
        <div className="flex items-end justify-center">
          <span className="text-7xl font-black tracking-[-0.06em] text-white tabular-nums">
            {loading ? "--" : animatedScore}
          </span>

          <span
            className="mb-2 ml-1 text-lg font-bold transition-colors duration-300"
            style={{ color: theme.primary }}
          >
            /100
          </span>
        </div>

        <p
          className="mt-1 text-lg font-bold transition-colors duration-300"
          style={{ color: theme.primary }}
        >
          {loading ? "Loading" : label}
        </p>

        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">
          {loading
            ? "Loading live data"
            : "Live market conditions"}
        </p>
      </div>
    </div>
  );
}