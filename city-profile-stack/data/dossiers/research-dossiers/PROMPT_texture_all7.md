**TARGET CITIES: Elko, Nevada · Atlanta, Georgia · Casper, Wyoming · Nashville, Tennessee · Sierra Vista, Arizona · Billings, Montana · Rapid City, South Dakota**

I do not want a relocation summary. I have those. I want the **texture** of these
places — the specific, concrete, observable things that tell you what it is
actually like to be there, which never survive into a "pros and cons" list.

Your source is what residents actually say: Reddit local and state subreddits,
relocation and "what is it really like" threads, and especially the offhand
comments in threads about something else entirely. The best texture is usually
found sideways — somebody complaining about parking mentions that the whole
downtown shuts at eight, and *that* is the finding.

---

## What I am asking for

Concrete details, in residents' own words wherever possible. Examples of the
kind of thing that is useful:

- "There is no 24-hour anything. Not even a Waffle House."
- "People do yoga in the park while a jazz band plays on the corner."
- "Everybody waves from their truck. You will feel rude within a week."
- "Half the bumper stickers are for the same local brewery."
- "Nobody locks their side door and they think it is weird that I do."
- "You can tell who is new because they are the only ones wearing a coat."
- "The town shuts down for the high school game and I mean everything."
- "Every third car has a kayak or a dog or both."
- "There are more breweries than grocery stores and that is not a joke."

Examples of what is NOT useful, and which I will discard:

- "It has a vibrant arts scene." — generic, unfalsifiable, could be anywhere.
- "The people are friendly." — every city claims this. What do they *do*?
- "Great restaurants and outdoor recreation." — marketing copy.
- "Good quality of life." — means nothing.

**The test: could this sentence be true of two hundred other American cities?
If yes, throw it out.** I want the detail that is only true here, or is
unusually true here.

---

## BLOCK A — Texture markers

15–30 per city. JSON:

```json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "markers": [
    {
      "marker_key": "lowercase_snake_case_unique_within_this_city",
      "domain": "street_life | commerce | pace | social_norms | aesthetics | sound | ritual | food_culture | transport_habit | local_lore",
      "observation": "The concrete thing, one or two plain sentences. What would you SEE or NOTICE.",
      "verbatim": "The resident's own words, quoted exactly, if you found a good line. Null if not.",
      "salience": 3,
      "valence": "charming | grating | neutral | contested",
      "evidences": ["character_feature_key", "..."],
      "evidence_kind": "community_sentiment | single_resident_account | community_sentiment_under_sampled",
      "confidence": "limited | medium | high",
      "source_urls": ["https://..."],
      "source_retrieved_on": "YYYY-MM-DD"
    }
  ]
}
```

Rules that matter:

- **`verbatim` is the most valuable field.** Quote residents exactly. Do not
  clean up their grammar, soften their profanity, or make it sound neutral.
  "It's dead as hell after 9" is better data than "limited evening activity."
- **`salience` 1–5** is how much this *defines* the place, not how vivid it is.
  A single beloved diner can be vivid and peripheral (2). Everything closing at
  nine is mundane and defining (5).
- **`valence: contested`** whenever residents split on whether it is charming or
  grating. That split is a finding — it is usually the exact thing that makes
  one person stay and another leave. Say who loves it and who hates it in the
  observation.
- **`domain: sound`** is under-used and worth hunting for. What does the place
  sound like — trains, cicadas, sirens, wind, nothing at all?
- **`local_lore`** means the stories residents tell about themselves. Local
  nicknames, running jokes, the thing everyone warns newcomers about, the
  event everyone references.
- Every marker needs a real `https://` source URL. Do not invent them.

---

## BLOCK B — Character scores

Score these from the markers you found. **Omit any you did not find real
evidence for** — an unscored feature is a correct outcome, an invented one
poisons the dataset.

```json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "features": {
    "<key from below>": {
      "value": 0.0,
      "confidence": 0.0,
      "evidence": "Which specific markers produced this number.",
      "markers": ["marker_key", "..."]
    }
  },
  "gaps": ["not_researched: ... | searched_not_found: ... | discussed_but_unscoreable: ..."]
}
```

Values are 0.0–1.0. `capacity` means more is more of the thing; `intensity`
means a magnitude that is neither good nor bad — score the magnitude, not
whether you approve.

Confidence is 0.0–0.9 and measures **evidence quality**, not how strongly the
narrative was worded. One vivid comment is 0.3 no matter how memorable it is.
Many independent residents describing the same thing is 0.8.

### Character vocabulary — use these keys exactly

- `quirk_embrace` (intensity) — 1.0 = Eccentricity is celebrated; being odd is a form of belonging; 0.0 = There is a strong sense of how one is supposed to be, and visible deviation is noticed
- `street_life_vibrancy` (capacity) — 1.0 = People spontaneously occupy public space — buskers, park gatherings, sidewalk life; 0.0 = Public space is transited, not inhabited; social life happens indoors and by arrangement
- `independent_business_character` (intensity) — 1.0 = The places people name are one-offs — owner-run, idiosyncratic, unreplicable; 0.0 = The commercial landscape is national brands and could be anywhere
- `neighborliness` (capacity) — 1.0 = Neighbours know each other, lend things, notice absence, show up unprompted; 0.0 = People are cordial and separate; you could live a year without learning a name
- `late_night_availability` (capacity) — 1.0 = Something is open and someone is out at 1am on a Tuesday; 0.0 = The place closes early and completely; there is no 24-hour anything
- `creative_participation` (capacity) — 1.0 = Ordinary residents make things — bands, murals, markets, theatre, zines; 0.0 = Culture is something bought and attended rather than produced
- `status_performance` (intensity) — 1.0 = Visible signalling of money, taste or insider standing shapes social life; 0.0 = Unpretentious; what you drive and where you eat carry little social weight
- `civic_identity_intensity` (intensity) — 1.0 = Being from here is an identity people carry and defend; 0.0 = Where you live is an address, not a self-description
- `population_rootedness` (intensity) — 1.0 = Multigenerational families, long tenures, deep local memory; 0.0 = Most people arrived recently and many will leave; the population turns over
- `subculture_depth` (capacity) — 1.0 = Whatever you are into, there are enough others to form a real scene; 0.0 = Niche interests are pursued alone or online

---

## Finally

If two or more cities are listed above, add a short **comparison** section at
the end: for each character feature where the cities genuinely differ, one
sentence naming the difference in concrete terms. Not "City A is more
walkable" — rather "In City A people are on the sidewalk at 10pm; in City B
the sidewalks are for getting from the car to the door."

And end with **the one detail per city that a visitor would notice in the first
hour and never see mentioned in any official description.**
