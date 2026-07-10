import "../styles/shadcn.css";
import "../styles/quiz2.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";

/*
 * Scoped shadcn/Tailwind layout for the /quiz2 demo, mirroring app/quiz/layout.tsx:
 * shadcn.css is imported only here, never globally, so Tailwind's Preflight reset
 * never reaches the pixel-parity public pages (home/explore/city).
 */
export default function Quiz2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quiz2-shell">
      <nav className="quiz2-navbar" aria-label="Primary navigation">
        <div className="quiz2-nav-container">
          <Link href="/" className="quiz2-logo">VetRetire</Link>
          <ul className="quiz2-nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/explore">Explore</Link></li>
            <li><Link href="/quiz">Take the Quiz</Link></li>
            <li><Link href="/quiz2" aria-current="page">Profile Studio</Link></li>
          </ul>
        </div>
      </nav>
      <header className="quiz2-hero">
        <div className="quiz2-hero-content">
          <span className="quiz2-hero-badge">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Demo · Live matching
          </span>
          <h1>Build your retirement profile</h1>
          <p>
            Dial in what actually matters to you. Every slider and switch re-scores
            every location instantly — no submit button, no waiting.
          </p>
        </div>
      </header>
      <main className="quiz2-main">{children}</main>
    </div>
  );
}
