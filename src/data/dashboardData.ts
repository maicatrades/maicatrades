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
    id: "2026-08-03-us-manufacturing-pmi",
    date: "Monday",
    time: "9:45 AM",
    title: "U.S. Manufacturing PMI",
    category: "Manufacturing",
    impact: "Medium",
    previous: "53.9",
    forecast: "—",
    actual: "53.9",
    description:
      "Measures business activity in the U.S. manufacturing sector. Readings above 50 indicate expansion.",
  },
  {
    id: "2026-08-03-ism-manufacturing-pmi",
    date: "Monday",
    time: "10:00 AM",
    title: "ISM Manufacturing PMI",
    category: "Manufacturing",
    impact: "High",
    previous: "53.3",
    forecast: "54.0",
    actual: "55.6",
    description:
      "Tracks manufacturing activity, new orders, employment, production, and supplier deliveries across the U.S. economy.",
  },
  {
    id: "2026-08-03-construction-spending",
    date: "Monday",
    time: "10:00 AM",
    title: "Construction Spending",
    category: "Housing and Construction",
    impact: "Medium",
    previous: "0.1%",
    forecast: "0.3%",
    actual: "-0.1%",
    description:
      "Measures monthly changes in total spending on residential, commercial, and public construction projects.",
  },
  {
    id: "2026-08-04-trade-balance",
    date: "Tuesday",
    time: "8:30 AM",
    title: "U.S. Trade Balance",
    category: "International Trade",
    impact: "Medium",
    previous: "-$77.6B",
    forecast: "-$73.0B",
    actual: "Pending",
    description:
      "Measures the difference between the value of U.S. exports and imports of goods and services.",
  },
  {
    id: "2026-08-04-jolts",
    date: "Tuesday",
    time: "10:00 AM",
    title: "JOLTS Job Openings",
    category: "Employment",
    impact: "High",
    previous: "7.6M",
    forecast: "7.5M",
    actual: "Pending",
    description:
      "Measures available job openings and provides insight into labor-market demand.",
  },
  {
    id: "2026-08-04-factory-orders",
    date: "Tuesday",
    time: "10:00 AM",
    title: "Factory Orders",
    category: "Manufacturing",
    impact: "Medium",
    previous: "-1.3%",
    forecast: "0.3%",
    actual: "Pending",
    description:
      "Measures changes in new purchase orders placed with U.S. manufacturers.",
  },
  {
    id: "2026-08-04-schmid-speech",
    date: "Tuesday",
    time: "TBA",
    title: "Kansas City Fed President Jeffrey Schmid Speaks",
    category: "Federal Reserve",
    impact: "Medium",
    previous: "—",
    forecast: "—",
    actual: "Pending",
    description:
      "Federal Reserve commentary may influence expectations for monetary policy and interest rates.",
  },
  {
    id: "2026-08-05-adp-employment",
    date: "Wednesday",
    time: "8:15 AM",
    title: "ADP Employment Report",
    category: "Employment",
    impact: "High",
    previous: "98K",
    forecast: "75K",
    actual: "Pending",
    description:
      "Estimates monthly changes in private-sector employment ahead of the government employment report.",
  },
  {
    id: "2026-08-05-us-services-pmi",
    date: "Wednesday",
    time: "9:45 AM",
    title: "U.S. Services PMI",
    category: "Services",
    impact: "Medium",
    previous: "51.2",
    forecast: "—",
    actual: "Pending",
    description:
      "Measures business activity in the U.S. services sector. Readings above 50 indicate expansion.",
  },
  {
    id: "2026-08-05-ism-services-pmi",
    date: "Wednesday",
    time: "10:00 AM",
    title: "ISM Services PMI",
    category: "Services",
    impact: "High",
    previous: "54.0",
    forecast: "54.4",
    actual: "Pending",
    description:
      "Tracks activity, new orders, employment, and prices across the U.S. services economy.",
  },
  {
    id: "2026-08-05-cook-speech",
    date: "Wednesday",
    time: "4:05 PM",
    title: "Federal Reserve Governor Lisa Cook Speaks",
    category: "Federal Reserve",
    impact: "Medium",
    previous: "—",
    forecast: "—",
    actual: "Pending",
    description:
      "Federal Reserve commentary may affect expectations for inflation, interest rates, and monetary policy.",
  },
  {
    id: "2026-08-06-productivity-costs",
    date: "Thursday",
    time: "8:30 AM",
    title: "Preliminary Productivity and Costs",
    category: "Labor and Inflation",
    impact: "Medium",
    previous: "0.8%",
    forecast: "0.7%",
    actual: "Pending",
    description:
      "Measures changes in worker productivity and labor costs, which may influence the inflation outlook.",
  },
  {
    id: "2026-08-06-jobless-claims",
    date: "Thursday",
    time: "8:30 AM",
    title: "Weekly Jobless Claims",
    category: "Employment",
    impact: "Medium",
    previous: "197K",
    forecast: "200K",
    actual: "Pending",
    description:
      "Measures the number of people filing for unemployment benefits for the first time.",
  },
  {
    id: "2026-08-06-wholesale-trade",
    date: "Thursday",
    time: "10:00 AM",
    title: "Monthly Wholesale Trade",
    category: "Business Activity",
    impact: "Low",
    previous: "0.1%",
    forecast: "—",
    actual: "Pending",
    description:
      "Tracks changes in wholesale inventories and sales across the U.S. economy.",
  },
  {
    id: "2026-08-07-employment-report",
    date: "Friday",
    time: "8:30 AM",
    title: "Employment Report",
    category: "Employment",
    impact: "High",
    previous: "57K",
    forecast: "85K",
    actual: "Pending",
    description:
      "Measures monthly job growth and is one of the most closely watched indicators of labor-market strength.",
  },
  {
    id: "2026-08-07-unemployment-rate",
    date: "Friday",
    time: "8:30 AM",
    title: "Unemployment Rate",
    category: "Employment",
    impact: "High",
    previous: "4.2%",
    forecast: "4.3%",
    actual: "Pending",
    description:
      "Measures the percentage of the labor force that is unemployed and actively seeking work.",
  },
  {
    id: "2026-08-07-average-hourly-earnings-monthly",
    date: "Friday",
    time: "8:30 AM",
    title: "Average Hourly Earnings, M/M",
    category: "Employment and Inflation",
    impact: "High",
    previous: "0.3%",
    forecast: "0.3%",
    actual: "Pending",
    description:
      "Measures monthly wage growth and provides insight into labor costs and inflation pressure.",
  },
  {
    id: "2026-08-07-average-hourly-earnings-yearly",
    date: "Friday",
    time: "8:30 AM",
    title: "Average Hourly Earnings, Y/Y",
    category: "Employment and Inflation",
    impact: "High",
    previous: "3.5%",
    forecast: "—",
    actual: "Pending",
    description:
      "Measures annual wage growth and longer-term labor-related inflation pressure.",
  },
  {
    id: "2026-08-07-barkin-speech",
    date: "Friday",
    time: "10:00 AM",
    title: "Richmond Fed President Thomas Barkin Speaks",
    category: "Federal Reserve",
    impact: "Medium",
    previous: "—",
    forecast: "—",
    actual: "Pending",
    description:
      "Comments from a Federal Reserve official may affect expectations for interest rates and monetary policy.",
  },
  {
    id: "2026-08-07-consumer-credit",
    date: "Friday",
    time: "3:00 PM",
    title: "Consumer Credit",
    category: "Consumer Activity",
    impact: "Low",
    previous: "-$0.2B",
    forecast: "$12.0B",
    actual: "Pending",
    description:
      "Measures changes in outstanding consumer borrowing, including credit cards and non-revolving credit.",
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