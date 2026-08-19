import { NextRequest, NextResponse } from "next/server";
import { getAllLocations, getAllStateInfo, getEmployerIndex, getMilitaryProximityIndex } from "@/lib/locations";
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
    income_tax: sp.get("income_tax"),
    no_income_tax: sp.get("no_income_tax"),
    retired_pay_tax: sp.get("retired_pay_tax"),
    disabled_vet_property_tax: sp.get("disabled_vet_property_tax"),
    employment_preference: sp.get("employment_preference"),
    education_benefit: sp.get("education_benefit"),
    parks_benefit: sp.get("parks_benefit"),
    hunt_fish_benefit: sp.get("hunt_fish_benefit"),
    vibes: sp.get("vibes"),
    employers: sp.get("employers"),
    defense_ecosystem: sp.get("defense_ecosystem"),
    near_base: sp.get("near_base"),
    base_branch: sp.get("base_branch"),
    base_max_distance: sp.get("base_max_distance"),
    has_walmart: sp.get("has_walmart"),
    has_costco: sp.get("has_costco"),
    sort: sp.get("sort"),
  };

  const [locations, stateInfos, employerIndex, militaryIndex] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    getEmployerIndex(),
    getMilitaryProximityIndex(),
  ]);

  const results = filterAndSort(locations, stateInfos, params, {
    employerIndex,
    militaryIndex,
  });
  return NextResponse.json({
    totalResults: results.length,
    locations: results,
  });
}
