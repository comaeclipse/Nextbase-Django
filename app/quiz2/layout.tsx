import "../styles/shadcn.css";
import "../styles/quiz2.css";
import PublicNav from "@/components/PublicNav";
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
      <PublicNav active="quiz" />
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
