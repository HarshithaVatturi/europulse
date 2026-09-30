import React, { useState, useMemo } from 'react';
import topCompaniesData from '@/data/top-companies-250.json';

interface CompanyItem {
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  hqCity: string;
  industry: string;
  sector: string;
  careersUrl: string;
  graduatesUrl: string;
  featured: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪',
  FR: '🇫🇷',
  NL: '🇳🇱',
  CH: '🇨🇭',
  DK: '🇩🇰',
  SE: '🇸🇪',
  FI: '🇫🇮',
  NO: '🇳🇴',
  IT: '🇮🇹',
  ES: '🇪🇸',
  GB: '🇬🇧',
  IE: '🇮🇪',
  BE: '🇧🇪',
  LU: '🇱🇺',
  PT: '🇵🇹',
  AT: '🇦🇹',
  PL: '🇵🇱',
};

export default function TopCompaniesExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const companies = topCompaniesData as CompanyItem[];

  // Get distinct countries & sectors
  const countries = useMemo(() => {
    const list = Array.from(new Set(companies.map(c => c.country))).sort();
    return list;
  }, [companies]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(companies.map(c => c.sector))).sort();
    return list;
  }, [companies]);

  // Filter companies
  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (onlyFeatured && !c.featured) return false;
      if (selectedCountry !== 'all' && c.country !== selectedCountry) return false;
      if (selectedSector !== 'all' && c.sector !== selectedSector) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCity = c.hqCity.toLowerCase().includes(q);
        const matchesCountry = c.country.toLowerCase().includes(q);
        const matchesSector = c.sector.toLowerCase().includes(q);
        const matchesInd = c.industry.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesCountry && !matchesSector && !matchesInd) {
          return false;
        }
      }
      return true;
    });
  }, [companies, searchTerm, selectedCountry, selectedSector, onlyFeatured]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-surface border border-hairline rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name, city, sector (e.g. BMW, ASML, Paris, Biotech)..."
              className="w-full pl-9 pr-4 py-2.5 rounded border border-hairline bg-paper text-ink placeholder:text-muted focus:outline-none focus:border-cobalt font-sans text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-muted hover:text-ink font-mono"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Country Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full py-2.5 px-3 rounded border border-hairline bg-paper text-ink text-sm font-sans focus:outline-none focus:border-cobalt"
            >
              <option value="all">🌍 All European Countries ({countries.length})</option>
              {countries.map(c => {
                const count = companies.filter(item => item.country === c).length;
                return (
                  <option key={c} value={c}>
                    {c} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full py-2.5 px-3 rounded border border-hairline bg-paper text-ink text-sm font-sans focus:outline-none focus:border-cobalt"
            >
              <option value="all">🏭 All Industry Sectors ({sectors.length})</option>
              {sectors.map(s => {
                const count = companies.filter(item => item.sector === s).length;
                return (
                  <option key={s} value={s}>
                    {s} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Toggles & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-hairline text-xs font-mono text-muted">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => setOnlyFeatured(e.target.checked)}
                className="rounded border-hairline text-cobalt focus:ring-0"
              />
              <span className="text-ink font-semibold">★ Euro Stoxx 50 &amp; Flagship Employers Only</span>
            </label>
            {(selectedCountry !== 'all' || selectedSector !== 'all' || searchTerm || onlyFeatured) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCountry('all');
                  setSelectedSector('all');
                  setOnlyFeatured(false);
                }}
                className="text-cobalt hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div>
            Showing <strong className="text-ink font-bold">{filtered.length}</strong> of{' '}
            <strong className="text-ink font-bold">{companies.length}</strong> Top European Enterprises
          </div>
        </div>
      </div>

      {/* Grid of 250 Top Companies */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-hairline rounded-lg p-8">
          <p className="font-serif text-lg text-ink font-bold mb-2">No matching companies found</p>
          <p className="text-xs text-muted font-sans mb-4">
            Try adjusting your search keywords, country selection, or industry filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCountry('all');
              setSelectedSector('all');
              setOnlyFeatured(false);
            }}
            className="px-4 py-2 bg-cobalt text-paper rounded text-xs font-mono font-semibold hover:opacity-90 transition-opacity"
          >
            Show All 250 Employers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((comp) => {
            const flag = COUNTRY_FLAGS[comp.countryCode] || '🇪🇺';
            return (
              <div
                key={comp.slug}
                className="bg-surface border border-hairline rounded-md p-4 hover:border-cobalt transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xl select-none" title={comp.country}>
                      {flag}
                    </span>
                    <span className="font-mono text-[10px] text-muted uppercase tracking-wider bg-paper border border-hairline px-2 py-0.5 rounded">
                      {comp.countryCode} · {comp.hqCity}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-ink group-hover:text-cobalt transition-colors line-clamp-1">
                    {comp.name}
                  </h3>

                  <div className="mt-1">
                    <span className="inline-block text-[11px] font-sans font-medium text-cobalt bg-cobalt/10 px-2 py-0.5 rounded">
                      {comp.sector}
                    </span>
                  </div>

                  <p className="text-xs text-muted font-sans mt-2 line-clamp-2 leading-relaxed">
                    {comp.industry}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline space-y-2">
                  <a
                    href={comp.careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center py-1.5 px-3 rounded bg-cobalt text-paper font-mono text-xs font-semibold hover:opacity-90 transition-opacity shadow-2xs"
                  >
                    Direct Career Portal ↗
                  </a>
                  {comp.graduatesUrl && comp.graduatesUrl !== comp.careersUrl && (
                    <a
                      href={comp.graduatesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block text-center py-1 px-2 rounded border border-hairline text-muted hover:text-ink hover:border-cobalt font-mono text-[11px] transition-colors"
                    >
                      Graduate &amp; Student Tracks ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
