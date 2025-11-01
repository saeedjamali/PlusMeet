/**
 * Health Check API Route - App Router
 * برای چک کردن سلامت API
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "PlusMeet API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    router: "App Router",
  });
}



