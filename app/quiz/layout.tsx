import "../styles/shadcn.css";
import "../styles/quiz.css";
import PublicNav from "@/components/PublicNav";

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
      <PublicNav active="quiz" />
      <header className="quiz-hero">
        <div className="quiz-hero-content">
          <span className="quiz-hero-badge">Dealbreaker Cards</span>
          <h1>Find Your Perfect Fit</h1>
          <p>
            Ten quick flash cards. Agree, disagree, or say it doesn&apos;t
            matter — each answer can rule places in or out.
          </p>
        </div>
      </header>
      <main className="quiz-main">{children}</main>
    </div>
  );
}
