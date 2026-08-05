"use client";

import { useEffect, useMemo, useState } from "react";

type MarketScoreGaugeProps = {
  score: number;
  size?: number;
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function getGaugeStyle(score: number) {
  if (score <= 24) {
    return {
      color: "#ef4444",
      glow: "rgba(239, 68, 68, 0.35)",
      label: "Bearish",
      description: "Market conditions are currently defensive.",
    };
  }

  if (score <= 44) {
    return {
      color: "#f97316",
      glow: "rgba(249, 115, 22, 0.35)",
      label: "Cautious",
      description: "Risk remains elevated and conditions are selective.",
    };
  }

  if (score <= 64) {
    return {
      color: "#eab308",
      glow: "rgba(234, 179, 8, 0.35)",
      label: "Neutral",
      description: "Market conditions are mixed and balanced.",
    };
  }

  if (score <= 79) {
    return {
      color: "#22c55e",
      glow: "rgba(34, 197, 94, 0.4)",
      label: "Bullish",
      description: "Market conditions currently favor buyers.",
    };
  }

  return {
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.45)",
    label: "Strongly Bullish",
    description: "Broad market conditions are strongly favorable.",
  };
}

export default function MarketScoreGauge({
  score,
  size = 280,
}: MarketScoreGaugeProps) {
  const finalScore = clampScore(score);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    let startTime: number | null = null;

    const duration = 1100;

    function animate(timestamp: number) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(Math.round(finalScore * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [finalScore]);

  const gaugeStyle = useMemo(
    () => getGaugeStyle(animatedScore),
    [animatedScore]
  );

  const radius = 96;
  const strokeWidth = 15;
  const center = 120;

  const arcLength = Math.PI * radius;
  const progressLength = arcLength * (animatedScore / 100);

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size * 0.64,
          filter: `drop-shadow(0 0 18px ${gaugeStyle.glow})`,
        }}
      >
        <svg
          viewBox="0 0 240 145"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`Market Score: ${animatedScore} out of 100`}
        >
          <path
            d="M 24 120 A 96 96 0 0 1 216 120"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d="M 24 120 A 96 96 0 0 1 216 120"
            fill="none"
            stroke={gaugeStyle.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${arcLength}`}
            style={{
              transition: "stroke 300ms ease",
            }}
          />

          <circle
            cx={center}
            cy="120"
            r="4"
            fill={gaugeStyle.color}
          />

          <text
            x={center}
            y="96"
            textAnchor="middle"
            fill="white"
            fontSize="42"
            fontWeight="700"
          >
            {animatedScore}
          </text>

          <text
            x={center}
            y="118"
            textAnchor="middle"
            fill="rgba(255,255,255,0.45)"
            fontSize="11"
            fontWeight="600"
            letterSpacing="2"
          >
            OUT OF 100
          </text>
        </svg>
      </div>

      <div className="-mt-2 text-center">
        <div
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color: gaugeStyle.color }}
        >
          {gaugeStyle.label}
        </div>

        <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
          {gaugeStyle.description}
        </p>
      </div>
    </div>
  );
}