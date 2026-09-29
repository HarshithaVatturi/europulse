import React, { useState, useEffect, useMemo } from 'react';
import {
  initMiniSearch,
  searchDocs,
  getSmartJumpTo,
  type SearchDoc,
  type JumpToResult,
} from '@/lib/search';
import { url } from '@/lib/url';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [jumpTo, setJumpTo] = useState<JumpToResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('All');

  const miniSearchRef = React.useRef<any>(null);

  // Read initial query from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setQuery(q);

    setIsLoading(true);
    initMiniSearch()
      .then((ms) => {
        miniSearchRef.current = ms;
        if (q.trim()) {
          const hits = searchDocs(q, ms);
          setResults(hits);
          setJumpTo(getSmartJumpTo(q));
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniSearchRef.current) return;

    const trimmed = query.trim();
    if (typeof window !== 'undefined') {
      const newUrl = trimmed ? `${window.location.pathname}?q=${encodeURIComponent(trimmed)}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }

    if (!trimmed) {
      setResults([]);
      setJumpTo(null);
      return;
    }

    const hits = searchDocs(trimmed, miniSearchRef.current);
    setResults(hits);
    setJumpTo(getSmartJumpTo(trimmed));
  };

  const types = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => set.add(r.type));
    return ['All', ...Array.from(set)];
  }, [results]);

  const filteredResults = useMemo(() => {
    if (activeTypeFilter === 'All') return results;
    return results.filter((r) => r.type === activeTypeFilter);
  }, [results, activeTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search European news, companies, roles, skills, or try 'Robotics jobs in France'..."
            className="w-full pl-10 pr-4 py-3 text-base bg-surface border border-hairline rounded-md text-ink placeholder:text-muted focus:border-cobalt outline-none font-sans shadow-sm"
            aria-label="Search query"
          />
          <svg
            className="w-5 h-5 text-muted absolute left-3.5 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-md bg-cobalt text-white hover:bg-cobalt/90 font-mono text-xs uppercase tracking-wider font-semibold transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Direct Smart Jump Shortcut */}
      {jumpTo && (
        <div className="p-4 rounded-md border border-amber bg-amber/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber text-lg">⚡</span>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-amber block">
                Direct Smart Shortcut
              </span>
              <span className="font-sans font-bold text-base text-ink">
                {jumpTo.label}
              </span>
            </div>
          </div>
          <a
            href={jumpTo.url}
            className="px-4 py-2 rounded bg-ink text-surface hover:bg-cobalt font-mono text-xs uppercase font-semibold transition-colors shrink-0 text-center"
          >
            Jump to Filtered Results →
          </a>
        </div>
      )}

      {/* Result Type Tabs */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-hairline text-xs font-mono">
          <span className="text-muted mr-2 font-bold uppercase text-[10px]">Filter Type:</span>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTypeFilter(type)}
              className={`px-3 py-1 rounded transition-colors border ${
                activeTypeFilter === type
                  ? 'border-cobalt bg-cobalt text-white font-semibold'
                  : 'border-hairline bg-surface text-ink hover:border-cobalt'
              }`}
            >
              {type} {type !== 'All' && `(${results.filter((r) => r.type === type).length})`}
            </button>
          ))}
          <div className="ml-auto text-muted tabular-nums" aria-live="polite">
            Found <strong>{filteredResults.length}</strong> matches
          </div>
        </div>
      )}

      {/* Results Content */}
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-muted">
          Loading European intelligence search index...
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-surface border border-dashed border-hairline rounded-md p-12 text-center my-6">
          <div className="font-mono text-base text-muted mb-2">ø No results found for "{query}"</div>
          <p className="text-sm text-muted max-w-md mx-auto mb-4 font-sans leading-relaxed">
            Try querying by country alias (e.g. "French"), industry keyword (e.g. "chips", "robotics"), degree (e.g. "MIM"), or job title.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Robotics jobs in France', 'MIM jobs in Europe', 'ASML', 'Automotive', 'Battery'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  if (miniSearchRef.current) {
                    setResults(searchDocs(sample, miniSearchRef.current));
                    setJumpTo(getSmartJumpTo(sample));
                  }
                }}
                className="px-2.5 py-1 text-xs font-mono rounded border border-hairline bg-paper text-muted hover:text-ink hover:border-cobalt transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((item) => (
            <a
              key={item.id}
              href={url(item.url)}
              className="block bg-surface border border-hairline rounded-md p-4 hover:border-cobalt transition-colors group"
            >
              <div className="flex items-center justify-between text-xs font-mono text-muted mb-1">
                <span className="font-bold text-cobalt uppercase">{item.type}</span>
                <span className="text-muted group-hover:text-ink">View Details →</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-ink group-hover:text-cobalt transition-colors mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted font-sans line-clamp-2">
                {item.subtitle}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
