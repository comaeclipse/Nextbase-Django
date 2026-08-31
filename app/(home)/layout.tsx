import "../styles/home.css";

/*
 * The home page lives in this (home) route group — a group so the URL stays "/"
 * — purely so home.css can be imported at the layout level instead of in
 * page.tsx. Layout CSS is applied before the page commits on a client-side
 * navigation; imported from the page, the first (uncached) visit to "/" (e.g.
 * clicking Home from a city page) flashes unstyled until its CSS chunk loads.
 * See app/city/[id]/layout.tsx for the full explanation.
 *
 * Pure pass-through: the page renders its own .home-page wrapper and PublicNav.
 */
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
