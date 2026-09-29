import React, { useState, useMemo } from 'react';
import type { Degree, Skill, Role, Industry, Company, Job } from '@/types';
import { url } from '@/lib/url';

interface Props {
  degrees: Degree[];
  skills: Skill[];
  roles: Role[];
  industries: Industry[];
  companies: Company[];
  jobs: Job[];
  initialDegreeSlug?: string;
}

export default function PathExplorer({
  degrees,
  skills,
  roles,
  industries,
  companies,
  jobs,
  initialDegreeSlug = 'mim',
}: Props) {
  const [activeDegreeSlug, setActiveDegreeSlug] = useState<string>(initialDegreeSlug);

  const activeDegree = useMemo(() => {
    return degrees.find((d) => d.slug.toLowerCase() === activeDegreeSlug.toLowerCase()) || degrees[0];
  }, [degrees, activeDegreeSlug]);

  const matchedSkills = useMemo(() => {
    if (!activeDegree) return [];
    return skills.filter((s) => activeDegree.skills.includes(s.slug));
  }, [activeDegree, skills]);

  const matchedRoles = useMemo(() => {
    if (!activeDegree) return [];
    return roles.filter((r) => activeDegree.roles.includes(r.slug));
  }, [activeDegree, roles]);

  const matchedIndustries = useMemo(() => {
    const indSlugs = new Set<string>();
    matchedRoles.forEach((r) => r.industries.forEach((ind) => indSlugs.add(ind.toLowerCase())));
    return industries.filter((i) => indSlugs.has(i.slug.toLowerCase()));
  }, [matchedRoles, industries]);

  const matchedCompanies = useMemo(() => {
    if (!activeDegree) return [];
    return companies.filter(
      (c) =>
        c.degrees.some((d) => d.toLowerCase() === activeDegree.slug.toLowerCase()) ||
        matchedIndustries.some((i) => i.slug.toLowerCase() === c.industry.toLowerCase())
    );
  }, [activeDegree, matchedIndustries, companies]);

  const matchedJobs = useMemo(() => {
    if (!activeDegree) return [];
    return jobs.filter(
      (j) =>
        j.degrees.some((d) => d.toLowerCase() === activeDegree.slug.toLowerCase()) ||
        matchedRoles.some((r) => r.function.toLowerCase() === j.function.toLowerCase())
    );
  }, [activeDegree, matchedRoles, jobs]);

  return (
    <div className="bg-surface border border-hairline rounded-md p-6 space-y-6">
      {/* Degree Selector Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
            1. Select Academic Pathway
          </span>
          <a
            href={url(`/careers/${activeDegree?.slug}/`)}
            className="text-xs font-mono font-semibold text-cobalt hover:underline flex items-center gap-1"
          >
            <span>Detailed Roadmap for {activeDegree?.name.split('(')[0]}</span>
            <span>→</span>
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          {degrees.map((deg) => {
            const isSelected = deg.slug === activeDegree?.slug;
            return (
              <button
                key={deg.slug}
                type="button"
                onClick={() => setActiveDegreeSlug(deg.slug)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors border ${
                  isSelected
                    ? 'border-cobalt bg-cobalt text-white shadow-sm'
                    : 'border-hairline bg-paper text-ink hover:border-cobalt'
                }`}
              >
                {deg.slug.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Degree Overview Card */}
      {activeDegree && (
        <div className="p-4 rounded border border-hairline bg-paper">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="font-serif text-lg font-bold text-ink">{activeDegree.name}</h4>
            {activeDegree.featured && (
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber/20 text-ink font-semibold w-fit">
                Featured Degree
              </span>
            )}
          </div>
          <p className="text-sm text-muted font-sans leading-relaxed">{activeDegree.summary}</p>
        </div>
      )}

      {/* Sequential Interactive Graph Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 2: Target Skills */}
        <div className="border border-hairline rounded p-4 bg-paper flex flex-col justify-between">
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              2. Core Competencies ({matchedSkills.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {matchedSkills.map((sk) => (
                <span
                  key={sk.slug}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-hairline text-ink"
                >
                  {sk.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Target Roles */}
        <div className="border border-hairline rounded p-4 bg-paper flex flex-col justify-between">
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              3. Target Roles ({matchedRoles.length})
            </span>
            <div className="space-y-1">
              {matchedRoles.slice(0, 5).map((r) => (
                <a
                  key={r.slug}
                  href={url(`/careers/roles/${r.slug}/`)}
                  className="block text-xs font-medium text-ink hover:text-cobalt truncate"
                >
                  • {r.name}
                </a>
              ))}
              {matchedRoles.length > 5 && (
                <span className="text-[10px] font-mono text-muted pl-2">
                  +{matchedRoles.length - 5} more roles
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Industries & Companies */}
        <div className="border border-hairline rounded p-4 bg-paper flex flex-col justify-between">
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              4. Target Employers
            </span>
            <div className="space-y-1">
              {matchedCompanies.slice(0, 5).map((comp) => (
                <a
                  key={comp.slug}
                  href={url(`/companies/${comp.slug}/`)}
                  className="block text-xs font-medium text-ink hover:text-cobalt truncate"
                >
                  • {comp.name}
                </a>
              ))}
              {matchedCompanies.length > 5 && (
                <span className="text-[10px] font-mono text-muted pl-2">
                  +{matchedCompanies.length - 5} employers
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 5: Matching Jobs */}
        <div className="border border-cobalt/40 rounded p-4 bg-cobalt/5 flex flex-col justify-between">
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-cobalt mb-2">
              5. Live Openings
            </span>
            <div className="font-mono text-3xl font-bold text-cobalt tabular-nums mb-1">
              {matchedJobs.length}
            </div>
            <p className="text-xs text-muted font-sans">
              Currently mapped to this qualification across Europe.
            </p>
          </div>

          <div className="pt-3">
            <a
              href={url(`/jobs/?degree=${activeDegree?.slug}`)}
              className="w-full inline-flex items-center justify-center px-3 py-2 rounded bg-cobalt text-white text-xs font-mono uppercase font-semibold tracking-wider hover:bg-cobalt/90 transition-colors"
            >
              Browse Filtered Jobs →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
