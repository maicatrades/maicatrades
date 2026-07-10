import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json(
      { error: "Finnhub API key is missing." },
      { status: 500 }
    );
  }

  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        {
          cache: "no-store",
        }
      ),
      fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        {
          cache: "no-store",
        }
      ),
    ]);

    if (!quoteRes.ok || !profileRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch market data." },
        { status: 500 }
      );
    }

    const quote = await quoteRes.json();
    const profile = await profileRes.json();

    return NextResponse.json({
      quote,
      profile,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}