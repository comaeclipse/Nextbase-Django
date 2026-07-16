import Link from "next/link";

type NavKey =
  | "home"
  | "explore"
  | "map"
  | "quiz"
  | "weather"
  | "uv"
  | "critters"
  | "air-quality"
  | "insurance";

const LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "explore", href: "/explore", label: "Explore" },
  { key: "map", href: "/map", label: "Map" },
  { key: "quiz", href: "/quiz", label: "Take the Quiz" },
  { key: "weather", href: "/weather", label: "Weather" },
  { key: "uv", href: "/uv", label: "UV" },
  { key: "critters", href: "/critters", label: "Critters" },
  { key: "air-quality", href: "/air-quality", label: "Air Quality" },
  { key: "insurance", href: "/insurance", label: "Insurance" },
];

export default function PublicNav({ active }: { active?: NavKey }) {
  return (
    <nav className="site-navbar" aria-label="Primary navigation">
      <div className="site-nav-container">
        <Link href="/" className="site-logo">
          VetRetire
        </Link>
        <ul className="site-nav-links">
          {LINKS.map((link) => (
            <li key={link.key}>
              <Link href={link.href} aria-current={active === link.key ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
