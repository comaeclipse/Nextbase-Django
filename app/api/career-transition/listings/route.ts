import { NextRequest, NextResponse } from "next/server";
import { getCareerTransitionCatalog } from "@/lib/career-transition";
import { listingsForSpecialty } from "@/lib/career-listings-bridge";

/*
 * Live defense-job openings for one military specialty, powering the "Live
 * openings" section on /career-transition. The specialty is identified by
 * (branch, code) — the same key the client already uses to index the catalog.
 *
 * The bridge (lib/career-listings-bridge.ts) owns the specialty→listings join:
 * it only surfaces listings from employers mapped to this specialty and matching
 * its keywords, and returns an honest status/fallback otherwise. Keeping the
 * call server-side keeps the bridge's DB imports out of the client bundle.
 *
 * Query params: branch, code, optional city/state. Response: SpecialtyListings JSON, or
 * { status: "unmapped", ... } equivalent when the specialty isn't in the catalog.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const branch = sp.get("branch")?.trim();
  const code = sp.get("code")?.trim();
  const city = sp.get("city")?.trim() || null;
  const state = sp.get("state")?.trim() || null;

  if (!branch || !code) {
    return NextResponse.json(
      { error: "branch and code query params are required" },
      { status: 400 }
    );
  }

  const catalog = await getCareerTransitionCatalog();
  const match = catalog.matches.find(
    (m) => m.specialty.branch === branch && m.specialty.code === code
  );

  if (!match) {
    return NextResponse.json(
      { error: `No seeded specialty for branch=${branch} code=${code}` },
      { status: 404 }
    );
  }

  const result = await listingsForSpecialty(match, undefined, { city, state });
  return NextResponse.json(result);
}
