const SYMBOLS = {
  spy: "SPY",
  qqq: "QQQ",
  vix: "^VIX",
  sectors: [
    "XLK", // Technology
    "XLC", // Communication Services
    "XLY", // Consumer Discretionary
    "XLF", // Financials
    "XLI", // Industrials
    "XLE", // Energy
    "XLV", // Healthcare
    "XLP", // Consumer Staples
    "XLU", // Utilities
    "XLRE", // Real Estate
    "XLB", // Materials
  ],
};

const GROWTH_SECTORS = ["XLK", "XLC", "XLY"];
const DEFENSIVE_SECTORS = ["XLP", "XLV", "XLU"];
function isValidNumber(value         )                  {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value        , decimals = 2) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function clamp(value        , minimum        , maximum        ) {
  return Math.min(Math.max(value, minimum), maximum);
}

function average(values          ) {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function percentChange(current        , previous        ) {
  if (
    !isValidNumber(current) ||
    !isValidNumber(previous) ||
    previous === 0
  ) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

function simpleMovingAverage(series          , length        ) {
  if (series.length < length) {
    return null;
  }

  return average(series.slice(-length));
}

function getReturn(series          , tradingDays        ) {
  if (series.length <= tradingDays) {
    return 0;
  }

  const current = series[series.length - 1];
  const previous = series[series.length - 1 - tradingDays];

  return percentChange(current, previous);
}

function scoreIndexTrend(data            ) {
  const sma20 = simpleMovingAverage(data.series, 20);
  const sma50 = simpleMovingAverage(data.series, 50);

  if (sma20 === null || sma50 === null) {
    throw new Error(
      `Unable to calculate moving averages for ${data.symbol}.`,
    );
  }

  let score = 0;

  // Price above short-term trend: 8 points
  if (data.price > sma20) {
    score += 8;
  } else if (data.price >= sma20 * 0.99) {
    // Within 1% of the 20-day average: partial credit
    score += 4;
  }

  // Price above intermediate trend: 8 points
  if (data.price > sma50) {
    score += 8;
  } else if (data.price >= sma50 * 0.99) {
    score += 4;
  }

  // Short-term average above intermediate average: 4 points
  if (sma20 > sma50) {
    score += 4;
  } else if (sma20 >= sma50 * 0.995) {
    score += 2;
  }

  return {
    symbol: data.symbol,
    score,
    maxScore: 20,
    price: round(data.price),
    sma20: round(sma20),
    sma50: round(sma50),
    aboveSma20: data.price > sma20,
    aboveSma50: data.price > sma50,
    bullishAverageAlignment: sma20 > sma50,
  };
}

function calculateTrendScore(
  spy            ,
  qqq            ,
) {
  const spyTrend = scoreIndexTrend(spy);
  const qqqTrend = scoreIndexTrend(qqq);

  return {
    score: spyTrend.score + qqqTrend.score,
    maxScore: 40,
    details: {
      spy: spyTrend,
      qqq: qqqTrend,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Momentum: 25 points                                                        */
/* -------------------------------------------------------------------------- */

function scoreOneDayReturn(value        ) {
  if (value >= 1) return 2;
  if (value > 0) return 1.5;
  if (value >= -0.75) return 1;
  if (value >= -1.5) return 0.5;

  return 0;
}

function scoreFiveDayReturn(value        ) {
  if (value >= 2) return 4;
  if (value >= 0.5) return 3;
  if (value > 0) return 2.5;
  if (value >= -1.5) return 1.5;
  if (value >= -3) return 0.5;

  return 0;
}

function scoreTenDayReturn(value        ) {
  if (value >= 3) return 3;
  if (value >= 1) return 2.5;
  if (value > 0) return 2;
  if (value >= -2) return 1;

  return 0;
}

function scoreTwentyDayReturn(value        ) {
  if (value >= 5) return 3;
  if (value >= 2) return 2.5;
  if (value > 0) return 2;
  if (value >= -3) return 1;

  return 0;
}

function scoreIndexMomentum(data            ) {
  const oneDayReturn = getReturn(data.series, 1);
  const fiveDayReturn = getReturn(data.series, 5);
  const tenDayReturn = getReturn(data.series, 10);
  const twentyDayReturn = getReturn(data.series, 20);

  const oneDayScore = scoreOneDayReturn(oneDayReturn);
  const fiveDayScore = scoreFiveDayReturn(fiveDayReturn);
  const tenDayScore = scoreTenDayReturn(tenDayReturn);
  const twentyDayScore =
    scoreTwentyDayReturn(twentyDayReturn);

  const score =
    oneDayScore +
    fiveDayScore +
    tenDayScore +
    twentyDayScore;

  return {
    symbol: data.symbol,
    score: round(score),
    maxScore: 12,
    returns: {
      oneDay: round(oneDayReturn),
      fiveDay: round(fiveDayReturn),
      tenDay: round(tenDayReturn),
      twentyDay: round(twentyDayReturn),
    },
    scoring: {
      oneDay: oneDayScore,
      fiveDay: fiveDayScore,
      tenDay: tenDayScore,
      twentyDay: twentyDayScore,
    },
  };
}

function calculateMomentumScore(
  spy            ,
  qqq            ,
) {
  const spyMomentum = scoreIndexMomentum(spy);
  const qqqMomentum = scoreIndexMomentum(qqq);

  let confirmationScore = 0;

  const bothFiveDayPositive =
    spyMomentum.returns.fiveDay > 0 &&
    qqqMomentum.returns.fiveDay > 0;

  const bothTenDayPositive =
    spyMomentum.returns.tenDay > 0 &&
    qqqMomentum.returns.tenDay > 0;

  if (bothFiveDayPositive && bothTenDayPositive) {
    confirmationScore = 1;
  } else if (bothFiveDayPositive || bothTenDayPositive) {
    confirmationScore = 0.5;
  }

  const score =
    spyMomentum.score +
    qqqMomentum.score +
    confirmationScore;

  return {
    score: round(clamp(score, 0, 25)),
    maxScore: 25,
    details: {
      spy: spyMomentum,
      qqq: qqqMomentum,
      confirmationScore,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Sector participation and leadership: 20 points                             */
/* -------------------------------------------------------------------------- */

function calculateSectorScore(sectors              ) {
  const sectorResults                 = sectors.map(
    (sector) => ({
      symbol: sector.symbol,
      dailyReturn: round(getReturn(sector.series, 1)),
      fiveDayReturn: round(getReturn(sector.series, 5)),
    }),
  );

  const dailyPositiveCount = sectorResults.filter(
    (sector) => sector.dailyReturn > 0,
  ).length;

  const fiveDayPositiveCount = sectorResults.filter(
    (sector) => sector.fiveDayReturn > 0,
  ).length;

  const totalSectors = sectorResults.length;

  const dailyParticipationRatio =
    totalSectors > 0
      ? dailyPositiveCount / totalSectors
      : 0;

  const fiveDayParticipationRatio =
    totalSectors > 0
      ? fiveDayPositiveCount / totalSectors
      : 0;

  // Daily breadth contributes up to 8 points.
  const dailyParticipationScore = round(
    dailyParticipationRatio * 8,
    1,
  );

  // Five-day breadth contributes up to 8 points.
  const fiveDayParticipationScore = round(
    fiveDayParticipationRatio * 8,
    1,
  );

  const growthReturns = sectorResults
    .filter((sector) =>
      GROWTH_SECTORS.includes(sector.symbol),
    )
    .map((sector) => sector.fiveDayReturn);

  const defensiveReturns = sectorResults
    .filter((sector) =>
      DEFENSIVE_SECTORS.includes(sector.symbol),
    )
    .map((sector) => sector.fiveDayReturn);

  const growthAverage = average(growthReturns);
  const defensiveAverage = average(defensiveReturns);

  const hasLeadershipData =
    growthReturns.length >= 2 &&
    defensiveReturns.length >= 2;

  const leadershipSpread = hasLeadershipData
    ? growthAverage - defensiveAverage
    : 0;

  let leadershipScore = 0;

  if (hasLeadershipData) {
    if (leadershipSpread >= 1.5) {
      leadershipScore = 4;
    } else if (leadershipSpread >= 0.5) {
      leadershipScore = 3;
    } else if (leadershipSpread > 0) {
      leadershipScore = 2;
    } else if (leadershipSpread >= -0.5) {
      leadershipScore = 1;
    }
  }

  const score =
    dailyParticipationScore +
    fiveDayParticipationScore +
    leadershipScore;

  return {
    score: round(clamp(score, 0, 20)),
    maxScore: 20,
    details: {
      dailyPositiveCount,
      fiveDayPositiveCount,
      totalSectors,
      expectedSectorCount: SYMBOLS.sectors.length,
      coveragePercent: round(
        (totalSectors / SYMBOLS.sectors.length) * 100,
      ),
      dailyParticipationPercent: round(
        dailyParticipationRatio * 100,
      ),
      fiveDayParticipationPercent: round(
        fiveDayParticipationRatio * 100,
      ),
      growthFiveDayAverage: round(growthAverage),
      defensiveFiveDayAverage: round(defensiveAverage),
      leadershipSpread: round(leadershipSpread),
      leadershipScore,
      leadershipDataAvailable: hasLeadershipData,
      sectors: sectorResults,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Volatility: 15 points                                                      */
/* -------------------------------------------------------------------------- */

function calculateVolatilityScore(vix            ) {
  const vixLevel = vix.price;
  const dailyReturn = getReturn(vix.series, 1);
  const fiveDayReturn = getReturn(vix.series, 5);

  let levelScore = 0;

  if (vixLevel < 15) {
    levelScore = 10;
  } else if (vixLevel < 18) {
    levelScore = 8;
  } else if (vixLevel < 22) {
    levelScore = 6;
  } else if (vixLevel < 28) {
    levelScore = 3;
  }

  let dailyDirectionScore = 0;

  if (dailyReturn <= -5) {
    dailyDirectionScore = 3;
  } else if (dailyReturn < 0) {
    dailyDirectionScore = 2;
  } else if (dailyReturn <= 5) {
    dailyDirectionScore = 1;
  }

  let fiveDayDirectionScore = 0;

  if (fiveDayReturn <= -10) {
    fiveDayDirectionScore = 2;
  } else if (fiveDayReturn < 0) {
    fiveDayDirectionScore = 1.5;
  } else if (fiveDayReturn <= 5) {
    fiveDayDirectionScore = 1;
  } else if (fiveDayReturn <= 15) {
    fiveDayDirectionScore = 0.5;
  }

  const score =
    levelScore +
    dailyDirectionScore +
    fiveDayDirectionScore;

  return {
    score: round(clamp(score, 0, 15)),
    maxScore: 15,
    details: {
      vixLevel: round(vixLevel),
      dailyReturn: round(dailyReturn),
      fiveDayReturn: round(fiveDayReturn),
      levelScore,
      dailyDirectionScore,
      fiveDayDirectionScore,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Market breadth confirmation                                                */
/* -------------------------------------------------------------------------- */

                              
                      
                
                       
                                  
                                       
                           
  

                            
                     
                     
                   
                 
                                         
  

function getBreadthAdjustment(breadthScore        ) {
  if (breadthScore >= 80) {
    return {
      adjustment: 3,
      scoreCap: 100,
      reason: "Strong breadth confirms the bullish market structure.",
    };
  }

  if (breadthScore >= 65) {
    return {
      adjustment: 1,
      scoreCap: 100,
      reason: "Healthy breadth provides positive confirmation.",
    };
  }

  if (breadthScore >= 50) {
    return {
      adjustment: 0,
      scoreCap: 79,
      reason:
        "Mixed breadth prevents an aggressive bullish classification.",
    };
  }

  if (breadthScore >= 35) {
    return {
      adjustment: -6,
      scoreCap: 74,
      reason:
        "Weak participation reduces confidence in index-level strength.",
    };
  }

  return {
    adjustment: -10,
    scoreCap: 64,
    reason:
      "Very weak participation materially limits the bullish market score.",
  };
}

function getMarketLabel(score        ) {
  if (score >= 80) return "Strong Bullish";
  if (score >= 65) return "Bullish";
  if (score >= 50) return "Neutral";
  if (score >= 35) return "Bearish";

  return "Strong Bearish";
}
const sectorSymbols = {
  Technology: [
    "AAPL",
    "MSFT",
    "NVDA",
    "AVGO",
    "ORCL",
    "CRM",
    "AMD",
    "ADBE",
    "CSCO",
    "ACN",
    "IBM",
    "QCOM",
    "TXN",
    "INTU",
    "NOW",
  ],

  Communication: [
    "META",
    "GOOGL",
    "NFLX",
    "TMUS",
    "DIS",
    "CMCSA",
    "T",
    "VZ",
    "CHTR",
    "TTWO",
  ],

  "Consumer Discretionary": [
    "AMZN",
    "TSLA",
    "HD",
    "MCD",
    "NKE",
    "LOW",
    "SBUX",
    "BKNG",
    "TJX",
    "MAR",
    "ORLY",
    "GM",
    "DHI",
  ],

  Financials: [
    "JPM",
    "BAC",
    "WFC",
    "GS",
    "V",
    "MA",
    "PNC",
    "C",
    "AXP",
    "BLK",
    "SCHW",
    "PGR",
    "CB",
  ],

  Healthcare: [
    "LLY",
    "UNH",
    "JNJ",
    "ABBV",
    "MRK",
    "TMO",
    "ABT",
    "AMGN",
    "GILD",
    "ISRG",
    "HCA",
    "BSX",
    "SYK",
  ],

  Industrials: [
    "CAT",
    "GE",
    "HON",
    "UPS",
    "BA",
    "RTX",
    "UNP",
    "DE",
    "LMT",
    "ETN",
    "WM",
    "PH",
    "DAL",
  ],

  "Consumer Staples": [
    "WMT",
    "COST",
    "PG",
    "KO",
    "PEP",
    "PM",
    "KR",
    "CL",
    "MDLZ",
    "KMB",
  ],

  Energy: [
    "XOM",
    "CVX",
    "COP",
    "EOG",
    "SLB",
    "MPC",
    "EQT",
    "OXY",
    "VLO",
    "WMB",
  ],

  Utilities: [
    "NEE",
    "SO",
    "DUK",
    "CEG",
    "AEP",
    "SRE",
    "D",
    "EXC",
  ],

  "Real Estate": [
    "AMT",
    "PLD",
    "EQIX",
    "WELL",
    "SPG",
    "O",
    "PSA",
    "DLR",
  ],

  Materials: [
    "LIN",
    "FCX",
    "SHW",
    "PKG",
    "ECL",
    "NEM",
    "NUE",
    "DOW",
    "VMC",
  ],
}         ;
function getBreadthLabel(score        ) {
  if (score >= 80) {
    return "Strong Participation";
  }

  if (score >= 65) {
    return "Healthy Participation";
  }

  if (score >= 50) {
    return "Mixed Participation";
  }

  if (score >= 35) {
    return "Weak Participation";
  }

  return "Very Weak Participation";
}
function calculateBreadthScore({
  advancingPercent,
  above20Percent,
  above50Percent,
  positiveSectorPercent,
  rspRelativePerformance,
}   
                           
                         
                         
                                
                                        
 ) {
  const participationComponent =
    advancingPercent * 0.4;

  const shortTermTrendComponent =
    above20Percent * 0.2;

  const intermediateTrendComponent =
    above50Percent * 0.2;

  const sectorComponent =
    positiveSectorPercent * 0.1;

  const relativePerformanceScore =
    rspRelativePerformance === null
      ? 50
      : Math.min(
          100,
          Math.max(
            0,
            50 +
              rspRelativePerformance * 50,
          ),
        );

  const relativeStrengthComponent =
    relativePerformanceScore * 0.1;

  return Math.min(
    100,
    Math.max(
      0,
      participationComponent +
        shortTermTrendComponent +
        intermediateTrendComponent +
        sectorComponent +
        relativeStrengthComponent,
    ),
  );
}
export { SYMBOLS, sectorSymbols, round, average, simpleMovingAverage, getReturn, calculateTrendScore, calculateMomentumScore, calculateSectorScore, calculateVolatilityScore, getBreadthAdjustment, getMarketLabel, getBreadthLabel, calculateBreadthScore };
