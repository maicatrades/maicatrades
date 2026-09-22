import { NextResponse } from "next/server";

type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  previous: string;
  forecast: string;
  actual: string;
  status: "Scheduled" | "Awaiting result" | "Completed";
  description: string;
};

type ParsedEvent = {
  source: "BLS" | "BEA" | "CENSUS" | "FED" | "MANUAL";
  date: Date;
  time: string;
  title: string;
};

const EASTERN_TIME_ZONE = "America/New_York";
const FETCH_TIMEOUT_MS = 8_000;

type ManualEventValues = {
  previous?: string;
  forecast?: string;
  actual?: string;
};

/*
  Optional manual result overrides.

  Use the event ID returned by /api/economic-calendar, then replace only
  the values you know. This keeps quick result updates separate from the
  official schedule parsers.

  Example:
  "2026-08-21-existing-home-sales": {
    previous: "4.1M",
    forecast: "4.0M",
    actual: "4.2M",
  },
*/
const MANUAL_CALENDAR_EVENTS = [
  {
    month: "August",
    day: 20,
    year: 2026,
    time: "8:30 AM",
    title: "Philadelphia Fed Business Outlook Survey",
    previous: "41.4",
    forecast: "25",
    actual: "47.4",
  },
  {
    month: "August",
    day: 20,
    year: 2026,
    time: "8:30 AM",
    title: "Weekly Jobless Claims",
    previous: "209K",
    forecast: "210K",
    actual: "206K",
  },
  {
    month: "August",
    day: 20,
    year: 2026,
    time: "10:00 AM",
    title: "Leading Indicators",
    previous: "-0.2%",
    forecast: "0.1%",
    actual: "Pending",
  },
  {
    month: "August",
    day: 21,
    year: 2026,
    time: "9:45 AM",
    title: "U.S. Flash Manufacturing PMI",
    previous: "53.8",
    forecast: "54",
    actual: "Pending",
  },
  {
    month: "August",
    day: 21,
    year: 2026,
    time: "9:45 AM",
    title: "U.S. Flash Services PMI",
    previous: "53.6",
    forecast: "53.9",
    actual: "Pending",
  },
  {
    month: "August",
    day: 25,
    year: 2026,
    time: "10:00 AM",
    title: "New Home Sales",
    previous: "628K",
    forecast: "615K",
    actual: "607K",
  },
  {
    month: "August",
    day: 26,
    year: 2026,
    time: "8:30 AM",
    title: "Durable Goods Orders",
    previous: "0.3%",
    forecast: "0.5%",
    actual: "1.1%",
  },
  {
    month: "August",
    day: 26,
    year: 2026,
    time: "8:30 AM",
    title: "GDP (Second Estimate)",
    previous: "1.5%",
    forecast: "1.5%",
    actual: "1.5%",
  },
  {
    month: "August",
    day: 26,
    year: 2026,
    time: "8:30 AM",
    title: "Personal Income & Outlays / PCE",
    previous:
      "Income 0.2% · Spending 0.3% · PCE -0.1% MoM / 3.7% YoY · Core 0.1% MoM / 3.3% YoY",
    forecast:
      "Income 0.2% · Spending 0.1% · PCE 0.1% MoM / 3.6% YoY · Core 0.2% MoM / 3.3% YoY",
    actual:
      "Income 0.4% · Spending 0.2% · PCE 0.2% MoM / 3.7% YoY · Core 0.2% MoM / 3.3% YoY",
  },
  {
    month: "August",
    day: 27,
    year: 2026,
    time: "8:30 AM",
    title: "Weekly Jobless Claims",
    previous: "206K",
    forecast: "208K",
    actual: "203K",
  },
] as const;

const MANUAL_EVENT_VALUES: Record<string, ManualEventValues> =
  Object.fromEntries(
    MANUAL_CALENDAR_EVENTS.map((event) => {
      const date = makeDate(event.month, event.day, event.year);
      const id = date
        ? `${formatDateId(date)}-${slugify(event.title)}`
        : "";

      return [
        id,
        {
          previous: event.previous,
          forecast: event.forecast,
          actual: event.actual,
        },
      ];
    }).filter(([id]) => Boolean(id)),
  );

const IMPORTANT_BLS_RELEASES = [
  "Consumer Price Index",
  "Producer Price Index",
  "Employment Situation",
  "Job Openings and Labor Turnover Survey",
  "Employment Cost Index",
  "Productivity and Costs",
  "U.S. Import and Export Price Indexes",
];

const IMPORTANT_BEA_RELEASES = [
  "GDP",
  "Personal Income and Outlays",
  "U.S. International Trade in Goods and Services",
];

const IMPORTANT_CENSUS_RELEASES = [
  "Advance Monthly Sales for Retail and Food Services",
  "New Residential Construction",
  "New Residential Sales",
  "Advance Report on Durable Goods",
];

const FED_2026_FALLBACK_EVENTS = [
  { month: "January", day: 28, title: "FOMC Rate Decision" },
  { month: "February", day: 18, title: "FOMC Minutes" },
  { month: "March", day: 18, title: "FOMC Rate Decision" },
  { month: "April", day: 8, title: "FOMC Minutes" },
  { month: "April", day: 29, title: "FOMC Rate Decision" },
  { month: "May", day: 20, title: "FOMC Minutes" },
  { month: "June", day: 17, title: "FOMC Rate Decision" },
  { month: "July", day: 8, title: "FOMC Minutes" },
  { month: "July", day: 29, title: "FOMC Rate Decision" },
  { month: "August", day: 19, title: "FOMC Minutes" },
  { month: "September", day: 16, title: "FOMC Rate Decision" },
  { month: "October", day: 7, title: "FOMC Minutes" },
  { month: "October", day: 28, title: "FOMC Rate Decision" },
  { month: "November", day: 18, title: "FOMC Minutes" },
  { month: "December", day: 9, title: "FOMC Rate Decision" },
  { month: "December", day: 30, title: "FOMC Minutes" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MaicaTrades/1.0; +https://maicatrades.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      next: {
        revalidate: 21_600,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function formatEasternDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    weekday: "long",
  }).format(date);
}

function formatDateId(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function monthNameToNumber(monthName: string) {
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  return months[monthName.toLowerCase()];
}

function makeDate(
  monthName: string,
  day: number,
  year: number,
) {
  const month = monthNameToNumber(monthName);

  if (month === undefined) {
    return null;
  }

  return new Date(
    Date.UTC(year, month, day, 12, 0, 0),
  );
}

function parseDisplayTime(time: string) {
  const match = time.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );

  if (!match) {
    return {
      hour: 0,
      minute: 0,
    };
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return {
    hour,
    minute,
  };
}

function getEasternDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    year: Number(
      parts.find((part) => part.type === "year")?.value,
    ),
    month: Number(
      parts.find((part) => part.type === "month")?.value,
    ),
    day: Number(
      parts.find((part) => part.type === "day")?.value,
    ),
    hour: Number(
      parts.find((part) => part.type === "hour")?.value,
    ),
    minute: Number(
      parts.find((part) => part.type === "minute")?.value,
    ),
  };
}

function easternDateToComparable(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) {
  return Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );
}

function getEventComparable(eventDate: Date, eventTime: string) {
  const eventParts = getEasternDateParts(eventDate);
  const time = parseDisplayTime(eventTime);

  return easternDateToComparable(
    eventParts.year,
    eventParts.month,
    eventParts.day,
    time.hour,
    time.minute,
  );
}

function getCalendarWindow() {
  const nowParts = getEasternDateParts(new Date());
  const nowComparable = easternDateToComparable(
    nowParts.year,
    nowParts.month,
    nowParts.day,
  );

  const dayOfWeek = new Date(nowComparable).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const start = nowComparable - daysSinceMonday * 24 * 60 * 60 * 1000;
  const end = start + 14 * 24 * 60 * 60 * 1000 - 1;

  return { start, end };
}

function isWithinCalendarWindow(eventDate: Date, eventTime: string) {
  const { start, end } = getCalendarWindow();
  const eventComparable = getEventComparable(eventDate, eventTime);

  return eventComparable >= start && eventComparable <= end;
}

function getEventStatus(
  eventDate: Date,
  eventTime: string,
  actual: string,
): CalendarEvent["status"] {
  const nowParts = getEasternDateParts(new Date());
  const nowComparable = easternDateToComparable(
    nowParts.year,
    nowParts.month,
    nowParts.day,
    nowParts.hour,
    nowParts.minute,
  );

  if (getEventComparable(eventDate, eventTime) >= nowComparable) {
    return "Scheduled";
  }

  return actual !== "Pending" && actual !== "—"
    ? "Completed"
    : "Awaiting result";
}

function normalizeTime(value: string) {
  const cleaned = cleanText(value)
    .replace(/\bET\b/gi, "")
    .trim();

  const match = cleaned.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );

  if (!match) {
    return cleaned || "TBD";
  }

  return `${Number(match[1])}:${match[2]} ${match[3].toUpperCase()}`;
}

function classifyEvent(title: string): {
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  description: string;
} {
  const lower = title.toLowerCase();

  if (
    lower.includes("consumer price index") ||
    /\bcpi\b/i.test(title)
  ) {
    return {
      title: "Consumer Price Index (CPI)",
      category: "Inflation",
      impact: "High",
      description:
        "Measures changes in consumer prices and is one of the most closely watched indicators of U.S. inflation and potential Federal Reserve policy.",
    };
  }

  if (
    lower.includes("producer price index") ||
    /\bppi\b/i.test(title)
  ) {
    return {
      title: "Producer Price Index (PPI)",
      category: "Inflation",
      impact: "High",
      description:
        "Measures changes in prices received by U.S. producers and can provide an early indication of inflation pressure.",
    };
  }

  if (
    lower.includes("employment situation")
  ) {
    return {
      title: "Employment Situation",
      category: "Employment",
      impact: "High",
      description:
        "Includes major U.S. labor-market data such as payroll growth and the unemployment rate and can significantly affect market expectations for economic growth and interest rates.",
    };
  }

  if (
    lower.includes("job openings") ||
    lower.includes("labor turnover")
  ) {
    return {
      title: "JOLTS Job Openings",
      category: "Employment",
      impact: "Medium",
      description:
        "Measures U.S. job openings and labor turnover and provides insight into labor demand and labor-market tightness.",
    };
  }

  if (
    lower.includes("employment cost index")
  ) {
    return {
      title: "Employment Cost Index",
      category: "Employment",
      impact: "High",
      description:
        "Measures changes in employee compensation and is closely watched for signs of wage-driven inflation pressure.",
    };
  }

  if (
    lower.includes("productivity and costs")
  ) {
    return {
      title: "Productivity & Costs",
      category: "Employment",
      impact: "Medium",
      description:
        "Measures labor productivity and unit labor costs, offering insight into wage pressure, efficiency, and inflation.",
    };
  }

  if (
    lower.includes("import and export price")
  ) {
    return {
      title: "Import & Export Prices",
      category: "Inflation",
      impact: "Medium",
      description:
        "Measures price changes for U.S. imports and exports and can provide additional insight into inflation pressures.",
    };
  }

  if (lower.includes("philadelphia fed business outlook")) {
    return {
      title: "Philadelphia Fed Business Outlook Survey",
      category: "Manufacturing",
      impact: "Medium",
      description:
        "Measures manufacturing activity in the Philadelphia Federal Reserve district and can provide an early signal about factory-sector momentum.",
    };
  }

  if (lower.includes("weekly jobless claims")) {
    return {
      title: "Weekly Jobless Claims",
      category: "Employment",
      impact: "Medium",
      description:
        "Tracks new applications for unemployment benefits and provides a timely view of labor-market conditions.",
    };
  }

  if (lower.includes("leading indicators")) {
    return {
      title: "Leading Indicators",
      category: "Economic Growth",
      impact: "Medium",
      description:
        "Combines forward-looking economic measures intended to signal changes in the direction of the U.S. economy.",
    };
  }

  if (lower.includes("flash manufacturing pmi")) {
    return {
      title: "U.S. Flash Manufacturing PMI",
      category: "Manufacturing",
      impact: "Medium",
      description:
        "Provides an early monthly reading of U.S. manufacturing activity, with readings above 50 generally indicating expansion.",
    };
  }

  if (lower.includes("flash services pmi")) {
    return {
      title: "U.S. Flash Services PMI",
      category: "Services",
      impact: "Medium",
      description:
        "Provides an early monthly reading of U.S. services activity, with readings above 50 generally indicating expansion.",
    };
  }

  if (
    lower.includes("personal income and outlays")
  ) {
    return {
      title: "Personal Income & Outlays / PCE",
      category: "Inflation",
      impact: "High",
      description:
        "Includes personal income, consumer spending, and the PCE price indexes, including the Federal Reserve's closely watched inflation measure.",
    };
  }

  if (lower.includes("gdp")) {
    let normalizedTitle = "GDP";

    if (lower.includes("advance estimate")) {
      normalizedTitle = "GDP (Advance Estimate)";
    } else if (lower.includes("second estimate")) {
      normalizedTitle = "GDP (Second Estimate)";
    } else if (lower.includes("third estimate")) {
      normalizedTitle = "GDP (Third Estimate)";
    }

    return {
      title: normalizedTitle,
      category: "Economic Growth",
      impact: "High",
      description:
        "Measures U.S. economic output and provides a broad indication of the pace of economic growth.",
    };
  }

  if (
    lower.includes("international trade")
  ) {
    return {
      title: "U.S. International Trade",
      category: "Economic Growth",
      impact: "Medium",
      description:
        "Measures U.S. imports and exports and provides insight into trade activity and its contribution to economic growth.",
    };
  }

  if (lower.includes("fomc minutes")) {
    return {
      title: "FOMC Minutes",
      category: "Federal Reserve",
      impact: "High",
      description:
        "Detailed minutes from the Federal Reserve's latest policy meeting can shift expectations for interest rates, inflation, growth, and financial conditions.",
    };
  }

  if (
    lower.includes("fomc")
  ) {
    return {
      title: "FOMC Rate Decision",
      category: "Federal Reserve",
      impact: "High",
      description:
        "The Federal Reserve announces its monetary-policy decision. Changes in rates, guidance, or the policy outlook can create significant market volatility.",
    };
  }

  if (
    lower.includes("advance monthly sales for retail and food services") ||
    lower.includes("retail sales")
  ) {
    return {
      title: "Retail Sales",
      category: "Consumer",
      impact: "High",
      description:
        "Measures monthly U.S. retail and food-service sales and provides an important read on consumer demand and economic momentum.",
    };
  }

  if (
    lower.includes("new residential construction")
  ) {
    return {
      title: "Housing Starts & Building Permits",
      category: "Housing",
      impact: "Medium",
      description:
        "Tracks new residential construction, including housing starts and building permits, and provides insight into housing activity and economic demand.",
    };
  }

  if (
    lower.includes("new residential sales")
  ) {
    return {
      title: "New Home Sales",
      category: "Housing",
      impact: "Medium",
      description:
        "Measures sales of newly built U.S. homes and provides insight into housing demand, consumer confidence, and interest-rate sensitivity.",
    };
  }

  if (
    lower.includes("advance report on durable goods") ||
    lower.includes("durable goods")
  ) {
    return {
      title: "Durable Goods Orders",
      category: "Business Activity",
      impact: "Medium",
      description:
        "Measures new orders for long-lasting manufactured goods and can provide insight into business investment and manufacturing demand.",
    };
  }

  return {
    title,
    category: "Economic Data",
    impact: "Medium",
    description:
      "A scheduled U.S. economic release that may provide additional context on economic conditions and financial markets.",
  };
}

function toCalendarEvent(
  event: ParsedEvent,
): CalendarEvent {
  const classification = classifyEvent(event.title);

  const dateId = formatDateId(event.date);
  const id = `${dateId}-${slugify(classification.title)}`;
  const manualValues = MANUAL_EVENT_VALUES[id] ?? {};
  const doesNotHaveNumericResult =
    classification.title === "FOMC Minutes";
  const defaultValue = doesNotHaveNumericResult ? "N/A" : "—";
  const defaultActual = doesNotHaveNumericResult ? "N/A" : "Pending";
  const actual = manualValues.actual ?? defaultActual;

  return {
    id,
    date: formatEasternDate(event.date),
    time: normalizeTime(event.time),
    title: classification.title,
    category: classification.category,
    impact: classification.impact,
    previous: manualValues.previous ?? defaultValue,
    forecast: manualValues.forecast ?? defaultValue,
    actual,
    status: getEventStatus(
      event.date,
      normalizeTime(event.time),
      actual,
    ),
    description: classification.description,
  };
}

function parseBlsSchedule(html: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  const rowRegex =
    /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html))) {
    const rowHtml = rowMatch[1];

    const cells = [
      ...rowHtml.matchAll(
        /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi,
      ),
    ].map((match) => cleanText(match[1]));

    if (cells.length < 3) {
      continue;
    }

    /*
      BLS rows should resolve to:
      Date | Time | Release

      We intentionally bind those three cells together
      instead of searching the whole row for a keyword.
    */
    const dateCell = cells[0] ?? "";
    const timeCell = cells[1] ?? "";
    const releaseCell = cells[2] ?? "";

    const importantRelease =
      IMPORTANT_BLS_RELEASES.find(
        (release) =>
          releaseCell
            .toLowerCase()
            .includes(release.toLowerCase()),
      );

    if (!importantRelease) {
      continue;
    }

    const dateMatch = dateCell.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})/i,
    );

    const timeMatch = timeCell.match(
      /(\d{1,2}:\d{2})\s*(AM|PM)/i,
    );

    if (!dateMatch || !timeMatch) {
      continue;
    }

    const date = makeDate(
      dateMatch[1],
      Number(dateMatch[2]),
      Number(dateMatch[3]),
    );

    if (!date) {
      continue;
    }

    events.push({
      source: "BLS",
      date,
      time: `${timeMatch[1]} ${timeMatch[2]}`,
      title: releaseCell,
    });
  }

  return events;
}

function parseBeaSchedule(html: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  const rowRegex =
    /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html))) {
    const rowHtml = rowMatch[1];

    const cells = [
      ...rowHtml.matchAll(
        /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi,
      ),
    ].map((match) => cleanText(match[1]));

    if (cells.length < 2) {
      continue;
    }

    const combined = cells.join(" | ");

    const importantRelease =
      IMPORTANT_BEA_RELEASES.find(
        (release) =>
          combined
            .toLowerCase()
            .includes(release.toLowerCase()),
      );

    if (!importantRelease) {
      continue;
    }

    const dateMatch = combined.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i,
    );

    const timeMatch = combined.match(
      /(\d{1,2}:\d{2})\s*(AM|PM)/i,
    );

    if (!dateMatch || !timeMatch) {
      continue;
    }

    const year = dateMatch[3]
      ? Number(dateMatch[3])
      : 2026;

    const date = makeDate(
      dateMatch[1],
      Number(dateMatch[2]),
      year,
    );

    if (!date) {
      continue;
    }

    const titleCell =
      cells.find((cell) =>
        IMPORTANT_BEA_RELEASES.some(
          (release) =>
            cell
              .toLowerCase()
              .includes(release.toLowerCase()),
        ),
      ) ?? importantRelease;

    events.push({
      source: "BEA",
      date,
      time: `${timeMatch[1]} ${timeMatch[2]}`,
      title: titleCell,
    });
  }

  return events;
}

function parseCensusSchedule(html: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  const rowRegex =
    /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html))) {
    const rowHtml = rowMatch[1];

    const cells = [
      ...rowHtml.matchAll(
        /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi,
      ),
    ].map((match) => cleanText(match[1]));

    if (cells.length < 3) {
      continue;
    }

    const combined = cells.join(" | ");

    const importantRelease =
      IMPORTANT_CENSUS_RELEASES.find(
        (release) =>
          combined
            .toLowerCase()
            .includes(release.toLowerCase()),
      );

    if (!importantRelease) {
      continue;
    }

    const dateMatch = combined.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})/i,
    );

    const timeMatch = combined.match(
      /(\d{1,2}:\d{2})\s*(AM|PM)/i,
    );

    if (!dateMatch || !timeMatch) {
      continue;
    }

    const date = makeDate(
      dateMatch[1],
      Number(dateMatch[2]),
      Number(dateMatch[3]),
    );

    if (!date) {
      continue;
    }

    const titleCell =
      cells.find((cell) =>
        IMPORTANT_CENSUS_RELEASES.some(
          (release) =>
            cell
              .toLowerCase()
              .includes(release.toLowerCase()),
        ),
      ) ?? importantRelease;

    events.push({
      source: "CENSUS",
      date,
      time: `${timeMatch[1]} ${timeMatch[2]}`,
      title: titleCell,
    });
  }

  return events;
}

function parseFedSchedule(html: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const currentYear = getEasternDateParts(new Date()).year;

  const text = cleanText(html)
    .replace(/\bSept\./gi, "September")
    .replace(/\bSep\./gi, "September")
    .replace(/\bAug\./gi, "August")
    .replace(/\bOct\./gi, "October")
    .replace(/\bNov\./gi, "November")
    .replace(/\bDec\./gi, "December")
    .replace(/\bJan\./gi, "January")
    .replace(/\bFeb\./gi, "February")
    .replace(/\bMar\./gi, "March")
    .replace(/\bApr\./gi, "April")
    .replace(/\bJun\./gi, "June")
    .replace(/\bJul\./gi, "July");

  const eventRegex =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+(FOMC Minutes|FOMC Meeting)/gi;

  let match: RegExpExecArray | null;

  while ((match = eventRegex.exec(text))) {
    const month = match[1];
    const startDay = Number(match[2]);
    const endDay = match[3]
      ? Number(match[3])
      : startDay;
    const eventTitle = match[4];

    const date = makeDate(
      month,
      endDay,
      currentYear,
    );

    if (!date) {
      continue;
    }

    events.push({
      source: "FED",
      date,
      time: "2:00 PM",
      title:
        eventTitle.toLowerCase().includes("minutes")
          ? "FOMC Minutes"
          : "FOMC Rate Decision",
    });
  }

  return events;
}

function getFedFallbackEvents(): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  for (const event of FED_2026_FALLBACK_EVENTS) {
    const date = makeDate(
      event.month,
      event.day,
      2026,
    );

    if (!date) {
      continue;
    }

    events.push({
      source: "FED",
      date,
      time: "2:00 PM",
      title: event.title,
    });
  }

  return events;
}

function getManualEvents(): ParsedEvent[] {
  return MANUAL_CALENDAR_EVENTS.flatMap((event) => {
    const date = makeDate(event.month, event.day, event.year);

    if (!date) {
      return [];
    }

    return [
      {
        source: "MANUAL" as const,
        date,
        time: event.time,
        title: event.title,
      },
    ];
  });
}

function removeDuplicates(
  events: CalendarEvent[],
) {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = `${event.id}|${event.time}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getSortValue(event: CalendarEvent) {
  const dateMatch = event.id.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (!dateMatch) {
    return Number.MAX_SAFE_INTEGER;
  }

  const time = parseDisplayTime(event.time);

  return easternDateToComparable(
    Number(dateMatch[1]),
    Number(dateMatch[2]),
    Number(dateMatch[3]),
    time.hour,
    time.minute,
  );
}

export async function GET() {
  const sourceStatus = {
    bls: false,
    bea: false,
    census: false,
    fed: false,
  };

  const sourceEventCounts = {
    bls: 0,
    bea: 0,
    census: 0,
    fed: 0,
  };

  const warnings: string[] = [];
  const parsedEvents: ParsedEvent[] = getManualEvents();

  const results = await Promise.allSettled([
    fetchWithTimeout(
      "https://www.bls.gov/schedule/2026/home.htm",
    ),
    fetchWithTimeout(
      "https://www.bea.gov/news/schedule",
    ),
    fetchWithTimeout(
      "https://www.census.gov/economic-indicators/calendar-listview.html",
    ),
    fetchWithTimeout(
      "https://www.federalreserve.gov/monetarypolicy.htm",
    ),
  ]);

  const [
    blsResult,
    beaResult,
    censusResult,
    fedResult,
  ] = results;

  if (blsResult.status === "fulfilled") {
    try {
      const blsEvents =
        parseBlsSchedule(blsResult.value);

      if (blsEvents.length > 0) {
        parsedEvents.push(...blsEvents);
        sourceStatus.bls = true;
        sourceEventCounts.bls =
          blsEvents.length;
      } else {
        warnings.push(
          "BLS schedule loaded but produced no recognized events.",
        );
      }
    } catch (error) {
      warnings.push(
        "BLS schedule could not be parsed.",
      );
      console.error(
        "Unable to parse BLS calendar:",
        error,
      );
    }
  } else {
    warnings.push(
      "BLS schedule could not be fetched.",
    );
    console.error(
      "Unable to fetch BLS calendar:",
      blsResult.reason,
    );
  }

  if (beaResult.status === "fulfilled") {
    try {
      const beaEvents =
        parseBeaSchedule(beaResult.value);

      if (beaEvents.length > 0) {
        parsedEvents.push(...beaEvents);
        sourceStatus.bea = true;
        sourceEventCounts.bea =
          beaEvents.length;
      } else {
        warnings.push(
          "BEA schedule loaded but produced no recognized events.",
        );
      }
    } catch (error) {
      warnings.push(
        "BEA schedule could not be parsed.",
      );
      console.error(
        "Unable to parse BEA calendar:",
        error,
      );
    }
  } else {
    warnings.push(
      "BEA schedule could not be fetched.",
    );
    console.error(
      "Unable to fetch BEA calendar:",
      beaResult.reason,
    );
  }

  if (censusResult.status === "fulfilled") {
    try {
      const censusEvents =
        parseCensusSchedule(
          censusResult.value,
        );

      if (censusEvents.length > 0) {
        parsedEvents.push(...censusEvents);
        sourceStatus.census = true;
        sourceEventCounts.census =
          censusEvents.length;
      } else {
        warnings.push(
          "Census schedule loaded but produced no recognized events.",
        );
      }
    } catch (error) {
      warnings.push(
        "Census schedule could not be parsed.",
      );
      console.error(
        "Unable to parse Census calendar:",
        error,
      );
    }
  } else {
    warnings.push(
      "Census schedule could not be fetched.",
    );
    console.error(
      "Unable to fetch Census calendar:",
      censusResult.reason,
    );
  }

  if (fedResult.status === "fulfilled") {
    try {
      const fedEvents =
        parseFedSchedule(fedResult.value);

      if (fedEvents.length > 0) {
        parsedEvents.push(...fedEvents);
        sourceStatus.fed = true;
        sourceEventCounts.fed =
          fedEvents.length;
      } else {
        warnings.push(
          "Federal Reserve schedule loaded but produced no recognized FOMC events. Using the built-in 2026 Fed fallback.",
        );

        const fallbackEvents =
          getFedFallbackEvents();

        parsedEvents.push(
          ...fallbackEvents,
        );
        sourceEventCounts.fed =
          fallbackEvents.length;
      }
    } catch (error) {
      warnings.push(
        "Federal Reserve schedule could not be parsed. Using the built-in 2026 Fed fallback.",
      );

      const fallbackEvents =
        getFedFallbackEvents();

      parsedEvents.push(
        ...fallbackEvents,
      );
      sourceEventCounts.fed =
        fallbackEvents.length;

      console.error(
        "Unable to parse Federal Reserve calendar:",
        error,
      );
    }
  } else {
    warnings.push(
      "Federal Reserve schedule could not be fetched. Using the built-in 2026 Fed fallback.",
    );

    const fallbackEvents =
      getFedFallbackEvents();

    parsedEvents.push(
      ...fallbackEvents,
    );
    sourceEventCounts.fed =
      fallbackEvents.length;

    console.error(
      "Unable to fetch Federal Reserve calendar:",
      fedResult.reason,
    );
  }

  const calendarEvents = removeDuplicates(
    parsedEvents
      .filter((event) =>
        isWithinCalendarWindow(
          event.date,
          normalizeTime(event.time),
        ),
      )
      .map(toCalendarEvent),
  ).sort(
    (a, b) =>
      getSortValue(a) - getSortValue(b),
  );

  return NextResponse.json({
    success: true,
    events: calendarEvents,
    updatedAt: new Date().toISOString(),
    sourceStatus,
    sourceEventCounts,
    warnings,
    source:
      "Official U.S. government release schedules",
    timezone: EASTERN_TIME_ZONE,
  });
}
