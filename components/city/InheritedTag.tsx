/*
 * Source labels for values a geography did not report itself.
 *
 * These render only when provenance.kind === "inherited", which is never true
 * for a row with no ancestry. Every curated city therefore emits a
 * byte-identical DOM to before this component existed -- pixel parity on
 * /city/[id] is not preserved carefully here, it is unreachable.
 */
import type { ResolvedField } from "@/lib/geo-inheritance";
import { describeProvenance } from "@/lib/geo-inheritance";

/**
 * The "· Los Angeles, CA" suffix. Renders inside the existing `.spec-val`
 * span so `.spec`'s space-between flex layout is untouched.
 */
export function InheritedTag({ field }: { field?: ResolvedField<unknown> }) {
  if (!field || field.provenance.kind !== "inherited") return null;
  const p = field.provenance;
  return (
    <span className="spec-src" title={describeProvenance(field) ?? undefined}>
      {p.sourceEntityLabel}
    </span>
  );
}

/**
 * A `.spec-val` that cannot silently present a wider geography's number as
 * this place's own.
 *
 * `context_only` fields (crime, TCI, election margins) are reported by an
 * agency whose jurisdiction is bigger than the subject, so showing one bare
 * would be a quiet factual error. In development that throws; in production it
 * falls back to hiding the value rather than shipping the misattribution.
 */
export function SpecValue({
  field,
  children,
  fallback = "—",
}: {
  field?: ResolvedField<unknown>;
  children?: React.ReactNode;
  fallback?: string;
}) {
  const inherited = field?.provenance.kind === "inherited";

  if (field && field.presentation === "context_only" && field.value != null && !inherited) {
    const message =
      "A context_only field resolved to a value with no inherited provenance to label it. " +
      "It describes a wider geography and must not render bare.";
    if (process.env.NODE_ENV !== "production") throw new Error(message);
    return <span className="spec-val">{fallback}</span>;
  }

  return (
    <span className="spec-val">
      {children ?? fallback}
      <InheritedTag field={field} />
    </span>
  );
}

/**
 * The banner above the KPI grid on a non-city page, explaining once what the
 * per-field labels mean so each individual label can stay terse.
 */
export function GeoScopeNote({
  geoTypeLabel,
  parentLabel,
}: {
  geoTypeLabel: string;
  parentLabel: string;
}) {
  return (
    <div className="geo-note">
      This is a {geoTypeLabel} of {parentLabel}. Figures carrying a source label
      are reported for that wider area, not measured for this place on its own.
    </div>
  );
}
