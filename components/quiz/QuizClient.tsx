"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Minus, X } from "lucide-react";
import type { Location, StateInfoRow } from "@/lib/types";
import {
  DEFAULT_QUIZ_PROFILE,
  FLASH_QUESTIONS,
  filterByQuizProfile,
  firstUnansweredQuestionId,
  getVisibleQuestions,
  isQuizComplete,
  sanitizeQuizProfile,
  setQuizProfileCookie,
  clearQuizProfileCookie,
  type FlashQuestionId,
  type QuizProfile,
  type Stance,
} from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import QuizResults from "./QuizResults";

const STANCES: {
  value: Stance;
  label: string;
  icon: typeof Check;
  className: string;
}[] = [
  {
    value: "agree",
    label: "I agree",
    icon: Check,
    className: "quiz-stance-agree",
  },
  {
    value: "neutral",
    label: "Doesn't matter",
    icon: Minus,
    className: "quiz-stance-neutral",
  },
  {
    value: "disagree",
    label: "I disagree",
    icon: X,
    className: "quiz-stance-disagree",
  },
];

export default function QuizClient({
  initialLocations,
  stateInfos,
  initialProfile,
}: {
  initialLocations: Location[];
  stateInfos: StateInfoRow[];
  initialProfile: QuizProfile | null;
}) {
  const seed = useMemo(
    () => sanitizeQuizProfile(initialProfile ?? DEFAULT_QUIZ_PROFILE),
    [initialProfile]
  );
  const [answers, setAnswers] = useState<QuizProfile>(seed);
  const [currentId, setCurrentId] = useState<FlashQuestionId | null>(() =>
    firstUnansweredQuestionId(seed)
  );
  const [finished, setFinished] = useState(() => isQuizComplete(seed));
  const [cardKey, setCardKey] = useState(0);
  const [pendingStance, setPendingStance] = useState<Stance | null>(null);
  const advanceTimer = useRef<number | null>(null);

  // Cards whose earlier answers already made them a dead end (contradiction
  // or redundant) are filtered out of this list entirely, so the visible
  // question count — and "Card X of Y" — shrinks as the visitor answers.
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers.answers),
    [answers]
  );
  const total = visibleQuestions.length;
  const currentIndex = currentId
    ? visibleQuestions.findIndex((q) => q.id === currentId)
    : -1;
  const question = currentIndex === -1 ? null : visibleQuestions[currentIndex];
  const skippedCount = FLASH_QUESTIONS.length - total;
  const answeredCount = visibleQuestions.filter(
    (q) => answers.answers[q.id] != null
  ).length;
  const progressPct = finished
    ? 100
    : Math.round(
        ((answeredCount + (pendingStance ? 1 : 0)) / Math.max(total, 1)) * 100
      );

  const matches = useMemo(() => {
    if (!finished) return [];
    return filterByQuizProfile(initialLocations, stateInfos, answers).slice(
      0,
      6
    );
  }, [finished, answers, initialLocations, stateInfos]);

  function choose(stance: Stance) {
    if (pendingStance || !question) return;
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
    }

    setPendingStance(stance);
    const nextProfile = sanitizeQuizProfile({
      ...answers,
      answers: { ...answers.answers, [question.id]: stance },
    });

    advanceTimer.current = window.setTimeout(() => {
      setAnswers(nextProfile);
      setPendingStance(null);
      advanceTimer.current = null;

      const nextVisible = getVisibleQuestions(nextProfile.answers);
      const answeredIdx = nextVisible.findIndex((q) => q.id === question.id);
      const next = nextVisible[answeredIdx + 1] ?? null;

      if (next) {
        setCurrentId(next.id);
        setCardKey((k) => k + 1);
      } else {
        setQuizProfileCookie(nextProfile);
        setFinished(true);
      }
    }, 220);
  }

  function goBack() {
    if (pendingStance || currentIndex <= 0) return;
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
      setPendingStance(null);
    }
    setCurrentId(visibleQuestions[currentIndex - 1].id);
    setCardKey((k) => k + 1);
  }

  function retake() {
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    clearQuizProfileCookie();
    setAnswers(DEFAULT_QUIZ_PROFILE);
    setFinished(false);
    setCurrentId(FLASH_QUESTIONS[0].id);
    setCardKey((k) => k + 1);
    setPendingStance(null);
  }

  if (finished) {
    return (
      <QuizResults matches={matches} profile={answers} onRetake={retake} />
    );
  }

  if (!question) return null;

  const selected = pendingStance ?? answers.answers[question.id];

  return (
    <div className="quiz-flow">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Card {currentIndex + 1} of {total}
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
        {skippedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Skipped {skippedCount} {skippedCount === 1 ? "card" : "cards"} —
            your climate answer already settled {skippedCount === 1 ? "it" : "them"}.
          </p>
        )}
      </div>

      <div
        key={cardKey}
        className="quiz-flash-card"
        role="group"
        aria-labelledby={`quiz-q-${question.id}`}
      >
        <p className="quiz-flash-eyebrow">How do you feel about this?</p>
        <h2 id={`quiz-q-${question.id}`} className="quiz-flash-statement">
          {question.statement}
        </h2>
        {question.hint && <p className="quiz-flash-hint">{question.hint}</p>}

        <div className="quiz-stance-list">
          {STANCES.map(({ value, label, icon: Icon, className }) => (
            <button
              key={value}
              type="button"
              className={cn(
                "quiz-stance-btn",
                className,
                selected === value && "is-selected"
              )}
              onClick={() => choose(value)}
              disabled={pendingStance != null}
            >
              <span className="quiz-stance-icon" aria-hidden>
                <Icon />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentIndex <= 0 || pendingStance != null}
        >
          Back
        </Button>
        <p className="text-xs text-muted-foreground">
          Tap an answer to continue
        </p>
      </div>
    </div>
  );
}
