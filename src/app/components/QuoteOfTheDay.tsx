const quotes = [
  "Protecting capital is part of making money.",
  "A good trade does not need to happen today.",
  "Trade the setup, not the excitement.",
  "Patience keeps you out of trades discipline gets you out of.",
  "The best opportunity is often the one you waited for.",
  "Risk is decided before the trade, not during it.",
  "Missing a trade costs nothing. Forcing one can cost plenty.",
  "Your job is not to predict every move. Your job is to manage the next one.",
  "Strong setups deserve attention. Weak setups deserve patience.",
  "Consistency beats intensity in trading.",
  "Let price confirm the story before you trade it.",
  "A stop loss is part of the plan, not proof the plan failed.",
  "When the setup disappears, the reason to stay disappears too.",
  "The market does not reward activity. It rewards good decisions.",
  "Size the trade so one loss never changes your mindset.",
  "Wait for your level. The market does not owe you an entry.",
  "Good risk management keeps you trading long enough to improve.",
  "The goal is not to catch every move. It is to catch your moves.",
  "A clear plan makes volatility easier to handle.",
  "Confidence should come from preparation, not prediction.",
  "When conditions change, your expectations should change with them.",
  "There will always be another trade.",
  "Your edge matters most when you have the discipline to wait for it.",
  "Trade what the market is showing, not what you hoped it would show.",
  "Great trades often begin with doing nothing.",
  "The entry gets attention. Risk management keeps you in the game.",
  "A watchlist creates opportunities. Patience chooses the right one.",
  "You do not need more trades. You need better trades.",
  "The market rewards preparation more consistently than prediction.",
  "Simple decisions backed by solid analysis are powerful.",
];

function getQuoteOfTheDay() {
  const now = new Date();

  // Use the calendar date to choose the quote.
  // This keeps the same quote all day and automatically
  // changes it the following day.
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const difference = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(difference / 86400000);

  return quotes[dayOfYear % quotes.length];
}

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();

  return (
    <section className="flex items-center gap-5 rounded-xl border border-slate-800 bg-[#09131d] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <span className="text-3xl text-yellow-400">★</span>

      <div>
        <p className="text-xs font-semibold uppercase text-slate-300">
          Quote of the Day
        </p>

        <p className="mt-1 text-sm text-slate-200">
          “{quote}”
        </p>

        <p className="mt-1 text-xs text-slate-500">— MaicaTrades</p>
      </div>
    </section>
  );
}