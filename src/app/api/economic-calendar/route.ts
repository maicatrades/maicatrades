import { NextResponse } from "next/server";
import { calendarEvents } from "../../../data/dashboardData";

export async function GET() {
  return NextResponse.json({
    success: true,
    events: calendarEvents,
    updatedAt: new Date().toISOString(),
  });
}