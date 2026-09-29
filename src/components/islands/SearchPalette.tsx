import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  initMiniSearch,
  searchDocs,
  getSmartJumpTo,
  type SearchDoc,
  type JumpToResult,
} from '@/lib/search';
import { url } from '@/lib/url';

export default function SearchPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [jumpTo, setJumpTo] = useState<JumpToResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const miniSearchRef = useRef<any>(null);

  // Platform detection for keyboard shortcut label
  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load search index on first modal open
  useEffect(() => {
    if (isOpen) {
      if (!miniSearchRef.current) {
        setIsLoading(true);
        initMiniSearch()
          .then((ms) => {
            miniSearchRef.current = ms;
          })
          .catch((err) => console.error('Failed to init search:', err))
          .finally(() => setIsLoading(false));
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
      setJumpTo(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Execute query search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setJumpTo(null);
      setSelectedIndex(0);
      return;
    }

    const smartJump = getSmartJumpTo(query);
    setJumpTo(smartJump);

    if (miniSearchRef.current) {
      const hits = searchDocs(query, miniSearchRef.current);
      setResults(hits);
    }
    setSelectedIndex(0);
  }, [query]);

  // Flatten searchable list for keyboard navigation
  const allItems = useMemo(() => {
    const items: Array<{ title: string; subtitle: string; url: string; type: string }> = [];
    if (jumpTo) {
      items.push({
        title: jumpTo.label,
        subtitle: 'Smart navigation shortcut based on your query terms',
        url: jumpTo.url,
        type: 'Jump To',
      });
    }
    results.forEach((r) => {
      items.push({
        title: r.title,
        subtitle: r.subtitle,
        url: url(r.url),
        type: r.type,
      });
    });
    return items;
  }, [jumpTo, results]);

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        window.location.href = allItems[selectedIndex].url;
      } else if (query.trim()) {
        window.location.href = url(`/search/?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // Group items by type for rich display
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchDoc[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-hairline bg-surface hover:border-cobalt transition-colors text-xs text-muted w-44 sm:w-56 justify-between select-none"
        aria-label="Open search palette (⌘K or Ctrl+K)"
      >
        <span className="flex items-center gap-1.5 truncate">
          <svg
            className="w-3.5 h-3.5 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="truncate">Search intelligence...</span>
        </span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-paper border border-hairline font-mono text-[10px] text-muted">
          {isMac ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </button>

      {/* Modal Dialog Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-start justify-center p-4 sm:pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Search EuroPulse"
        >
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-surface border border-hairline rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] text-ink animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-hairline px-4 py-3 gap-3 bg-paper">
              <svg
                className="w-4 h-4 text-cobalt shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search stories, jobs, companies, skills (e.g. 'Robotics jobs in France', 'MIM', 'chips')..."
                className="w-full bg-transparent border-none outline-none text-ink placeholder:text-muted text-sm font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="font-mono text-xs text-muted hover:text-ink px-1.5 py-0.5 rounded"
                  aria-label="Clear query"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Results Area */}
            <div className="overflow-y-auto p-3 space-y-4 flex-1">
              {isLoading && (
                <div className="py-12 text-center text-xs font-mono text-muted">
                  Initializing search engine & indexing entities...
                </div>
              )}

              {!isLoading && query && allItems.length === 0 && (
                <div className="py-12 text-center">
                  <div className="font-mono text-sm text-muted mb-1">ø No matches found for "{query}"</div>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Try searching by country (e.g. France), sector (e.g. Automotive), skill (e.g. Python), or role.
                  </p>
                </div>
              )}

              {/* Smart Jump To Result */}
              {jumpTo && (
                <div className="mb-2">
                  <span className="block font-mono text-[10px] uppercase font-bold tracking-wider text-amber mb-1.5 px-2">
                    Direct Jump
                  </span>
                  <a
                    href={jumpTo.url}
                    className={`block p-2.5 rounded border transition-colors ${
                      selectedIndex === 0
                        ? 'border-amber bg-amber/10 text-ink'
                        : 'border-hairline bg-paper hover:border-amber text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold text-sm text-ink flex items-center gap-1.5">
                        <span className="text-amber">⚡</span>
                        {jumpTo.label}
                      </span>
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber/20 text-ink font-semibold">
                        {jumpTo.badge}
                      </span>
                    </div>
                  </a>
                </div>
              )}

              {/* Grouped Category Results */}
              {Object.entries(groupedResults).map(([type, docs]) => (
                <div key={type} className="space-y-1">
                  <span className="block font-mono text-[10px] uppercase font-bold tracking-wider text-muted px-2 pt-1">
                    {type} ({docs.length})
                  </span>
                  {docs.map((doc) => {
                    const itemGlobalIndex = allItems.findIndex((it) => it.url === url(doc.url));
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <a
                        key={doc.id}
                        href={url(doc.url)}
                        className={`block p-2.5 rounded border transition-colors ${
                          isSelected
                            ? 'border-cobalt bg-cobalt/5 text-ink'
                            : 'border-transparent hover:bg-paper text-ink'
                        }`}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-sans font-medium text-sm text-ink truncate">
                            {doc.title}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-muted shrink-0">
                            {doc.type}
                          </span>
                        </div>
                        {doc.subtitle && (
                          <p className="text-xs text-muted truncate mt-0.5 font-sans">
                            {doc.subtitle}
                          </p>
                        )}
                      </a>
                    );
                  })}
                </div>
              ))}

              {!query && !isLoading && (
                <div className="p-4 text-xs space-y-3">
                  <span className="block font-mono text-[10px] uppercase font-bold tracking-wider text-muted">
                    Quick Sample Inquiries
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Robotics jobs in France',
                      'MIM jobs in Europe',
                      'ASML lithography',
                      'German automaker battery',
                      'Automotive jobs in Germany',
                      'CSRD compliance roles',
                      'Eindhoven deep tech',
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setQuery(example)}
                        className="px-2 py-1 rounded border border-hairline bg-paper text-muted hover:text-ink hover:border-cobalt transition-colors font-mono text-[11px]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-hairline bg-paper text-[11px] font-mono text-muted select-none">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-surface border border-hairline text-[10px]">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-surface border border-hairline text-[10px]">↵</kbd> select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-surface border border-hairline text-[10px]">esc</kbd> close
                </span>
              </div>
              {query && (
                <a
                  href={url(`/search/?q=${encodeURIComponent(query)}`)}
                  className="text-cobalt hover:underline"
                >
                  Full Results Page →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
