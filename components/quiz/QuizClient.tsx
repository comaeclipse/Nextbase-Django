"use client";

import { useMemo, useState } from "react";
import type { Location, StateInfoRow } from "@/lib/types";
import { filterAndSort } from "@/lib/filters";
import { calculatePersonalizedScore } from "@/lib/scoring";
import {
  DEFAULT_QUIZ_PROFILE,
  QUIZ_QUESTIONS,
  profileToFilterParams,
  profileToWeights,
  setQuizProfileCookie,
  clearQuizProfileCookie,
  type QuizProfile,
  type QuizQuestion,
} from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import QuizResults from "./QuizResults";

const MULTI_IDS = new Set<keyof QuizProfile>(["climate", "activities"]);

function isMultiId(id: keyof QuizProfile): id is "climate" | "activities" {
  return MULTI_IDS.has(id);
}

/** Renders a checkbox list for a multi-select question with pre-narrowed props. */
function MultiChoiceList({
  id,
  options,
  selected,
  onToggle,
}: {
  id: "climate" | "activities";
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (id: "climate" | "activities", value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-2.5">
          <Checkbox
            id={`${id}-${opt.value}`}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onToggle(id, opt.value)}
          />
          <Label htmlFor={`${id}-${opt.value}`}>{opt.label}</Label>
        </div>
      ))}
    </div>
  );
}

export default function QuizClient({
  initialLocations,
  stateInfos,
  initialProfile,
}: {
  initialLocations: Location[];
  stateInfos: StateInfoRow[];
  initialProfile: QuizProfile | null;
}) {
  const [answers, setAnswers] = useState<QuizProfile>(
    initialProfile ?? DEFAULT_QUIZ_PROFILE
  );
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question: QuizQuestion | undefined = QUIZ_QUESTIONS[step];
  const progressPct = finished ? 100 : Math.round((step / total) * 100);

  const stateInfoByAbbr = useMemo(() => {
    const map: Record<string, StateInfoRow> = {};
    for (const s of stateInfos) map[s.state] = s;
    return map;
  }, [stateInfos]);

  const matches = useMemo(() => {
    if (!finished) return [];
    const filterParams = profileToFilterParams(answers);
    const weights = profileToWeights(answers);
    return filterAndSort(initialLocations, stateInfos, filterParams, (loc) =>
      calculatePersonalizedScore(loc, stateInfoByAbbr[loc.state], weights)
    ).slice(0, 6);
  }, [finished, answers, initialLocations, stateInfos, stateInfoByAbbr]);

  // The wizard is driven generically by QUIZ_QUESTIONS, so individual answer
  // updates can't be narrowed to a single QuizProfile key at compile time;
  // callers only ever pass a value matching the question's own type.
  function updateAnswer(
    id: keyof QuizProfile,
    value: string | string[]
  ) {
    setAnswers((prev) => ({ ...prev, [id]: value }) as QuizProfile);
  }

  function toggleMultiValue(id: "climate" | "activities", value: string) {
    setAnswers((prev) => {
      const current = prev[id];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [id]: next };
    });
  }

  function goNext() {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setQuizProfileCookie(answers);
      setFinished(true);
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function retake() {
    setAnswers(DEFAULT_QUIZ_PROFILE);
    clearQuizProfileCookie();
    setFinished(false);
    setStep(0);
  }

  if (finished) {
    return <QuizResults matches={matches} onRetake={retake} />;
  }

  if (!question) return null;

  return (
    <div className="quiz-flow">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {step + 1} of {total}
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          {question.description && (
            <CardDescription>{question.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {question.type === "single" && question.options && (
            <RadioGroup
              value={String(answers[question.id] ?? "")}
              onValueChange={(v) => updateAnswer(question.id, String(v))}
              className="flex flex-col gap-3"
            >
              {question.options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2.5">
                  <RadioGroupItem
                    id={`${question.id}-${opt.value}`}
                    value={opt.value}
                  />
                  <Label htmlFor={`${question.id}-${opt.value}`}>
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === "multi" && question.options && isMultiId(question.id) && (
            <MultiChoiceList
              id={question.id}
              options={question.options}
              selected={answers[question.id]}
              onToggle={toggleMultiValue}
            />
          )}

        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 0}>
          Back
        </Button>
        <Button onClick={goNext}>
          {step === total - 1 ? "See My Matches" : "Next"}
        </Button>
      </div>
    </div>
  );
}
