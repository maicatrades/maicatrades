export function explainBackdrop(score: number, breadth: number | null, sameDate: boolean) {
  if (breadth == null || !sameDate) return 'The score combines index trend, momentum, sector strength and volatility. Same-session breadth confirmation is unavailable.';
  if (score < 50 && breadth >= 65) return 'The market backdrop remains bearish while M122 participation is healthier. Daily participation and multi-day index conditions measure different dimensions; broader participation alone does not confirm a trend reversal.';
  if (score >= 65 && breadth < 50) return 'The market backdrop is bullish but M122 participation is weak. The headline score and breadth are separate measurements; monitor whether participation improves.';
  return 'The market score measures the combined backdrop; M122 breadth measures participation. Use both alongside each instrument’s setup and session direction.';
}
