import React, { useState } from 'react';
import { ExternalLink, Search, Globe, Compass } from 'lucide-react';

interface LinkOutPortal {
  name: string;
  category: 'pan-eu' | 'germany' | 'france' | 'benelux' | 'iberia' | 'italy' | 'switzerland' | 'nordics' | 'cee' | 'uk-ireland' | 'graduates';
  urlPattern: (query: string, country: string, city: string) => string;
  description: string;
  country: string;
}

const PORTALS: LinkOutPortal[] = [
  // Pan-European & Global
  {
    name: 'LinkedIn Jobs',
    category: 'pan-eu',
    country: 'Europe',
    description: 'Direct deep search for verified European professional postings',
    urlPattern: (q, c, city) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q || 'technology')}&location=${encodeURIComponent(city || c || 'Europe')}`,
  },
  {
    name: 'Indeed Europe',
    category: 'pan-eu',
    country: 'Europe',
    description: 'European cross-border search engine',
    urlPattern: (q, c, city) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q || 'engineer')}&l=${encodeURIComponent(city || c || 'Europe')}`,
  },
  {
    name: 'Glassdoor',
    category: 'pan-eu',
    country: 'Europe',
    description: 'European openings with anonymous salary and culture ratings',
    urlPattern: (q) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q || 'engineer')}&locT=N&locId=0`,
  },
  {
    name: 'EURES Portal',
    category: 'pan-eu',
    country: 'EU / EEA',
    description: 'Official European Labour Authority cross-border mobility portal',
    urlPattern: (q) => `https://eures.ec.europa.eu/jobseekers-and-employers/find-job_en?keyword=${encodeURIComponent(q || '')}`,
  },
  {
    name: 'Welcome to the Jungle',
    category: 'pan-eu',
    country: 'Europe',
    description: 'Tech scaleup culture and direct applications across France, Germany, Spain',
    urlPattern: (q, c) => `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(q || 'tech')}&aroundQuery=${encodeURIComponent(c || 'Europe')}`,
  },
  {
    name: 'Careerjet Europe',
    category: 'pan-eu',
    country: 'Europe',
    description: 'Search across thousands of European company websites',
    urlPattern: (q, c, city) => `https://www.careerjet.com/search/jobs?s=${encodeURIComponent(q || '')}&l=${encodeURIComponent(city || c || 'Europe')}`,
  },

  // Germany
  {
    name: 'StepStone Germany',
    category: 'germany',
    country: 'Germany',
    description: "Germany's leading specialist career portal",
    urlPattern: (q, _, city) => `https://www.stepstone.de/jobs/${encodeURIComponent(q || 'ingenieur')}/in-${encodeURIComponent(city || 'deutschland')}`,
  },
  {
    name: 'Xing Jobs',
    category: 'germany',
    country: 'DACH Region',
    description: 'Leading professional network in Germany, Austria and Switzerland',
    urlPattern: (q, _, city) => `https://www.xing.com/jobs/search?keywords=${encodeURIComponent(q || 'engineer')}&location=${encodeURIComponent(city || 'Deutschland')}`,
  },
  {
    name: 'BA Jobsuche',
    category: 'germany',
    country: 'Germany',
    description: 'Official Federal Employment Agency (Bundesagentur für Arbeit)',
    urlPattern: (q, _, city) => `https://www.arbeitsagentur.de/jobsuche/suche?was=${encodeURIComponent(q || '')}&wo=${encodeURIComponent(city || 'Deutschland')}`,
  },

  // France
  {
    name: 'France Travail',
    category: 'france',
    country: 'France',
    description: 'Official French national public employment platform',
    urlPattern: (q, _, city) => `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(q || 'cadre')}&lieux=${encodeURIComponent(city || 'France')}`,
  },
  {
    name: 'APEC',
    category: 'france',
    country: 'France',
    description: 'Association pour l’emploi des cadres (executive & graduate careers)',
    urlPattern: (q, _, city) => `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(q || '')}&lieux=${encodeURIComponent(city || 'France')}`,
  },
  {
    name: 'WTTJ France',
    category: 'france',
    country: 'France',
    description: 'Leading French tech and innovation hiring platform',
    urlPattern: (q) => `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(q || 'tech')}&aroundQuery=France`,
  },

  // Benelux
  {
    name: 'Nationale Vacaturebank',
    category: 'benelux',
    country: 'Netherlands',
    description: 'Popular Dutch employment portal',
    urlPattern: (q, _, city) => `https://www.nationalevacaturebank.nl/vacature/zoeken?query=${encodeURIComponent(q || '')}&location=${encodeURIComponent(city || 'Nederland')}`,
  },
  {
    name: 'VDAB',
    category: 'benelux',
    country: 'Belgium (Flanders/Brussels)',
    description: 'Flemish public employment service with Brussels hubs',
    urlPattern: (q) => `https://www.vdab.be/vindeenjob/vacatures?trefwoord=${encodeURIComponent(q || '')}`,
  },

  // Spain & Portugal
  {
    name: 'InfoJobs Spain',
    category: 'iberia',
    country: 'Spain',
    description: "Spain's premier employment marketplace",
    urlPattern: (q, _, city) => `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${encodeURIComponent(q || '')}&provinceIds=${encodeURIComponent(city || '')}`,
  },
  {
    name: 'Net-Empregos',
    category: 'iberia',
    country: 'Portugal',
    description: 'Leading recruitment and talent platform in Portugal',
    urlPattern: (q) => `https://www.net-empregos.com/pesquisa-empregos.asp?chaves=${encodeURIComponent(q || '')}`,
  },

  // Italy
  {
    name: 'InfoJobs Italy',
    category: 'italy',
    country: 'Italy',
    description: 'Top job portal for Milan, Rome and Italian industrial hubs',
    urlPattern: (q, _, city) => `https://www.infojobs.it/offerte-lavoro?keyword=${encodeURIComponent(q || '')}&province=${encodeURIComponent(city || '')}`,
  },
  {
    name: 'Indeed Italia',
    category: 'italy',
    country: 'Italy',
    description: 'Direct postings across Italian technology and manufacturing clusters',
    urlPattern: (q, _, city) => `https://it.indeed.com/offerte-lavoro?q=${encodeURIComponent(q || '')}&l=${encodeURIComponent(city || 'Italia')}`,
  },

  // Switzerland
  {
    name: 'jobs.ch',
    category: 'switzerland',
    country: 'Switzerland',
    description: 'Leading Swiss career platform for Zurich, Geneva and Basel',
    urlPattern: (q, _, city) => `https://www.jobs.ch/en/vacancies/?term=${encodeURIComponent(q || '')}&location=${encodeURIComponent(city || 'Switzerland')}`,
  },
  {
    name: 'Jobup.ch',
    category: 'switzerland',
    country: 'Switzerland (Romandie)',
    description: 'Primary platform for French-speaking Switzerland',
    urlPattern: (q) => `https://www.jobup.ch/fr/emplois/?term=${encodeURIComponent(q || '')}`,
  },

  // Nordics
  {
    name: 'Jobindex',
    category: 'nordics',
    country: 'Denmark',
    description: 'Denmark’s largest job search engine',
    urlPattern: (q) => `https://www.jobindex.dk/jobsoegning?q=${encodeURIComponent(q || '')}`,
  },
  {
    name: 'Finn.no',
    category: 'nordics',
    country: 'Norway',
    description: 'Norway’s national job market platform',
    urlPattern: (q) => `https://www.finn.no/job/fulltime/search.html?q=${encodeURIComponent(q || '')}`,
  },
  {
    name: 'Platsbanken (Arbetsförmedlingen)',
    category: 'nordics',
    country: 'Sweden',
    description: 'Swedish official public employment service',
    urlPattern: (q) => `https://arbetsformedlingen.se/platsbanken/annonser?q=${encodeURIComponent(q || '')}`,
  },
  {
    name: 'Duunitori',
    category: 'nordics',
    country: 'Finland',
    description: 'Finland’s modern career and jobs discovery hub',
    urlPattern: (q) => `https://duunitori.fi/tyopaikat?haku=${encodeURIComponent(q || '')}`,
  },

  // Poland & Central Europe
  {
    name: 'Pracuj.pl',
    category: 'cee',
    country: 'Poland',
    description: 'Poland’s leading professional job portal',
    urlPattern: (q, _, city) => `https://www.pracuj.pl/praca/${encodeURIComponent(q || 'it')};kw/${encodeURIComponent(city || 'warszawa')};wp`,
  },
  {
    name: 'No Fluff Jobs',
    category: 'cee',
    country: 'Poland & CEE',
    description: 'Transparent tech jobs with mandatory salary ranges',
    urlPattern: (q) => `https://nofluffjobs.com/pl/jobs?criteria=keyword%3D${encodeURIComponent(q || 'tech')}`,
  },
  {
    name: 'Just Join IT',
    category: 'cee',
    country: 'CEE',
    description: 'Central European tech and developer job community',
    urlPattern: (q) => `https://justjoin.it/?keyword=${encodeURIComponent(q || '')}`,
  },

  // UK & Ireland
  {
    name: 'Totaljobs',
    category: 'uk-ireland',
    country: 'United Kingdom',
    description: 'UK wide employment and management postings',
    urlPattern: (q, _, city) => `https://www.totaljobs.com/jobs/${encodeURIComponent(q || 'engineer')}/in-${encodeURIComponent(city || 'uk')}`,
  },
  {
    name: 'IrishJobs',
    category: 'uk-ireland',
    country: 'Ireland',
    description: 'Ireland’s top recruitment site for multinational tech & finance',
    urlPattern: (q, _, city) => `https://www.irishjobs.ie/jobs/${encodeURIComponent(q || 'tech')}/in-${encodeURIComponent(city || 'dublin')}`,
  },

  // Graduates & Traineeships
  {
    name: 'Erasmus+ Traineeships',
    category: 'graduates',
    country: 'EU',
    description: 'Official EU internship and traineeship mobility programmes',
    urlPattern: () => 'https://erasmus-intern.org/traineeships',
  },
  {
    name: 'DAAD Scholarships & Careers',
    category: 'graduates',
    country: 'Germany / Europe',
    description: 'German academic exchange service funding and research jobs',
    urlPattern: () => 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
  },
];

interface Props {
  initialQuery?: string;
  country?: string;
  city?: string;
}

export const LinkOutPanel: React.FC<Props> = ({ initialQuery = '', country = '', city = '' }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery);

  const categories = [
    { id: 'all', label: 'All Portals' },
    { id: 'pan-eu', label: 'Pan-European' },
    { id: 'germany', label: 'Germany' },
    { id: 'france', label: 'France' },
    { id: 'benelux', label: 'Benelux' },
    { id: 'iberia', label: 'Spain & Portugal' },
    { id: 'italy', label: 'Italy' },
    { id: 'switzerland', label: 'Switzerland' },
    { id: 'nordics', label: 'Nordics' },
    { id: 'cee', label: 'Poland & CEE' },
    { id: 'uk-ireland', label: 'UK & Ireland' },
    { id: 'graduates', label: 'Graduates & Interns' },
  ];

  const filteredPortals = PORTALS.filter((p) => activeCategory === 'all' || p.category === activeCategory);

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-6 shadow-sm my-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-semibold">
            <Compass className="w-4 h-4" />
            <span>Link-Out Directory</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
            Search on Verified European Job Portals
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
            Per EuroPulse strict privacy & terms compliance, we do not scrape restricted portals. We build direct deep links to their verified search engines using your current criteria.
          </p>
        </div>

        {/* Dynamic Query Input */}
        <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/80 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 max-w-xs w-full">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-stone-800 dark:text-stone-200"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
        {filteredPortals.map((portal) => {
          const targetUrl = portal.urlPattern(searchTerm, country, city);
          return (
            <a
              key={portal.name}
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors text-sm">
                    {portal.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-1">
                  <Globe className="w-3 h-3" />
                  <span>{portal.country}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                  {portal.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500">
                <span>Deep Search Link</span>
                <span className="text-primary font-mono group-hover:translate-x-0.5 transition-transform">Search &rarr;</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
