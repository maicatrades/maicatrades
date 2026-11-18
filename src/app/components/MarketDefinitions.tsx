export default function MarketDefinitions() {
  return <details className="mt-4 rounded-xl border border-slate-700 bg-[#09131d] p-4 text-sm text-slate-300">
    <summary className="cursor-pointer font-semibold text-blue-300">How to read these signals</summary>
    <dl className="mt-4 grid gap-3 md:grid-cols-2">
      <div><dt className="font-semibold">Market Backdrop Score</dt><dd>Trend (40), momentum (25), sector strength (20), volatility (15), then the frozen M122 breadth adjustment and caps. Bands: below 35 Strong Bearish; 35–49 Bearish; 50–64 Neutral; 65–79 Bullish; 80+ Strong Bullish. Pro’s “Mixed” is the 50–64 score band.</dd></div>
      <div><dt className="font-semibold">Breadth</dt><dd>Participation across the fixed M122 universe, including advances, moving averages, sector participation and RSP relative performance. Below 50 Weak; 50–64.99 Mixed; 65+ Healthy in Pro. It is separate from index direction.</dd></div>
      <div><dt className="font-semibold">Pro posture</dt><dd>Risk On: score ≥65 and breadth ≥55. Risk Off: score &lt;40 or breadth &lt;35. Otherwise Selective. This existing display rule differs from the research condition matrix; neither is a new scoring method.</dd></div>
      <div><dt className="font-semibold">Pulse and Watchlist</dt><dd>Pulse combines the regular-session move with EMA20/EMA50. Watchlist uses SMA20/SMA160 slopes, extension and RSI. A Neutral watchlist setup and Bearish session can coexist. Neutral does not mean a buy signal.</dd></div>
      <div><dt className="font-semibold">Risk and volatility</dt><dd>Risk heuristic = 100 minus Market Score plus a bounded session adjustment, capped at 0–100. It is unvalidated and is not a probability. Volatility is only one component, so Moderate volatility can coexist with elevated overall risk.</dd></div>
      <div><dt className="font-semibold">Confidence and history</dt><dd>Trade Idea confidence is an unvalidated setup heuristic out of 96, not a win probability. Fewer than 20 observations is insufficient evidence; 20–29 is limited; 30+ permits descriptive reporting only. Final records are distinguished from provisional values; gaps suppress session-change claims.</dd></div>
    </dl>
  </details>;
}
