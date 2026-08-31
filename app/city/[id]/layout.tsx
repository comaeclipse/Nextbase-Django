import "../../styles/city.css";

/*
 * Pixel-parity city route. city.css is imported HERE (layout level), not in
 * page.tsx, so Next treats it as a segment dependency and applies it before the
 * page commits on a client-side navigation. Imported from the page instead, the
 * first (uncached) visit flashes unstyled: the page DOM commits while only
 * globals + the previous route's lingering Tailwind Preflight apply, until the
 * page's own CSS chunk finishes downloading. See app/quiz/layout.tsx for the
 * same pattern.
 *
 * This layout also wraps the /city/[id]/climate child, so city.css loads there
 * too — but harmlessly: none of its class/element selectors match that shadcn
 * page's markup, its `.city-page`/`body:has` rules can't match, and the climate
 * layout's shadcn.css loads AFTER this (child-after-parent) so it wins the only
 * overlap, the :root design tokens (--primary/--card/--border/--radius).
 *
 * Pure pass-through: each page renders its own wrapper (.city-page) and PublicNav.
 */
export default function CityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
