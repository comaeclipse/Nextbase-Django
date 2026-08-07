# City Profile Evaluation Protocol v1

This is the quality gate before a schema, embedding store, or product answer
path. The test suite lives in
`data/evaluations/city-profile-eval-v1.json`.

## What success means

For each question, grade the answer on six dimensions:

1. **Answer mode:** did it answer, qualify, correct, or abstain as required?
2. **Traceability:** does every material sentence point to the required claim
   fixture or a source-backed claim inside it?
3. **Geography:** does it keep city, county, regional, and mixed-geography
   evidence distinct?
4. **Time:** does it retain ordinary-week, day-of-week, and source-date scope?
5. **Counterevidence:** does an answer retain the evidence that narrows it?
6. **Unsupported inference:** did it infer attendance from hours, youth safety
   from politics, causality from two cities, or a ranking from unequal evidence?

## Score each dimension

- **2 - pass:** correct and explicit.
- **1 - partial:** broadly safe but missing an important caveat or trace.
- **0 - fail:** makes the prohibited inference, loses scope, or answers when
  the fixture requires abstention.

An evaluation answer fails the suite if it receives a zero on answer mode,
traceability, or unsupported inference. A strong average cannot offset a
confidently unsupported claim.

### Answer mode is symmetric: over-answering and over-abstention both fail

Answer mode scores 0 in **both** directions:

- **Over-answering:** it answers or asserts when the fixture requires
  abstention or correction.
- **Over-abstention:** it abstains, or hedges so heavily it delivers no usable
  conclusion, when the fixture supports a `qualified_answer`.

This matters because 15 of the 29 questions accept an abstention as a passing
mode, so a system that simply refuses everything would look deceptively safe. An
evidence-bound product that never concludes is a failure, not a cautious
success. `expected_mode: abstain_or_qualified_answer` is reserved for genuinely
ambiguous questions; do not read it as license to always abstain, and audit that
set as the corpus grows.

## Coverage

The suite has 29 questions:

- 9 Elko questions, including venue availability, an attribution trap,
  attendance abstention, trans-youth abstention, and a marketing-vs-lived
  conflicting-evidence question (E09).
- 8 Odessa questions, including late food, karaoke sourcing, Midessa geography,
  and causality traps.
- 8 North Platte questions and 4 cross-city questions, including
  industrial-versus-social rhythm, county-versus-city politics, comparability
  gaps, and the three-city hypothesis.

The questions are intentionally not all answerable. A retrieval system that
answers every one is failing the purpose of this project.

## What the v1 run actually measures

There is no retrieval or answer-generation system yet, so the first run is a
**fixture-completeness audit, not a system evaluation.** It answers "does the
checked-in corpus contain what a correct answer would need, and does it force
the right refusals?" — not "does a retriever behave." Treat a clean v1 run as
evidence about the *corpus*, not proof of a system. A real evaluation begins
when an independent answer path exists that can fail on its own.

To keep the audit honest, grade **adversarially**: for each question, attempt
the most overreaching answer the fixtures could be argued to support, and see
whether the fixtures stop you. A charitable self-grade teaches nothing, because
the same judgment that wrote the packs would write the answers.

## How to use it now

Run the questions manually against the checked-in fixtures and record each
failure as one of:

- `missing_vocabulary` — no field/term exists to express the needed distinction.
- `missing_metadata` — the fact exists but lacks the scope/date/stance tag a
  correct answer must cite.
- `source_gap` — the corpus simply lacks the evidence (a correct abstention).
- `generation` — the fixture is sufficient but an answer could still go wrong.

That mapping is the point: it tells you whether Phase 2 needs a schema change,
Phase 3 needs retrieval, or the corpus needs more research. Do not add pgvector
or a production UI until the suite exposes a specific retrieval failure that
full-text and structured metadata cannot solve.

## Known fixture-quality caveats (for later)

- North Platte questions (N01, N06, N08) grade against
  `data/drafts/north-platte-ne-independent-rd.md`, a draft rather than a
  verified gold pack. A pass there is weaker evidence than a pass on Elko or
  Odessa; promote the draft or re-scope those questions before treating them as
  equivalent.
