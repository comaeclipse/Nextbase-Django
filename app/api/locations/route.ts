import { NextRequest, NextResponse } from "next/server";
import { getAllLocations, getAllStateInfo, getEmployerIndex } from "@/lib/locations";
import { filterAndSort, type FilterParams } from "@/lib/filters";

// Typed replacement for Django's HTMX filter endpoint (locations:filter_locations).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const params: FilterParams = {
    snow: sp.get("snow"),
    no_awb: sp.get("no_awb"),
    no_hcm: sp.get("no_hcm"),
    state_filter: sp.get("state_filter"),
    lgbtq_friendly: sp.get("lgbtq_friendly"),
    climate: sp.get("climate"),
    cost_of_living: sp.get("cost_of_living"),
    price_min: sp.get("price_min"),
    price_max: sp.get("price_max"),
    lifestyle: sp.get("lifestyle"),
    healthcare: sp.get("healthcare"),
    activities: sp.get("activities"),
    geography: sp.get("geography"),
    employers: sp.get("employers"),
    sort: sp.get("sort"),
  };

  const [locations, stateInfos, employerIndex] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    getEmployerIndex(),
  ]);

  const results = filterAndSort(locations, stateInfos, params, { employerIndex });
  return NextResponse.json({
    totalResults: results.length,
    locations: results,
  });
}
