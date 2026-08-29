import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type NavKey =
  | "home"
  | "explore"
  | "map"
  | "quiz"
  | "profile"
  | "weather"
  | "uv"
  | "gas"
  | "critters"
  | "air-quality"
  | "gun-freedom"
  | "insurance"
  | "veteran-benefits"
  | "electricity"
  | "politics"
  | "mosques"
  | "defense-jobs";

const LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "explore", href: "/explore", label: "Explore" },
  { key: "map", href: "/map", label: "Map" },
  { key: "quiz", href: "/quiz", label: "Take the Quiz" },
  { key: "profile", href: "/profile", label: "Profile" },
];

const DATA_LINKS: { key: NavKey; href: string; label: string; description: string }[] = [
  { key: "critters", href: "/critters", label: "Critters", description: "Local wildlife and pest activity" },
  { key: "uv", href: "/uv", label: "UV", description: "State-level UV exposure" },
  { key: "gas", href: "/gas", label: "Gas Prices", description: "State-level gas price averages" },
  { key: "weather", href: "/weather", label: "Weather", description: "Climate and comfort data" },
  { key: "air-quality", href: "/air-quality", label: "Air Quality", description: "Annual AQI and historical smoke" },
  { key: "gun-freedom", href: "/gun-freedom", label: "Gun Freedom", description: "State firearm-policy index" },
  { key: "politics", href: "/politics", label: "Politics", description: "State political landscape" },
  { key: "insurance", href: "/insurance", label: "Insurance", description: "Home and auto cost benchmarks" },
  { key: "veteran-benefits", href: "/veteran-benefits", label: "Veteran Benefits", description: "State-created veteran benefit rankings" },
  { key: "electricity", href: "/electricity", label: "Electricity", description: "Residential electricity prices" },
  { key: "mosques", href: "/mosques", label: "Mosques", description: "Find a mosque near a retirement city" },
  { key: "defense-jobs", href: "/defense-jobs", label: "Defense Jobs", description: "Defense-industry openings by employer & sector" },
];

export default function PublicNav({ active }: { active?: NavKey }) {
  return (
    <nav className="site-navbar" aria-label="Primary navigation">
      <div className="site-nav-container">
        <Link href="/" className="site-logo">
          VetRetire
        </Link>
        <NavigationMenu className="site-nav-menu">
          <NavigationMenuList className="site-nav-links">
            {LINKS.map((link) => (
              <NavigationMenuItem key={link.key}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={navigationMenuTriggerStyle({ className: "site-nav-link" })}
                  aria-current={active === link.key ? "page" : undefined}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className="site-data-trigger"
                aria-current={DATA_LINKS.some((link) => link.key === active) ? "page" : undefined}
              >
                Data
              </NavigationMenuTrigger>
              <NavigationMenuContent className="site-data-menu-content">
                <ul aria-label="Data pages">
                  {DATA_LINKS.map((link) => (
                    <li key={link.key}>
                      <NavigationMenuLink
                        render={<Link href={link.href} />}
                        className="site-data-menu-link"
                        aria-current={active === link.key ? "page" : undefined}
                      >
                        <span>{link.label}</span>
                        <small>{link.description}</small>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
