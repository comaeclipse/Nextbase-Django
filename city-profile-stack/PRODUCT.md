# What this is (read this first)

This subproject answers **two questions** about the cities in VetRetire's
database, using real evidence with honest caveats:

1. **"What's like Elko?"** — given a city, find the most similar towns in the
   database, and tell me the biggest way each one is *different*. (Optionally:
   "like Elko, but swap one thing" — e.g. same culture and economy, different
   climate.)

2. **"Best city for this kind of person?"** — given a description of someone
   (what they need, what they hate, their dealbreakers), rank the towns that fit
   and say the biggest problem with each.

A third option is on the table: instead of a full custom engine, we may just
build the clean, cited **dataset** and let an LLM/chatbot answer over it. The
research artifacts in `data/` are already most of that dataset.

## It already works today

Both questions run right now against all ~114 cities. Not a mock — real output:

```bash
# Question 1: what's like Elko?
node --env-file=.env node_modules/tsx/dist/cli.mjs \
  city-profile-stack/scripts/tools/find-similar-locations.ts "Elko, NV"
```
> Top matches: Casper WY, Grand Junction CO, Rapid City SD, Great Falls MT —
> mid-size Western mining/energy/outdoor towns. Each row names its biggest
> *difference* (e.g. Casper differs most on water-recreation access), because a
> place is only "like" another if nothing about it would blindside you.

```bash
# Question 2: best city for a retired vet who hates humidity, needs VA care, lives outdoors
node --env-file=.env node_modules/tsx/dist/cli.mjs \
  city-profile-stack/scripts/tools/match-profile.ts \
  city-profile-stack/data/profiles/examples/retired-vet-dry-outdoors.json
```
> Top matches: Billings MT, Cheyenne WY, El Paso TX — with the biggest unmet
> preference per city, and 15 cities disqualified on a dealbreaker.

If those two commands are what you care about, **the product is built.**
Everything else in this folder exists to make their answers trustworthy.

## Plain-language glossary (no more mystery words)

- **Feature** — a 0-to-1 score for one trait of a place (e.g. `snow_burden`,
  `va_outpatient_access`). The products compare cities by these.
- **Texture** — how a place actually *feels* day to day (is a normal Tuesday
  night dead), as opposed to a raw statistic. It's just lived-experience detail.
- **Ontology** — the fixed list of allowed feature names (`lib/ontology.ts`), so
  two cities are always compared apples-to-apples. It's a controlled vocabulary,
  nothing fancier.
- **Dossier / signal / gold pack** — layers of research evidence behind the
  scores (raw write-up → display-ready observation → a fully-cited answer to one
  hard question). See `data/README.md`.

## How the pieces serve the two questions

| You want... | It comes from... |
| --- | --- |
| The similarity answer (Q1) | `scripts/tools/find-similar-locations.ts` + `data/location-features.json` |
| The person-fit answer (Q2) | `scripts/tools/match-profile.ts` + `data/profiles/examples/*` |
| The 0-1 scores both use | `lib/ontology.ts` (the trait list) + `lib/derive.ts` (auto-fill from stats) |
| Trustworthy lived-experience detail | the research layer in `data/` (dossiers, gold packs, ledger) |
| Confidence it won't make things up | `data/evaluations/` (the test suite that forces honest "I don't know"s) |

## What is NOT the goal

- Not a chatbot that free-associates. Every answer traces to evidence or says
  it can't.
- Not a single "similarity score." Q1 reports *where* two cities diverge, not one
  number that hides it.
- Not wired into the live VetRetire UI yet. That's a later, explicit decision
  (see ROADMAP.md Phase 6) — the open question is whether these two answers
  should surface on the site's Lifestyle / similarity views, or stay a research
  tool.

## The honest status

The **product runs**. The **evidence layer under it is partial** — a few cities
are deeply researched (Elko, Odessa), most are auto-filled from statistics. The
real remaining work is breadth of trustworthy evidence and the go/no-go on
putting this in front of users — not rebuilding the engine.
