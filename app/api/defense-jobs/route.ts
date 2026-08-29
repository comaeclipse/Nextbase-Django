import { NextRequest, NextResponse } from "next/server";
import {
  DEFENSE_JOBS_PAGE_SIZE,
  getDefenseJobListingsPage,
  parseDefenseJobFilter,
  toClientListing,
} from "@/lib/defense-jobs";

/*
 * Paginated, filtered listings for /defense-jobs. Replaces shipping all ~12k
 * rows to the client: the page renders page 1 server-side and this route serves
 * every subsequent filter/page change.
 *
 * Query params: sectors, employers, regions (comma-separated), remote=true,
 * q, city ("City|ST"), page (1-based). Response: { listings, total, page,
 * pageSize }.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filter = parseDefenseJobFilter(sp);
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const { listings, total } = await getDefenseJobListingsPage(filter, page);

  return NextResponse.json({
    listings: listings.map(toClientListing),
    total,
    page,
    pageSize: DEFENSE_JOBS_PAGE_SIZE,
  });
}
