import "../styles/shadcn.css";

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
    <div className="min-h-screen bg-background font-sans text-foreground">
      {children}
    </div>
  );
}
