import { NextRequest, NextResponse } from "next/server";
import {
  getDefenseJobMapAggregation,
  parseDefenseJobFilter,
} from "@/lib/defense-jobs";

/*
 * City-level aggregation of the listings matching the current filter, for the
 * /defense-jobs map. A few hundred rows instead of ~12k — the client no longer
 * derives map points from raw listings. Refetched only when filters change
 * (not on pagination). Same query params as /api/defense-jobs (page ignored).
 * Response: { cityPoints }.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filter = parseDefenseJobFilter(req.nextUrl.searchParams);
  const cityPoints = await getDefenseJobMapAggregation(filter);
  return NextResponse.json({ cityPoints });
}
