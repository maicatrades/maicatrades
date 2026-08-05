export type EconomicEventTemplate = {
  id: string;
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  defaultTime: string;
  description: string;
};

export const economicEventTemplates = {
  CPI: {
    id: "cpi-yoy",
    title: "CPI (YoY)",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures the year-over-year change in consumer prices and is one of the market's most closely watched inflation indicators.",
  },

  CORE_CPI: {
    id: "core-cpi-yoy",
    title: "Core CPI (YoY)",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Tracks consumer-price changes excluding food and energy, helping traders evaluate underlying inflation pressure.",
  },

  PPI: {
    id: "ppi-yoy",
    title: "PPI (YoY)",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures changes in prices received by producers and can provide an early indication of inflation pressure.",
  },

  CORE_PPI: {
    id: "core-ppi-yoy",
    title: "Core PPI (YoY)",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Tracks producer-price changes excluding food and energy to help identify underlying wholesale inflation trends.",
  },

  FOMC_RATE_DECISION: {
    id: "fomc-rate-decision",
    title: "FOMC Rate Decision",
    category: "Federal Reserve",
    impact: "High",
    defaultTime: "2:00 PM",
    description:
      "The Federal Reserve announces its interest-rate decision and provides guidance that can affect stocks, bonds, currencies, and volatility.",
  },

  FOMC_PRESS_CONFERENCE: {
    id: "fomc-press-conference",
    title: "FOMC Press Conference",
    category: "Federal Reserve",
    impact: "High",
    defaultTime: "2:30 PM",
    description:
      "The Federal Reserve chair discusses monetary policy, inflation, economic growth, and the outlook for interest rates.",
  },

  FOMC_MINUTES: {
    id: "fomc-minutes",
    title: "FOMC Meeting Minutes",
    category: "Federal Reserve",
    impact: "High",
    defaultTime: "2:00 PM",
    description:
      "Provides detailed insight into Federal Reserve discussions, policy concerns, and the outlook for interest rates.",
  },

  ADP_EMPLOYMENT: {
    id: "adp-employment-change",
    title: "ADP Employment Change",
    category: "Employment",
    impact: "Medium",
    defaultTime: "8:15 AM",
    description:
      "Estimates monthly changes in private-sector employment ahead of the official government jobs report.",
  },

  NONFARM_PAYROLLS: {
    id: "nonfarm-payrolls",
    title: "Nonfarm Payrolls",
    category: "Employment",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures monthly changes in U.S. employment and is one of the most influential reports for interest-rate expectations and market direction.",
  },

  UNEMPLOYMENT_RATE: {
    id: "unemployment-rate",
    title: "Unemployment Rate",
    category: "Employment",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures the percentage of the labor force that is unemployed and actively seeking work.",
  },

  AVERAGE_HOURLY_EARNINGS: {
    id: "average-hourly-earnings",
    title: "Average Hourly Earnings",
    category: "Employment",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Tracks wage growth and can influence inflation expectations and Federal Reserve policy.",
  },

  INITIAL_JOBLESS_CLAIMS: {
    id: "initial-jobless-claims",
    title: "Initial Jobless Claims",
    category: "Employment",
    impact: "Medium",
    defaultTime: "8:30 AM",
    description:
      "Measures the number of people filing for unemployment benefits for the first time during the previous week.",
  },

  GDP: {
    id: "gdp-quarterly",
    title: "GDP (QoQ)",
    category: "Economic Growth",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures the annualized quarterly change in the value of goods and services produced by the U.S. economy.",
  },

  RETAIL_SALES: {
    id: "retail-sales-mom",
    title: "Retail Sales (MoM)",
    category: "Consumer",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures monthly changes in consumer spending and provides insight into economic demand and growth.",
  },

  PCE_INFLATION: {
    id: "pce-price-index",
    title: "PCE Price Index",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Measures changes in consumer prices and is a key inflation indicator monitored by the Federal Reserve.",
  },

  CORE_PCE: {
    id: "core-pce-price-index",
    title: "Core PCE Price Index",
    category: "Inflation",
    impact: "High",
    defaultTime: "8:30 AM",
    description:
      "Tracks consumer-price changes excluding food and energy and is one of the Federal Reserve's preferred inflation measures.",
  },
} satisfies Record<string, EconomicEventTemplate>;