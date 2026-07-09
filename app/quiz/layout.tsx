import "../styles/shadcn.css";
import "../styles/quiz.css";
import Link from "next/link";

/*
 * Scoped shadcn/Tailwind layout for the quiz feature, mirroring the pattern
 * documented for the future admin section (see MIGRATION_PLAN.md): shadcn.css
 * is imported only here, never globally, so Tailwind's Preflight reset never
 * reaches the pixel-parity public pages (home/explore/city).
 */
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quiz-shell">
      <nav className="quiz-navbar" aria-label="Primary navigation">
        <div className="quiz-nav-container">
          <Link href="/" className="quiz-logo">VetRetire</Link>
          <ul className="quiz-nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/explore">Explore</Link></li>
            <li><Link href="/quiz" aria-current="page">Take the Quiz</Link></li>
          </ul>
        </div>
      </nav>
      <header className="quiz-hero">
        <div className="quiz-hero-content">
          <span className="quiz-hero-badge">Personalized Match</span>
          <h1>Find Your Perfect Fit</h1>
          <p>
            Answer a few quick questions about climate, budget, and lifestyle.
            We&apos;ll re-rank every location against what matters most to you.
          </p>
        </div>
      </header>
      <main className="quiz-main">{children}</main>
    </div>
  );
}
