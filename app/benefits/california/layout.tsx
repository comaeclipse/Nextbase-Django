import "../../styles/california-benefits.css";

/*
 * california-benefits.css is imported HERE (layout level), not in page.tsx, so
 * Next applies it before the page commits on a client-side navigation. Imported
 * from the page, the first (uncached) visit flashes unstyled until the page's
 * CSS chunk loads. See app/city/[id]/layout.tsx for the full explanation.
 *
 * Pure pass-through: the page renders its own wrapper and PublicNav.
 */
export default function CaliforniaBenefitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
