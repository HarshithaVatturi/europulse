import React, { useState, useEffect, useMemo } from 'react';
import type { NewsArticle, Country, Industry, Topic } from '@/types';
import { url } from '@/lib/url';

interface Props {
  initialNews: NewsArticle[];
  countries: Country[];
  industries: Industry[];
  topics: Topic[];
}

export default function NewsExplorer({
  initialNews,
  countries,
  industries,
  topics,
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pageSize = 8;

  // Initialize from URL query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('country')) setSelectedCountry(params.get('country') || '');
    if (params.get('industry')) setSelectedIndustry(params.get('industry') || '');
    if (params.get('topic')) setSelectedTopic(params.get('topic') || '');
    if (params.get('query')) setSearchQuery(params.get('query') || '');
    if (params.get('page')) setCurrentPage(Number(params.get('page')) || 1);
  }, []);

  // Sync state back to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (selectedTopic) params.set('topic', selectedTopic);
    if (searchQuery.trim()) params.set('query', searchQuery.trim());
    if (currentPage > 1) params.set('page', String(currentPage));

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `${window.location.pathname}${newSearch}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCountry, selectedIndustry, selectedTopic, searchQuery, currentPage]);

  const clearAllFilters = () => {
    setSelectedCountry('');
    setSelectedIndustry('');
    setSelectedTopic('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCountry || selectedIndustry || selectedTopic || searchQuery.trim()
  );

  const filteredNews = useMemo(() => {
    return initialNews.filter((item) => {
      if (
        selectedCountry &&
        !item.countries.some((c) => c.toLowerCase() === selectedCountry.toLowerCase())
      )
        return false;

      if (
        selectedIndustry &&
        !item.industries.some((i) => i.toLowerCase() === selectedIndustry.toLowerCase())
      )
        return false;

      if (
        selectedTopic &&
        !item.topics.some((t) => t.toLowerCase() === selectedTopic.toLowerCase())
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.careerImpact.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [initialNews, selectedCountry, selectedIndustry, selectedTopic, searchQuery]);

  const totalPages = Math.ceil(filteredNews.length / pageSize) || 1;
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNews.slice(start, start + pageSize);
  }, [filteredNews, currentPage]);

  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-surface border border-hairline rounded-md p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search business intelligence stories..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-paper border border-hairline rounded text-ink placeholder:text-muted focus:border-cobalt outline-none font-sans"
              aria-label="Search stories"
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

          <div className="flex items-center gap-2 justify-between">
            <div className="font-mono text-xs text-muted tabular-nums" aria-live="polite">
              <strong className="text-ink">{filteredNews.length}</strong> dispatches
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

        {/* Facet Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-hairline">
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => handleFilterChange(setSelectedCountry, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
              aria-label="Filter by country"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.iso2})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => handleFilterChange(setSelectedIndustry, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
              aria-label="Filter by industry"
            >
              <option value="">All Industries</option>
              {industries.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTopic}
              onChange={(e) => handleFilterChange(setSelectedTopic, e.target.value)}
              className="w-full text-xs bg-paper border border-hairline rounded p-2 text-ink focus:border-cobalt outline-none font-sans"
              aria-label="Filter by topic"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dispatches List */}
      <div className="space-y-4">
        {paginatedNews.length === 0 ? (
          <div className="bg-surface border border-dashed border-hairline rounded-md p-12 text-center my-4">
            <div className="font-mono text-sm text-muted mb-2">ø No dispatches match criteria</div>
            <p className="text-sm text-muted max-w-sm mx-auto mb-4 font-sans">
              Try resetting your topic, country, or industry filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 rounded border border-hairline bg-paper text-ink font-mono text-xs font-semibold uppercase hover:border-cobalt"
            >
              Reset filters
            </button>
          </div>
        ) : (
          paginatedNews.map((item) => (
            <article
              key={item.id}
              className="bg-surface border border-hairline rounded-md p-5 hover:border-cobalt transition-colors group"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs text-muted tabular-nums">
                  {item.date}
                </span>
                <span className="text-hairline select-none">·</span>
                <span className="font-mono text-xs text-cobalt font-semibold">
                  {item.source.name}
                </span>
                {item.isDemo && (
                  <span className="font-mono text-[9px] uppercase px-1 py-0.5 rounded bg-amber/15 text-ink font-semibold">
                    Demo Article
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold text-ink group-hover:text-cobalt transition-colors mb-2">
                <a href={url(`/news/${item.slug}/`)} className="hover:underline">
                  {item.title}
                </a>
              </h3>

              <p className="text-sm text-ink/80 font-sans mb-4 leading-relaxed">
                {item.summary}
              </p>

              {/* Career Impact Note */}
              <div className="bg-paper border-l-2 border-amber p-2.5 rounded-r text-xs text-ink/90 font-sans mb-3 italic">
                <strong className="font-mono text-[10px] uppercase font-bold not-italic text-amber block mb-0.5">
                  Career Impact:
                </strong>
                {item.careerImpact}
              </div>

              {/* Footer Meta & Impact Trail */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-hairline text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1.5 text-muted">
                  <span>Linked:</span>
                  {item.companies.map((c) => (
                    <a
                      key={c}
                      href={url(`/companies/${c}/`)}
                      className="text-ink hover:text-cobalt uppercase underline"
                    >
                      {c}
                    </a>
                  ))}
                  {item.countries.map((c) => (
                    <a
                      key={c}
                      href={url(`/countries/${c}/`)}
                      className="text-ink hover:text-cobalt uppercase font-bold"
                    >
                      [{c.slice(0, 2).toUpperCase()}]
                    </a>
                  ))}
                </div>

                <a
                  href={url(`/news/${item.slug}/`)}
                  className="text-cobalt hover:underline inline-flex items-center gap-1 font-semibold ml-auto"
                >
                  <span>Career Impact Trail</span>
                  <span>→</span>
                </a>
              </div>
            </article>
          ))
        )}

        {/* Pagination */}
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
                className="px-3 py-1.5 rounded border border-hairline bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-cobalt"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-hairline bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-cobalt"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
