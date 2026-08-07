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

## Coverage

The initial suite has 28 questions:

- 8 Elko questions, including venue availability, an attribution trap,
  attendance abstention, and trans-youth abstention.
- 8 Odessa questions, including late food, karaoke sourcing, Midessa geography,
  and causality traps.
- 8 North Platte questions and 4 cross-city questions, including
  industrial-versus-social rhythm, county-versus-city politics, comparability
  gaps, and the three-city hypothesis.

The questions are intentionally not all answerable. A retrieval system that
answers every one is failing the purpose of this project.

## How to use it now

Run the questions manually against the checked-in fixtures and record failures
as missing vocabulary, missing metadata, source-gap, or answer-generation
failures. Do not add pgvector or a production UI until the suite exposes a
specific retrieval failure that full-text and structured metadata cannot solve.
