import { NextResponse } from "next/server";
import { currencyService } from "@/lib/currency/service";
import { isSupportedCurrency, DEFAULT_CURRENCY } from "@/data/currencies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fx?base=USD
 * Returns the exchange-rate table for a base currency. Server-side only so no
 * API keys are ever exposed to the client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseParam = searchParams.get("base") ?? DEFAULT_CURRENCY;
  const base = isSupportedCurrency(baseParam) ? baseParam : DEFAULT_CURRENCY;

  try {
    const table = await currencyService.getRates(base);
    return NextResponse.json(table, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load exchange rates.", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    );
  }
}
