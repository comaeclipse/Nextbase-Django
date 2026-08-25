# Database boundary

The City Profile Stack owns only additive database objects:

- `location_research_dossiers`
- `location_profile_signals`
- `location_features`
- `location_genre_assignments`
- `location_texture_markers`
- `location_features_resolved` (view)

It never alters `locations_location` or `locations_stateinfo`. Migration files
are deliberately kept separate from importers so schema setup is explicit and
repeatable. The authoritative column-level definitions remain in the City
Profile Stack section of the repository-root `SCHEMA.md`.

Genre keys and lifecycle status are owned by
`city-profile-stack/lib/genre-ontology.ts`, not by a mutable database lookup
table. `location_genre_assignments` stores only versioned, evidence-backed city
memberships; the registry currently contains two provisional micro families and
no admitted genres.
