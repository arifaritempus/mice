import { NextRequest, NextResponse } from "next/server";
import { getTcmbRatesForDate } from "@/lib/sejourRatesService";

export const revalidate = 0; // Disable cache for live rates

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const strategy = searchParams.get("strategy") || "tcmb_banknote_selling";

    const rates = await getTcmbRatesForDate(date, strategy);

    return NextResponse.json({
      success: true,
      rates,
      ...rates,
    });
  } catch (error: any) {
    console.error("GET /api/sejour/rates error:", error);
    return NextResponse.json(
      { success: false, error: error.message, usd_rate: 1, eur_rate: 1, gbp_rate: 1 },
      { status: 500 }
    );
  }
}
