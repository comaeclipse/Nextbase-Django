import CareerTransitionClient from "@/components/career-transition/CareerTransitionClient";
import { getCareerTransitionCatalog } from "@/lib/career-transition";

export const dynamic = "force-dynamic";

export default async function CareerTransitionPage() {
  const catalog = await getCareerTransitionCatalog();
  return <CareerTransitionClient catalog={catalog} />;
}
