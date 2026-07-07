# State Law Data Update Instructions

Use this guide when an LLM or operator needs to refresh `StateInfo` gun-law fields in the Neon database.

## Target Table

The Django model is `locations.models.StateInfo`.

Relevant fields:

- `state`: two-letter state abbreviation, primary key.
- `magazine_limit`: text description of statewide magazine capacity limit.
- `ghost_gun_ban`: compact `Y` / `N` flag for whether ghost guns are regulated or banned.
- `assault_weapons_ban`: boolean for a general statewide assault-weapons ban.
- `high_cap_mag_ban`: boolean for whether the state has a high-capacity magazine policy.
- `gifford_score`: existing scorecard grade. Do not overwrite it unless explicitly refreshing scorecard data.

The current DB row format looks like:

```text
CA|10 rounds|Y|True|True|A
MD|10 rounds; no possession ban|Y|True|True|A-
VA|15 rounds; 2026 law under injunction|Y|False|True|B+
AK|No statewide magazine capacity limit|N|False|False|F
```

Column order in that example is:

```text
state|magazine_limit|ghost_gun_ban|assault_weapons_ban|high_cap_mag_ban|gifford_score
```

## Inspect Current DB State

From the repo root, load the Neon `DATABASE_URL` without printing it:

```powershell
$line = Get-Content .env.vercel | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
$env:DATABASE_URL = ($line -split '=',2)[1].Trim().Trim('"').Trim("'")
```

Then query the current rows:

```powershell
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','vetretire_project.settings'); import django; django.setup(); from locations.models import StateInfo; print('state|magazine_limit|ghost_gun_ban|assault_weapons_ban|high_cap_mag_ban|gifford_score'); [print('|'.join(str(r[k]) for k in ['state','magazine_limit','ghost_gun_ban','assault_weapons_ban','high_cap_mag_ban','gifford_score'])) for r in StateInfo.objects.order_by('state').values('state','magazine_limit','ghost_gun_ban','assault_weapons_ban','high_cap_mag_ban','gifford_score')]"
```

Expected coverage:

- 50 rows.
- No blank `magazine_limit`.
- No blank `ghost_gun_ban`.
- Only 50 states; do not insert DC or territories unless the product scope changes.

## Authoritative Retrieval Sources

Because gun-law data changes, always re-check live sources before changing DB rows.

Use these sources:

- Magazine thresholds and high-capacity magazine state list:
  - `https://giffords.org/lawcenter/gun-laws/policy-areas/hardware-ammunition/large-capacity-magazines/`
  - Cross-check with `https://everytownresearch.org/rankings/law/high-capacity-magazines-prohibited/`
- Ghost-gun regulation state list:
  - `https://everytownresearch.org/rankings/law/ghost-guns-regulated/`
- General assault-weapons ban state list, if refreshing that field too:
  - `https://giffords.org/lawcenter/gun-laws/policy-areas/hardware-ammunition/assault-weapons/`

For states with active injunctions, newly effective laws, or pending effective dates, search current legal/news sources and encode the caveat in `magazine_limit` rather than pretending the law is settled. Virginia is the current example: `15 rounds; 2026 law under injunction`.

## Normalization Rules

Use these field formats exactly.

### `magazine_limit`

For states with no statewide capacity policy:

```text
No statewide magazine capacity limit
```

For states with a simple threshold:

```text
10 rounds
15 rounds
17 rounds
```

For firearm-specific thresholds:

```text
10 rounds for handguns
10 rounds for long guns; 15 rounds for handguns
```

For possession caveats that matter to users:

```text
10 rounds; no possession ban
10 rounds; no possession ban
15 rounds; 2026 law under injunction
```

Keep this field concise. It is product-facing regulatory summary text, not a full legal memo.

### `ghost_gun_ban`

Use `Y` if Everytown marks the state as adopted under `Ghost Guns Regulated`.

Use `N` if Everytown marks the state as not adopted.

Do not store full ghost-gun policy details here; `ghost_gun_ban` is `max_length=5`.

### `high_cap_mag_ban`

Use `True` if the state has adopted a high-capacity magazine policy.

Use `False` otherwise.

This boolean should align with the `magazine_limit` text. If `magazine_limit` is `No statewide magazine capacity limit`, `high_cap_mag_ban` should usually be `False`.

### `assault_weapons_ban`

Use `True` only for a general statewide assault-weapons ban. Do not mark a state `True` merely because it has narrower assault-weapon regulations, training requirements, age limits, or pending/injoined restrictions.

## Update Path

Preferred path: update the static mapping in:

```text
locations/management/commands/update_state_law_data.py
```

The mapping shape is:

```python
STATE_LAW_DATA = {
    "CA": ("10 rounds", "Y", True),
    "AK": ("No statewide magazine capacity limit", "N", False),
}
```

Tuple order:

```python
(magazine_limit, ghost_gun_ban, high_cap_mag_ban)
```

After editing, run:

```powershell
python manage.py update_state_law_data --dry-run
```

Inspect every proposed change. If correct, run:

```powershell
python manage.py update_state_law_data
```

Do not print `.env.vercel` contents or connection strings in logs or responses.

## Verification

Run Django checks:

```powershell
python manage.py check
```

Verify no missing values remain:

```powershell
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','vetretire_project.settings'); import django; django.setup(); from locations.models import StateInfo; rows=list(StateInfo.objects.order_by('state').values('state','magazine_limit','ghost_gun_ban','high_cap_mag_ban')); print('rows', len(rows)); print('magazine_limit_missing', [r['state'] for r in rows if not r['magazine_limit']]); print('ghost_gun_ban_missing', [r['state'] for r in rows if not r['ghost_gun_ban']]); print('ghost_y', ','.join(r['state'] for r in rows if r['ghost_gun_ban']=='Y')); print('high_cap_true', ','.join(r['state'] for r in rows if r['high_cap_mag_ban']));"
```

Then confirm the command is idempotent:

```powershell
python manage.py update_state_law_data --dry-run
```

Expected final output:

```text
Dry run: 0 row(s) would change.
```

## Importer Notes

`locations/management/commands/import_state_info.py` supports CSV ingestion for state data. It expects source CSV columns such as:

- `State`
- `MagazineLimit`
- `GiffordScore`
- `GhostGunBan`
- `AssaultWeaponBan` or `AssaultWeaponsBan`
- optional `HighCapMagBan`

Prefer the dedicated `update_state_law_data` command for legal-policy refreshes. Use the CSV importer only when a curated CSV is the source of truth.
