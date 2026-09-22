export type Status = "Bullish" | "Neutral" | "Watch" | "Low";

export type MarketPulseItem = {
  symbol: string;
  status: Status;
  change: string;
  description: string;
  positive: boolean;
};

export type TradeIdeaData = {
  symbol: string;
  companyName: string;
  price: number;
  changePercent: number;
  setup: string;
  setupType: string;
  entry: number;
  stopLoss: number;
  target: number;
  confidence: number;
  tradeBias: string;
  patternDescription: string;
  biasDescription: string;
  whyItMatters: string[];
  managementPlan: string[];
  updatedLabel: string;
};

export const currentTradeIdea: TradeIdeaData = {
  symbol: "AAPL",
  companyName: "Apple inc",
  price: 323.89,
  changePercent: 3.85,
  setup: "High Tight Flag",
  setupType: "Breakout play",
  entry: 320.5,
  stopLoss: 315.5,
  target: 345.3,
  confidence: 5,
  tradeBias: "Bullish",
  patternDescription:
    "A continuation setup forming near recent highs after a strong upward move.",
  biasDescription:
    "The setup remains constructive while price holds above support and confirms through resistance.",
  whyItMatters: [
    "NVDA is consolidating near recent highs following a strong move. A confirmed breakout above resistance could signal continued momentum, while a failure to hold support would weaken the setup.",
    "The main factors to monitor are market direction, semiconductor sector strength, volume confirmation, and whether the breakout can hold after the initial move.",
  ],
  managementPlan: [
    "Wait for a confirmed move above the entry level rather than anticipating the breakout.",
    "Avoid increasing position size if the broader market begins weakening.",
    "Consider reducing risk if price fails to hold the breakout level after entry.",
  ],
  updatedLabel: "Updated daily",
};

export const marketPulse: MarketPulseItem[] = [
  {
    symbol: "SPY",
    status: "Bullish",
    change: "+0.68%",
    description: "Price > 20 EMA > 50 EMA",
    positive: true,
  },
  {
    symbol: "QQQ",
    status: "Bullish",
    change: "+1.12%",
    description: "Strong momentum",
    positive: true,
  },
  {
    symbol: "IWM",
    status: "Neutral",
    change: "+0.15%",
    description: "Choppy, below 50 EMA",
    positive: true,
  },
  {
    symbol: "VIX",
    status: "Low",
    change: "-3.21%",
    description: "Volatility decreasing",
    positive: false,
  },
];

export const movers = [
  {
    symbol: "SMCI",
    company: "Super Micro Computer",
    change: "+12.45%",
  },
  {
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    change: "+5.82%",
  },
  {
    symbol: "ARM",
    company: "ARM Holdings",
    change: "+4.21%",
  },
  {
    symbol: "TSM",
    company: "Taiwan Semiconductor",
    change: "+3.91%",
  },
  {
    symbol: "MU",
    company: "Micron Technology",
    change: "+3.67%",
  },
];

export type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  previous: string;
  forecast: string;
  actual: string;
  description: string;
};

export const calendarEvents: CalendarEvent[] = [
  {
    id: "2026-08-11-nfib-small-business-optimism",
    date: "Tuesday",
    time: "6:00 AM",
    title: "NFIB Small Business Optimism",
    category: "Business Activity",
    impact: "Medium",
    previous: "97.4",
    forecast: "97",
    actual: "99.8",
    description:
      "Measures confidence among U.S. small businesses and provides insight into hiring, investment, and broader business conditions.",
  },
  {
    id: "2026-08-11-existing-home-sales",
    date: "Tuesday",
    time: "10:00 AM",
    title: "Existing Home Sales",
    category: "Housing",
    impact: "Medium",
    previous: "4.1M",
    forecast: "4.0M",
    actual: "4.1M",
    description:
      "Measures completed sales of existing U.S. homes and provides insight into housing-market activity and consumer demand.",
  },
  {
    id: "2026-08-12-cpi-monthly",
    date: "Wednesday",
    time: "8:30 AM",
    title: "CPI, M/M",
    category: "Inflation",
    impact: "High",
    previous: "-0.4%",
    forecast: "0.1%",
    actual: "0.1%",
    description:
      "Measures the monthly change in consumer prices and is one of the most closely watched indicators of U.S. inflation.",
  },
  {
    id: "2026-08-12-core-cpi-monthly",
    date: "Wednesday",
    time: "8:30 AM",
    title: "Core CPI, M/M",
    category: "Inflation",
    impact: "High",
    previous: "0%",
    forecast: "0.2%",
    actual: "0.2%",
    description:
      "Measures monthly consumer-price inflation excluding food and energy, providing a clearer view of underlying inflation pressure.",
  },
  {
    id: "2026-08-12-cpi-yearly",
    date: "Wednesday",
    time: "8:30 AM",
    title: "CPI, Y/Y",
    category: "Inflation",
    impact: "High",
    previous: "3.5%",
    forecast: "3.4%",
    actual: "3.4%",
    description:
      "Measures the annual change in consumer prices and is closely watched for its potential impact on Federal Reserve policy.",
  },
  {
    id: "2026-08-12-core-cpi-yearly",
    date: "Wednesday",
    time: "8:30 AM",
    title: "Core CPI, Y/Y",
    category: "Inflation",
    impact: "High",
    previous: "2.6%",
    forecast: "2.5%",
    actual: "2.5%",
    description:
      "Measures annual underlying inflation after excluding volatile food and energy prices.",
  },
  {
    id: "2026-08-13-jobless-claims",
    date: "Thursday",
    time: "8:30 AM",
    title: "Weekly Jobless Claims",
    category: "Employment",
    impact: "Medium",
    previous: "199K",
    forecast: "204K",
    actual: "209K",
    description:
      "Measures the number of people filing for unemployment benefits for the first time and provides a timely view of labor-market conditions.",
  },
  {
    id: "2026-08-13-ppi",
    date: "Thursday",
    time: "8:30 AM",
    title: "PPI, M/M",
    category: "Inflation",
    impact: "High",
    previous: "-0.3%",
    forecast: "0.2%",
    actual: "0%",
    description:
      "Measures monthly changes in prices received by U.S. producers and can provide an early indication of inflation pressure.",
  },
  {
    id: "2026-08-13-core-ppi",
    date: "Thursday",
    time: "8:30 AM",
    title: "Core PPI, M/M",
    category: "Inflation",
    impact: "High",
    previous: "0.2%",
    forecast: "0.3%",
    actual: "0.2%",
    description:
      "Measures producer-price inflation excluding food and energy and provides insight into underlying wholesale inflation pressure.",
  },
  {
    id: "2026-08-14-retail-sales",
    date: "Friday",
    time: "8:30 AM",
    title: "Retail Sales",
    category: "Consumer Activity",
    impact: "High",
    previous: "0.2%",
    forecast: "0.1%",
    actual: "Pending",
    description:
      "Measures changes in U.S. retail spending and provides an important indication of consumer demand and economic momentum.",
  },
  {
    id: "2026-08-14-michigan-consumer-sentiment",
    date: "Friday",
    time: "10:00 AM",
    title: "Michigan Consumer Sentiment — Preliminary",
    category: "Consumer Activity",
    impact: "Medium",
    previous: "54.4",
    forecast: "54.5",
    actual: "Pending",
    description:
      "Measures consumer confidence and expectations and can provide insight into household spending and inflation sentiment.",
  },
];

export type WatchingItem = {
  symbol: string;
  color: "emerald" | "violet" | "yellow" | "blue";
  commentary: string;
};

export const whatImWatching: WatchingItem[] = [
  {
    symbol: "NVDA",
    color: "emerald",
    commentary:
      "Holding the 20 EMA and consolidating near resistance. Watching for a breakout above $915.",
  },
  {
    symbol: "QQQ",
    color: "violet",
    commentary:
      "Breaking resistance on strong volume. Technology leadership remains intact.",
  },
  {
    symbol: "CPI",
    color: "yellow",
    commentary:
      "Tomorrow at 8:30 AM ET — expect volatility. Avoid getting overly aggressive.",
  },
  {
    symbol: "AI",
    color: "blue",
    commentary:
      "Stocks continue leading. Strength is broad, not only in NVDA.",
  },
];