"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Minus, X } from "lucide-react";
import type { Location, StateInfoRow } from "@/lib/types";
import {
  DEFAULT_QUIZ_PROFILE,
  FLASH_QUESTIONS,
  filterByQuizProfile,
  firstUnansweredStep,
  isQuizComplete,
  setQuizProfileCookie,
  clearQuizProfileCookie,
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
  const seed = initialProfile ?? DEFAULT_QUIZ_PROFILE;
  const [answers, setAnswers] = useState<QuizProfile>(seed);
  const [step, setStep] = useState(() =>
    isQuizComplete(seed) ? 0 : firstUnansweredStep(seed)
  );
  const [finished, setFinished] = useState(() => isQuizComplete(seed));
  const [cardKey, setCardKey] = useState(0);
  const [pendingStance, setPendingStance] = useState<Stance | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const total = FLASH_QUESTIONS.length;
  const question = FLASH_QUESTIONS[step];
  const answeredCount = FLASH_QUESTIONS.filter(
    (q) => answers.answers[q.id] != null
  ).length;
  const progressPct = finished
    ? 100
    : Math.round(
        ((answeredCount + (pendingStance ? 1 : 0)) / total) * 100
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
    const nextProfile: QuizProfile = {
      ...answers,
      answers: { ...answers.answers, [question.id]: stance },
    };

    advanceTimer.current = window.setTimeout(() => {
      setAnswers(nextProfile);
      setPendingStance(null);
      advanceTimer.current = null;

      if (step < total - 1) {
        setStep((s) => s + 1);
        setCardKey((k) => k + 1);
      } else {
        setQuizProfileCookie(nextProfile);
        setFinished(true);
      }
    }, 220);
  }

  function goBack() {
    if (pendingStance || step === 0) return;
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
      setPendingStance(null);
    }
    setStep((s) => s - 1);
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
    setStep(0);
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
            Card {step + 1} of {total}
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
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
          disabled={step === 0 || pendingStance != null}
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
