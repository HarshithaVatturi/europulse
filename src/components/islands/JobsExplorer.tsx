import React, { useState, useEffect, useMemo } from 'react';
import type { Job, Country, Industry, Degree } from '@/types';
import { url } from '@/lib/url';

interface Props {
  initialJobs: Job[];
  countries: Country[];
  industries: Industry[];
  degrees: Degree[];
}

const FUNCTIONS = [
  'Management',
  'Business Analysis',
  'Consulting',
  'Marketing',
  'Finance',
  'Supply Chain',
  'Operations',
  'Manufacturing',
  'Mechanical Engineering',
  'Robotics & Automation',
  'AI/ML',
  'Data Science',
  'Software Engineering',
  'Product Management',
  'Project Management',
];

const EXPERIENCES = ['Graduate / Entry', '1-3 Years', '3-5 Years', '5+ Years', 'Student'];
const EMPLOYMENT_TYPES = [
  'Full-time',
  'Graduate Programme',
  'Working Student',
  'Apprenticeship',
  'Thesis',
  'Internship',
];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

interface PortalMeta {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  badgeClass: string;
  searchUrl: (q: string, loc: string) => string;
}

const CONNECTED_PORTALS: PortalMeta[] = [
  {
    id: 'EnglishJobs.fr',
    name: 'EnglishJobs.fr',
    tagline: 'English-speaking roles in France',
    icon: '🌐',
    badgeClass: 'bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    searchUrl: (q: string) => `https://englishjobs.fr/?s=${encodeURIComponent(q || 'jobs')}`,
  },
  {
    id: 'Welcome to the Jungle',
    name: 'Welcome to the Jungle',
    tagline: 'Tech, Product & Startup Culture',
    icon: '🌴',
    badgeClass: 'bg-amber-900/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
    searchUrl: (q: string) => `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(q || '')}`,
  },
  {
    id: 'France Travail',
    name: 'France Travail',
    tagline: 'Official French Public Service (All Sectors)',
    icon: '🏛️',
    badgeClass: 'bg-indigo-900/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/30',
    searchUrl: (q: string) => `https://candidat.francetravail.fr/rechercheoffre/emploi?motsCles=${encodeURIComponent(q || '')}`,
  },
  {
    id: 'Apec',
    name: 'Apec',
    tagline: 'Managers, Cadres & High-Skilled FR',
    icon: '👔',
    badgeClass: 'bg-blue-900/10 text-blue-800 dark:text-blue-300 border-blue-500/30',
    searchUrl: (q: string) => `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(q || '')}`,
  },
  {
    id: 'Indeed France',
    name: 'Indeed France',
    tagline: 'National Employment Aggregator',
    icon: '🔍',
    badgeClass: 'bg-purple-900/10 text-purple-800 dark:text-purple-300 border-purple-500/30',
    searchUrl: (q: string, loc: string) => `https://fr.indeed.com/emplois?q=${encodeURIComponent(q || '')}&l=${encodeURIComponent(loc || 'France')}`,
  },
  {
    id: 'LinkedIn',
    name: 'LinkedIn Jobs',
    tagline: 'Pan-European & Multinational',
    icon: '💼',
    badgeClass: 'bg-sky-900/10 text-sky-800 dark:text-sky-300 border-sky-500/30',
    searchUrl: (q: string, loc: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q || '')}&location=${encodeURIComponent(loc || 'Europe')}`,
  },
];

export default function JobsExplorer({ initialJobs, countries, industries, degrees }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const pageSize = 10;

  // Initialize filters from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('country')) setSelectedCountry(params.get('country') || '');
    if (params.get('industry')) setSelectedIndustry(params.get('industry') || '');
    if (params.get('function')) setSelectedFunction(params.get('function') || '');
    if (params.get('degree')) setSelectedDegree(params.get('degree') || '');
    if (params.get('experience')) setSelectedExperience(params.get('experience') || '');
    if (params.get('employmentType')) setSelectedEmploymentType(params.get('employmentType') || '');
    if (params.get('workMode')) setSelectedWorkMode(params.get('workMode') || '');
    if (params.get('source')) setSelectedSource(params.get('source') || '');
    if (params.get('query')) setSearchQuery(params.get('query') || '');
    if (params.get('page')) setCurrentPage(Number(params.get('page')) || 1);
  }, []);

  // Sync state back to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (selectedFunction) params.set('function', selectedFunction);
    if (selectedDegree) params.set('degree', selectedDegree);
    if (selectedExperience) params.set('experience', selectedExperience);
    if (selectedEmploymentType) params.set('employmentType', selectedEmploymentType);
    if (selectedWorkMode) params.set('workMode', selectedWorkMode);
    if (selectedSource) params.set('source', selectedSource);
    if (searchQuery.trim()) params.set('query', searchQuery.trim());
    if (currentPage > 1) params.set('page', String(currentPage));

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `${window.location.pathname}${newSearch}`;
    window.history.replaceState({}, '', newUrl);
  }, [
    selectedCountry,
    selectedIndustry,
    selectedFunction,
    selectedDegree,
    selectedExperience,
    selectedEmploymentType,
    selectedWorkMode,
    selectedSource,
    searchQuery,
    currentPage,
  ]);

  const clearAllFilters = () => {
    setSelectedCountry('');
    setSelectedIndustry('');
    setSelectedFunction('');
    setSelectedDegree('');
    setSelectedExperience('');
    setSelectedEmploymentType('');
    setSelectedWorkMode('');
    setSelectedSource('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCountry ||
      selectedIndustry ||
      selectedFunction ||
      selectedDegree ||
      selectedExperience ||
      selectedEmploymentType ||
      selectedWorkMode ||
      selectedSource ||
      searchQuery.trim()
  );

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      if (selectedCountry && job.country.toLowerCase() !== selectedCountry.toLowerCase())
        return false;
      if (selectedIndustry && job.industry.toLowerCase() !== selectedIndustry.toLowerCase())
        return false;
      if (selectedFunction && job.function.toLowerCase() !== selectedFunction.toLowerCase())
        return false;
      if (
        selectedDegree &&
        !job.degrees.some((d) => d.toLowerCase() === selectedDegree.toLowerCase())
      )
        return false;
      if (
        selectedExperience &&
        job.experience.toLowerCase() !== selectedExperience.toLowerCase()
      )
        return false;
      if (
        selectedEmploymentType &&
        job.employmentType.toLowerCase() !== selectedEmploymentType.toLowerCase()
      )
        return false;
      if (selectedWorkMode && job.workMode.toLowerCase() !== selectedWorkMode.toLowerCase())
        return false;
      if (
        selectedSource &&
        !job.source.toLowerCase().includes(selectedSource.toLowerCase())
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.city.toLowerCase().includes(q) ||
          job.function.toLowerCase().includes(q) ||
          job.source.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [
    initialJobs,
    selectedCountry,
    selectedIndustry,
    selectedFunction,
    selectedDegree,
    selectedExperience,
    selectedEmploymentType,
    selectedWorkMode,
    selectedSource,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage]);

  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const getPortalInfo = (sourceStr: string) => {
    const matched = CONNECTED_PORTALS.find((p) =>
      sourceStr.toLowerCase().includes(p.id.toLowerCase())
    );
    if (matched) {
      return {
        label: matched.name,
        icon: matched.icon,
        badgeClass: matched.badgeClass,
      };
    }
    if (sourceStr.toLowerCase().includes('arbeitnow')) {
      return {
        label: 'Arbeitnow Feed',
        icon: '🇪🇺',
        badgeClass: 'bg-zinc-800/10 text-ink border-hairline',
      };
    }
    return {
      label: sourceStr.split(' ')[0] || 'Corporate Direct',
      icon: '🏢',
      badgeClass: 'bg-zinc-800/10 text-muted border-hairline',
    };
  };

  const activeCountryObj = countries.find(
    (c) => c.slug.toLowerCase() === selectedCountry.toLowerCase()
  );
  const locationLabel = activeCountryObj ? activeCountryObj.name : 'France';

  return (
    <div className="space-y-6">
      {/* Top Header & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-hairline rounded-md p-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            placeholder="Search roles by title, skill (e.g. Python, Product, Supply Chain, Paris, English)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-paper border border-hairline rounded text-ink placeholder:text-muted focus:border-cobalt outline-none font-sans"
            aria-label="Search jobs query"
          />
          <svg
            className="w-4 h-4 text-muted absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-mono uppercase tracking-wider rounded border border-hairline bg-paper text-ink flex items-center gap-1.5"
            aria-label="Open filter menu"
          >
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cobalt inline-block"></span>
            )}
          </button>

          <div
            className="font-mono text-xs text-muted tabular-nums"
            aria-live="polite"
            id="job-count-indicator"
          >
            Showing <strong className="text-ink">{filteredJobs.length}</strong> listings
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-mono text-cobalt hover:underline px-2 py-1"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-5 bg-surface border border-hairline rounded-md p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Filter Pipeline
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-mono text-[11px] text-cobalt hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Connected Portal / Source Filter */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Source Portal
            </label>
            <select
              value={selectedSource}
              onChange={(e) => handleFilterChange(setSelectedSource, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans font-medium"
            >
              <option value="">All Connected Sources ({initialJobs.length})</option>
              <option value="EnglishJobs.fr">EnglishJobs.fr (English FR)</option>
              <option value="Welcome to the Jungle">Welcome to the Jungle (Tech / Startup)</option>
              <option value="Apec">Apec (Cadres &amp; Executives FR)</option>
              <option value="France Travail">France Travail (Public Employment)</option>
              <option value="Indeed">Indeed France</option>
              <option value="LinkedIn">LinkedIn European Careers</option>
              <option value="Arbeitnow">Arbeitnow European Feed</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleFilterChange(setSelectedCountry, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.iso2})
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Industry
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => handleFilterChange(setSelectedIndustry, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind.slug} value={ind.slug}>
                  {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Function Filter */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Job Function
            </label>
            <select
              value={selectedFunction}
              onChange={(e) => handleFilterChange(setSelectedFunction, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Functions</option>
              {FUNCTIONS.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </div>

          {/* Degree Filter */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Degree Match
            </label>
            <select
              value={selectedDegree}
              onChange={(e) => handleFilterChange(setSelectedDegree, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Degrees</option>
              {degrees.map((deg) => (
                <option key={deg.slug} value={deg.slug}>
                  {deg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Employment Type
            </label>
            <select
              value={selectedEmploymentType}
              onChange={(e) => handleFilterChange(setSelectedEmploymentType, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Contract Types</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Experience Level
            </label>
            <select
              value={selectedExperience}
              onChange={(e) => handleFilterChange(setSelectedExperience, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Experience</option>
              {EXPERIENCES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">
              Work Mode
            </label>
            <select
              value={selectedWorkMode}
              onChange={(e) => handleFilterChange(setSelectedWorkMode, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
            >
              <option value="">All Work Modes</option>
              {WORK_MODES.map((wm) => (
                <option key={wm} value={wm}>
                  {wm}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Mobile Filter Bottom Sheet / Modal */}
        {isMobileFiltersOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileFiltersOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter Jobs"
          >
            <div className="w-full sm:max-w-lg bg-surface border-t sm:border border-hairline rounded-t-xl sm:rounded-lg max-h-[85vh] overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                  Filter Pipeline
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="font-mono text-xs text-muted hover:text-ink"
                >
                  ✕ Close
                </button>
              </div>

              {/* Mobile options */}
              <div className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Source Portal</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => handleFilterChange(setSelectedSource, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink font-medium"
                  >
                    <option value="">All Connected Sources</option>
                    <option value="EnglishJobs.fr">EnglishJobs.fr (English FR)</option>
                    <option value="Welcome to the Jungle">Welcome to the Jungle</option>
                    <option value="Apec">Apec (Cadres FR)</option>
                    <option value="France Travail">France Travail</option>
                    <option value="Indeed">Indeed France</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Arbeitnow">Arbeitnow</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleFilterChange(setSelectedCountry, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink"
                  >
                    <option value="">All Countries</option>
                    {countries.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Industry</label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => handleFilterChange(setSelectedIndustry, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink"
                  >
                    <option value="">All Industries</option>
                    {industries.map((ind) => (
                      <option key={ind.slug} value={ind.slug}>
                        {ind.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Function</label>
                  <select
                    value={selectedFunction}
                    onChange={(e) => handleFilterChange(setSelectedFunction, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink"
                  >
                    <option value="">All Functions</option>
                    {FUNCTIONS.map((fn) => (
                      <option key={fn} value={fn}>
                        {fn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Degree</label>
                  <select
                    value={selectedDegree}
                    onChange={(e) => handleFilterChange(setSelectedDegree, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink"
                  >
                    <option value="">All Degrees</option>
                    {degrees.map((deg) => (
                      <option key={deg.slug} value={deg.slug}>
                        {deg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Contract</label>
                  <select
                    value={selectedEmploymentType}
                    onChange={(e) => handleFilterChange(setSelectedEmploymentType, e.target.value)}
                    className="w-full text-sm bg-paper border border-hairline rounded p-2 text-ink"
                  >
                    <option value="">All Contracts</option>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="font-mono text-xs text-muted hover:text-ink py-2"
                >
                  Reset all
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="px-5 py-2 rounded bg-cobalt text-white font-mono text-xs font-semibold uppercase tracking-wider"
                >
                  Apply ({filteredJobs.length} Results)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings Content Column */}
        <main className="lg:col-span-3 space-y-4">
          {/* Connected European Job Portals Multi-Portal Quick Search Launcher */}
          <section className="bg-surface border border-hairline rounded-md p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Connected European Job Portals · Multi-Portal Search Launcher
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted">
                6 Major Employment Engines Integrated
              </span>
            </div>

            <p className="text-xs text-muted font-sans leading-relaxed">
              Expand your search beyond our curated European database. Instantly launch your active query{' '}
              {searchQuery.trim() ? (
                <strong className="text-ink">"{searchQuery.trim()}"</strong>
              ) : (
                <span className="italic text-ink font-medium">(current search)</span>
              )}{' '}
              across French and Pan-European employment platforms in 1 click:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              {CONNECTED_PORTALS.map((portal) => {
                const searchLink = portal.searchUrl(searchQuery.trim(), locationLabel);
                const isSelected = selectedSource.toLowerCase() === portal.id.toLowerCase();

                return (
                  <div
                    key={portal.id}
                    className="flex flex-col justify-between p-2.5 rounded bg-paper border border-hairline hover:border-cobalt transition-colors group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-base select-none">{portal.icon}</span>
                        <a
                          href={searchLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted group-hover:text-cobalt hover:underline text-[10px] font-mono flex items-center gap-0.5"
                          title={`Launch search on ${portal.name}`}
                        >
                          <span>Open</span>
                          <span>↗</span>
                        </a>
                      </div>
                      <div className="font-serif font-bold text-xs text-ink group-hover:text-cobalt leading-snug">
                        {portal.name}
                      </div>
                      <div className="text-[10px] text-muted font-sans leading-tight mt-0.5 line-clamp-1">
                        {portal.tagline}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFilterChange(setSelectedSource, isSelected ? '' : portal.id)}
                      className={`w-full mt-2.5 py-1 px-1.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                        isSelected
                          ? 'bg-cobalt text-white'
                          : 'bg-surface border border-hairline text-ink hover:border-cobalt'
                      }`}
                    >
                      {isSelected ? '✓ In Feed' : 'Filter Feed'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active Job Cards */}
          {paginatedJobs.length === 0 ? (
            <div className="bg-surface border border-dashed border-hairline rounded-md p-12 text-center my-4">
              <div className="font-mono text-sm text-muted mb-2">ø No listings match these filters</div>
              <p className="text-sm text-muted max-w-sm mx-auto mb-4 font-sans">
                Try resetting individual filters or clearing criteria to browse all available opportunities.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 rounded border border-hairline bg-paper text-ink font-mono text-xs font-semibold uppercase hover:border-cobalt"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            paginatedJobs.map((job) => {
              const country = countries.find((c) => c.slug.toLowerCase() === job.country.toLowerCase());
              const portalInfo = getPortalInfo(job.source);

              return (
                <article
                  key={job.id}
                  className="bg-surface border border-hairline rounded-md p-5 hover:border-cobalt transition-colors text-ink group space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                          {job.company.toUpperCase()}
                        </span>
                        <span className="text-hairline select-none">·</span>
                        <span className="font-mono text-xs text-muted">
                          [{country?.iso2 || job.country.toUpperCase()}] {job.city}
                        </span>
                        {/* Source Portal Badge */}
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold inline-flex items-center gap-1 ${portalInfo.badgeClass}`}
                        >
                          <span>{portalInfo.icon}</span>
                          <span>{portalInfo.label}</span>
                        </span>
                        {job.isDemo && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber/15 text-ink font-semibold">
                            Demo
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-ink group-hover:text-cobalt transition-colors">
                        <a href={url(`/jobs/${job.slug}/`)} className="hover:underline">
                          {job.title}
                        </a>
                      </h3>
                    </div>

                    <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-1">
                      <span className="font-mono text-xs px-2 py-0.5 rounded border border-hairline bg-paper text-ink font-semibold">
                        {job.employmentType}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {job.workMode} · {job.experience}
                      </span>
                    </div>
                  </div>

                  {/* Skills, Target Degrees & Action Links */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-hairline">
                    <span className="font-mono text-[10px] text-muted uppercase tracking-wider mr-1">
                      Target:
                    </span>
                    {job.degrees.map((degSlug) => (
                      <span
                        key={degSlug}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cobalt/5 text-cobalt border border-cobalt/20"
                      >
                        {degSlug.toUpperCase()}
                      </span>
                    ))}
                    {job.skills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper text-muted border border-hairline"
                      >
                        {sk}
                      </span>
                    ))}

                    <div className="ml-auto flex items-center gap-3">
                      {job.applyUrl && (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Apply on {portalInfo.label.split(' ')[0]}</span>
                          <span>↗</span>
                        </a>
                      )}
                      <a
                        href={url(`/jobs/${job.slug}/`)}
                        className="text-xs font-mono font-semibold text-cobalt hover:underline inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-hairline font-mono text-xs text-muted">
              <div>
                Page <strong className="text-ink">{currentPage}</strong> of{' '}
                <strong className="text-ink">{totalPages}</strong>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded border border-hairline bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-cobalt transition-colors"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded border border-hairline bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-cobalt transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
