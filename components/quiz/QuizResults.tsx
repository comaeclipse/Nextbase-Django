"use client";

import Link from "next/link";
import type { Location } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function QuizResults({
  matches,
  onRetake,
}: {
  matches: Location[];
  onRetake: () => void;
}) {
  return (
    <div className="quiz-results">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Your Top Matches</h1>
        <p className="text-sm text-muted-foreground">
          Based on your answers, these locations fit you best. Head to Explore
          to see the full personalized list and filters.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No locations matched every preference — try loosening a filter or
            retaking the quiz.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {matches.map((loc) => (
            <Link key={loc.id} href={`/city/${loc.id}`} prefetch={false}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg text-xl"
                      style={{ background: loc.gradient }}
                    >
                      {loc.emoji}
                    </div>
                    <div className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                      {loc.calculated_match_score}% Fit
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{loc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {loc.state}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{loc.avg_home_value_display || "—"}</span>
                    <span>{loc.cost_of_living} cost</span>
                    <span>{loc.climate || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
        <Link href="/explore" className={buttonVariants({ size: "lg" })}>
          See All Matches on Explore
        </Link>
        <Button variant="outline" onClick={onRetake}>
          Retake the Quiz
        </Button>
      </div>
    </div>
  );
}
