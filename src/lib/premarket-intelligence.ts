export type PremarketTicker = {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  session: "PRE" | "REGULAR" | "AH";
  quoteTime: number | null;
  premarketHigh: number | null;
  premarketLow: number | null;
  premarketVolume: number | null;
  previousDayHigh: number | null;
  previousDayLow: number | null;
};

export type MorningState = "Risk-On" | "Mixed" | "Risk-Off";
export type Alignment = "Confirming" | "Diverging" | "Neutral";

const MAJOR_INDEXES = ["SPY", "QQQ", "IWM"];

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function analyzePremarket(
  rows: PremarketTicker[],
  environment?: {
    score: number | null;
    scoreTrend: string | null;
    breadth: number | null;
    breadthTrend: string | null;
    regime: string | null;
  },
) {
  const indexes = MAJOR_INDEXES.map((symbol) =>
    rows.find((row) => row.symbol === symbol && row.session === "PRE"),
  ).filter((row): row is PremarketTicker => Boolean(row));

  if (indexes.length !== 3) return null;

  const ordered = [...indexes].sort(
    (a, b) => b.changePercent - a.changePercent,
  );
  const strongest = ordered[0];
  const weakest = ordered[ordered.length - 1];
  const positive = indexes.filter((row) => row.changePercent > 0).length;
  const negative = indexes.filter((row) => row.changePercent < 0).length;
  const average =
    indexes.reduce((sum, row) => sum + row.changePercent, 0) / indexes.length;
  const spread = strongest.changePercent - weakest.changePercent;
  const state: MorningState =
    positive === 3 && average >= 0.15
      ? "Risk-On"
      : negative === 3 && average <= -0.15
        ? "Risk-Off"
        : "Mixed";

  const directionWord = weakest.changePercent < 0 ? "lower" : "higher";
  const broadText =
    state === "Risk-On"
      ? `${strongest.symbol} is leading major indexes higher; broad pre-market strength.`
      : state === "Risk-Off"
        ? `${weakest.symbol} is leading major indexes lower; broad pre-market weakness.`
        : `${strongest.symbol} leads while ${weakest.symbol} lags; pre-market participation is mixed.`;

  let overnightRead = broadText;
  if (spread >= 0.5) {
    overnightRead = `${strongest.symbol} is outperforming ${weakest.symbol} by ${spread.toFixed(2)} points. The ${directionWord} move is uneven rather than fully broad.`;
  }

  let alignment: Alignment = "Neutral";
  if (environment) {
    const regime = (environment.regime ?? "").toUpperCase();
    const trend = (environment.scoreTrend ?? "").toLowerCase();
    const breadthTrend = (environment.breadthTrend ?? "").toLowerCase();
    const bullishBase =
      regime.includes("RISK ON") ||
      (environment.score ?? 50) >= 65 ||
      (trend.includes("improv") && (environment.breadth ?? 50) >= 50);
    const bearishBase =
      regime.includes("RISK OFF") ||
      (environment.score ?? 50) < 40 ||
      (breadthTrend.includes("weak") && (environment.breadth ?? 50) < 50);

    if ((state === "Risk-On" && bullishBase) || (state === "Risk-Off" && bearishBase)) {
      alignment = "Confirming";
    } else if (
      (state === "Risk-On" && bearishBase) ||
      (state === "Risk-Off" && bullishBase)
    ) {
      alignment = "Diverging";
    }
  }

  const levelObservations: string[] = [];
  for (const row of indexes) {
    const distanceToHigh = row.previousDayHigh
      ? ((row.price - row.previousDayHigh) / row.previousDayHigh) * 100
      : null;
    const distanceToLow = row.previousDayLow
      ? ((row.price - row.previousDayLow) / row.previousDayLow) * 100
      : null;
    if (distanceToHigh !== null && distanceToHigh >= 0.1) {
      levelObservations.push(`${row.symbol} is above yesterday’s high.`);
    } else if (distanceToLow !== null && distanceToLow <= -0.1) {
      levelObservations.push(`${row.symbol} is below yesterday’s low.`);
    } else if (distanceToHigh !== null && Math.abs(distanceToHigh) <= 0.15) {
      levelObservations.push(`${row.symbol} is testing yesterday’s high.`);
    } else if (distanceToLow !== null && Math.abs(distanceToLow) <= 0.15) {
      levelObservations.push(`${row.symbol} is testing yesterday’s low.`);
    }
  }

  const observations = [
    broadText,
    spread >= 0.35
      ? `Leadership is uneven: ${strongest.symbol} ${signed(strongest.changePercent)} versus ${weakest.symbol} ${signed(weakest.changePercent)}.`
      : `The three major index ETFs are moving within a relatively tight ${spread.toFixed(2)}-point range.`,
    ...levelObservations.slice(0, 1),
    environment
      ? alignment === "Confirming"
        ? `Pre-market action confirms the tracked ${environment.regime?.toLowerCase() ?? "market"} regime.`
        : alignment === "Diverging"
          ? `Pre-market action contradicts the tracked ${environment.regime?.toLowerCase() ?? "market"} regime; wait for the open to resolve it.`
          : "Pre-market action is not strong enough to confirm or contradict the tracked regime."
      : "This is a current-session read and does not change the historical outlook.",
  ].slice(0, 4);

  return {
    indexes,
    state,
    alignment,
    strongest,
    weakest,
    average,
    spread,
    summary: broadText,
    overnightRead,
    observations,
    timestamp: Math.max(...indexes.map((row) => row.quoteTime ?? 0)),
  };
}
