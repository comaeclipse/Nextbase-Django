"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  BRANCH_LABELS,
  searchSpecialties,
  type CareerTransitionCatalog,
  type EmployerMatchView,
  type MilitaryBranch,
  type RoleMatchView,
  type SkillMatchView,
  type SpecialtyMatchView,
} from "@/lib/career-transition-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const BRANCHES = Object.keys(BRANCH_LABELS) as MilitaryBranch[];

function directnessLabel(value: string) {
  if (value === "direct") return "Direct fit";
  if (value === "adjacent") return "Adjacent";
  return "Credential gap";
}

function skillKindLabel(value: string) {
  if (value === "technical") return "Technical skill";
  if (value === "domain") return "Domain knowledge";
  if (value === "credential") return "Credential";
  if (value === "clearance") return "Clearance";
  return "Safety";
}

function employerTypeLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
    >
      {label}
      <ExternalLink className="size-3" />
    </a>
  );
}

function RoleCard({ match }: { match: RoleMatchView }) {
  return (
    <Card size="sm" className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{match.role.title}</CardTitle>
            <CardDescription>{match.role.role_family}</CardDescription>
          </div>
          <Badge variant={match.directness === "direct" ? "default" : "outline"}>
            {directnessLabel(match.directness)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6">{match.role.summary}</p>
        <p className="text-sm leading-6 text-muted-foreground">{match.rationale}</p>
        {match.role.credential_notes ? (
          <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{match.role.credential_notes}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Fit {match.fit_score}/100
          </span>
          <SourceLink href={match.source_url} label={sourceDate(match.source_retrieved_on)} />
        </div>
      </CardContent>
    </Card>
  );
}

function SkillCard({ match }: { match: SkillMatchView }) {
  return (
    <Card size="sm" className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{match.skill.title}</CardTitle>
            <CardDescription>{skillKindLabel(match.skill.skill_kind)}</CardDescription>
          </div>
          <Badge variant={match.directness === "direct" ? "default" : "outline"}>
            {directnessLabel(match.directness)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6">{match.skill.summary}</p>
        <p className="text-sm leading-6 text-muted-foreground">{match.rationale}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Fit {match.fit_score}/100</span>
          <SourceLink href={match.source_url} label={sourceDate(match.source_retrieved_on)} />
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementBadges({ match }: { match: EmployerMatchView }) {
  const flags = [
    match.values_ap ? "A&P valued" : null,
    match.requires_ap ? "A&P likely required" : null,
    match.values_clearance ? "Clearance valued" : null,
    match.requires_clearance ? "Clearance likely required" : null,
    match.requires_faa ? "FAA credential path" : null,
    match.requires_fcc ? "FCC may matter" : null,
  ].filter(Boolean) as string[];

  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <Badge key={flag} variant="secondary">
          {flag}
        </Badge>
      ))}
    </div>
  );
}

function LocationSignal({ match }: { match: EmployerMatchView }) {
  if (match.mapped_location_count === null) {
    return (
      <div className="flex gap-2 rounded-lg border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <span>VetRetire location footprint not yet mapped for this employer.</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>
        {match.mapped_location_count} mapped retirement{" "}
        {match.mapped_location_count === 1 ? "location" : "locations"} in the current
        defense-employer footprint.
      </span>
    </div>
  );
}

function EmployerCard({ match }: { match: EmployerMatchView }) {
  return (
    <Card size="sm" className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{match.employer.display_name}</CardTitle>
            <CardDescription>
              {employerTypeLabel(match.employer.employer_type)}
              {match.employer.parent_company ? ` · ${match.employer.parent_company}` : ""}
            </CardDescription>
          </div>
          <Badge variant={match.directness === "direct" ? "default" : "outline"}>
            {directnessLabel(match.directness)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6">{match.rationale}</p>
        {match.platform_tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {match.platform_tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <RequirementBadges match={match} />
        <LocationSignal match={match} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Snapshot {sourceDate(match.snapshot_date)}
          </span>
          <SourceLink href={match.source_url} label="Source" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ branch }: { branch: MilitaryBranch }) {
  return (
    <Card className="rounded-lg border-dashed">
      <CardContent className="grid min-h-[220px] place-items-center p-8 text-center">
        <div>
          <p className="font-medium">No seeded {BRANCH_LABELS[branch]} specialties yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The schema supports this branch; the curated source bundle has not mapped it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CareerTransitionClient({
  catalog,
}: {
  catalog: CareerTransitionCatalog;
}) {
  const [branch, setBranch] = useState<MilitaryBranch>("army");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const branchSpecialties = useMemo(
    () => searchSpecialties(catalog.specialties, branch, query),
    [branch, catalog.specialties, query]
  );

  const matchesByKey = useMemo(
    () =>
      new Map(
        catalog.matches.map((match) => [
          `${match.specialty.branch}:${match.specialty.code}`,
          match,
        ])
      ),
    [catalog.matches]
  );

  const selected: SpecialtyMatchView | null = useMemo(() => {
    const fallback = branchSpecialties[0];
    const key = selectedKey?.startsWith(`${branch}:`) ? selectedKey : null;
    if (key && matchesByKey.has(key)) return matchesByKey.get(key) ?? null;
    return fallback ? matchesByKey.get(`${fallback.branch}:${fallback.code}`) ?? null : null;
  }, [branch, branchSpecialties, matchesByKey, selectedKey]);

  function updateBranch(next: MilitaryBranch) {
    setBranch(next);
    setSelectedKey(null);
    setQuery("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Military specialty career matcher
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Match enlisted military specialties to civilian roles, credential signals,
              employers, and VetRetire location coverage.
            </p>
          </div>
          <Badge variant={catalog.source === "database" ? "default" : "outline"}>
            {catalog.source === "database" ? "Database" : "Seed CSV"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {BRANCHES.map((value) => (
              <Button
                key={value}
                type="button"
                variant={branch === value ? "default" : "outline"}
                onClick={() => updateBranch(value)}
                className="h-9"
              >
                {BRANCH_LABELS[value]}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedKey(null);
              }}
              placeholder="Search code or title"
              className="h-9 pl-8"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {branchSpecialties.length === 0 ? (
            <EmptyState branch={branch} />
          ) : (
            branchSpecialties.map((specialty) => {
              const key = `${specialty.branch}:${specialty.code}`;
              const active = selected?.specialty.id === specialty.id;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{specialty.code}</span>
                    <Badge variant="outline">{specialty.code_system}</Badge>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {specialty.title}
                  </span>
                </button>
              );
            })
          )}
        </aside>

        {selected ? (
          <main className="space-y-6">
            <section className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{BRANCH_LABELS[selected.specialty.branch]}</Badge>
                    <Badge variant="outline">{selected.specialty.code_system}</Badge>
                    <Badge variant="outline">{selected.specialty.status}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight">
                    {selected.specialty.code} · {selected.specialty.title}
                  </h2>
                </div>
                <SourceLink
                  href={selected.specialty.source_url}
                  label={sourceDate(selected.specialty.source_retrieved_on)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                <h3 className="font-semibold">Skills and credentials</h3>
              </div>
              {selected.skills.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {selected.skills.map((match) => (
                    <SkillCard key={match.skill.slug} match={match} />
                  ))}
                </div>
              ) : (
                <Card className="rounded-lg border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    No civilian skills are mapped for this specialty yet. This section stays
                    empty rather than borrowing another specialty&rsquo;s skills.
                  </CardContent>
                </Card>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-muted-foreground" />
                <h3 className="font-semibold">Civilian roles</h3>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {selected.roles.map((match) => (
                  <RoleCard key={match.role.slug} match={match} />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <h3 className="font-semibold">Employer targets</h3>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {selected.employers.map((match) => (
                  <EmployerCard key={match.employer.slug} match={match} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">Location signal policy</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Mapped location counts come only from existing VetRetire defense-employer
                    footprint data. Civilian operators and unmapped contractors are labeled
                    as not yet mapped so the page never implies there are no opportunities.
                  </p>
                </div>
              </div>
            </section>
          </main>
        ) : null}
      </div>
    </div>
  );
}
