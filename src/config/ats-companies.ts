/**
 * src/config/ats-companies.ts
 * EuroPulse ATS Company Mapping Configuration.
 *
 * Maps European companies to their public Applicant Tracking System (ATS) endpoints:
 * - Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 * - Lever: https://api.lever.co/v0/postings/{token}
 * - SmartRecruiters: https://api.smartrecruiters.com/v1/companies/{token}/postings
 * - Ashby: https://api.ashbyhq.com/posting-api/job-board/{token}
 * - Recruitee: https://{token}.recruitee.com/api/offers
 *
 * Rules:
 * - Closed systems (e.g. Workday, SAP SuccessFactors, Taleo, Avature) are explicitly
 *   marked as 'closed-system' and skipped during automated fetches.
 * - Public ATS boards are tested and return live jobs.
 */

export type AtsType =
  | 'greenhouse'
  | 'lever'
  | 'smartrecruiters'
  | 'ashby'
  | 'recruitee'
  | 'personio-xml'
  | 'workable'
  | 'closed-system';

export interface CompanyAtsEntry {
  companySlug: string;
  name: string;
  atsType: AtsType;
  boardToken?: string;
  careersUrl: string;
  notes: string;
  active: boolean;
}

export const atsCompanies: CompanyAtsEntry[] = [
  // --- Core Taxonomy Companies ---
  {
    companySlug: 'airbus',
    name: 'Airbus',
    atsType: 'closed-system',
    careersUrl: 'https://www.airbus.com/en/careers',
    notes: 'Uses Workday (ag.wd3.myworkdayjobs.com/Airbus). Closed system, automated scraping prohibited.',
    active: false,
  },
  {
    companySlug: 'bmw',
    name: 'BMW Group',
    atsType: 'closed-system',
    careersUrl: 'https://www.bmwgroup.jobs',
    notes: 'Uses SAP SuccessFactors enterprise portal. Automated scraping prohibited.',
    active: false,
  },
  {
    companySlug: 'asml',
    name: 'ASML',
    atsType: 'closed-system',
    careersUrl: 'https://www.asml.com/en/careers',
    notes: 'Custom career portal behind enterprise bot protection. Skipped per legal safety policy.',
    active: false,
  },
  {
    companySlug: 'dassault-systemes',
    name: 'Dassault Systèmes',
    atsType: 'closed-system',
    careersUrl: 'https://careers.3ds.com',
    notes: 'Custom 3DEXPERIENCE portal. Closed API.',
    active: false,
  },
  {
    companySlug: 'safran',
    name: 'Safran',
    atsType: 'closed-system',
    careersUrl: 'https://www.safran-group.com/talent',
    notes: 'Uses Oracle Taleo. Closed system.',
    active: false,
  },
  {
    companySlug: 'lvmh',
    name: 'LVMH Moët Hennessy Louis Vuitton',
    atsType: 'closed-system',
    careersUrl: 'https://www.lvmh.com/talents',
    notes: 'Uses Workday enterprise talent management.',
    active: false,
  },
  {
    companySlug: 'loreal',
    name: "L'Oréal",
    atsType: 'closed-system',
    careersUrl: 'https://careers.loreal.com',
    notes: 'Uses Avature portal. Closed API.',
    active: false,
  },
  {
    companySlug: 'schneider-electric',
    name: 'Schneider Electric',
    atsType: 'closed-system',
    careersUrl: 'https://www.se.com/careers',
    notes: 'Uses Avature talent portal.',
    active: false,
  },
  {
    companySlug: 'mercedes-benz',
    name: 'Mercedes-Benz Group',
    atsType: 'closed-system',
    careersUrl: 'https://group.mercedes-benz.com/careers',
    notes: 'Uses Workday job board. Closed API.',
    active: false,
  },
  {
    companySlug: 'volkswagen',
    name: 'Volkswagen Group',
    atsType: 'closed-system',
    careersUrl: 'https://www.volkswagen-group.com/en/careers',
    notes: 'Uses SAP SuccessFactors enterprise solution.',
    active: false,
  },
  {
    companySlug: 'siemens',
    name: 'Siemens',
    atsType: 'closed-system',
    careersUrl: 'https://www.siemens.com/global/en/company/jobs.html',
    notes: 'Uses Avature enterprise recruiting system.',
    active: false,
  },
  {
    companySlug: 'bosch',
    name: 'Robert Bosch GmbH',
    atsType: 'smartrecruiters',
    boardToken: 'BoschGroup',
    careersUrl: 'https://www.bosch.com/careers',
    notes: 'SmartRecruiters public posting API endpoint verified.',
    active: true,
  },
  {
    companySlug: 'philips',
    name: 'Philips',
    atsType: 'closed-system',
    careersUrl: 'https://www.careers.philips.com',
    notes: 'Uses Workday enterprise portal.',
    active: false,
  },
  {
    companySlug: 'ferrari',
    name: 'Ferrari',
    atsType: 'closed-system',
    careersUrl: 'https://www.ferrari.com/en-EN/corporate/careers',
    notes: 'Uses SAP SuccessFactors.',
    active: false,
  },
  {
    companySlug: 'leonardo',
    name: 'Leonardo',
    atsType: 'closed-system',
    careersUrl: 'https://www.leonardo.com/en/careers',
    notes: 'Uses SAP SuccessFactors.',
    active: false,
  },
  {
    companySlug: 'prada',
    name: 'Prada Group',
    atsType: 'closed-system',
    careersUrl: 'https://www.pradagroup.com/en/people/careers.html',
    notes: 'Uses SuccessFactors recruiting system.',
    active: false,
  },
  {
    companySlug: 'spotify',
    name: 'Spotify',
    atsType: 'lever',
    boardToken: 'spotify',
    careersUrl: 'https://www.lifeatspotify.com',
    notes: 'Lever public API endpoint verified.',
    active: true,
  },
  {
    companySlug: 'ericsson',
    name: 'Ericsson',
    atsType: 'closed-system',
    careersUrl: 'https://www.ericsson.com/en/careers',
    notes: 'Uses SAP SuccessFactors.',
    active: false,
  },
  {
    companySlug: 'volvo',
    name: 'Volvo Group',
    atsType: 'closed-system',
    careersUrl: 'https://www.volvogroup.com/en/careers.html',
    notes: 'Uses SAP SuccessFactors.',
    active: false,
  },
  {
    companySlug: 'abb',
    name: 'ABB',
    atsType: 'closed-system',
    careersUrl: 'https://careers.abb',
    notes: 'Uses Workday portal.',
    active: false,
  },

  // --- Leading European Scaleups & Tech Employers with Public ATS Boards ---
  {
    companySlug: 'celonis',
    name: 'Celonis',
    atsType: 'greenhouse',
    boardToken: 'celonis',
    careersUrl: 'https://www.celonis.com/careers',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
  {
    companySlug: 'personio',
    name: 'Personio',
    atsType: 'greenhouse',
    boardToken: 'personio',
    careersUrl: 'https://www.personio.com/careers',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
  {
    companySlug: 'n26',
    name: 'N26',
    atsType: 'greenhouse',
    boardToken: 'n26',
    careersUrl: 'https://n26.com/en-eu/careers',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
  {
    companySlug: 'wolt',
    name: 'Wolt',
    atsType: 'smartrecruiters',
    boardToken: 'Wolt',
    careersUrl: 'https://wolt.com/en/jobs',
    notes: 'SmartRecruiters public postings API verified.',
    active: true,
  },
  {
    companySlug: 'deliveroo',
    name: 'Deliveroo',
    atsType: 'greenhouse',
    boardToken: 'deliveroo',
    careersUrl: 'https://deliveroo.engineering',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
  {
    companySlug: 'vinted',
    name: 'Vinted',
    atsType: 'greenhouse',
    boardToken: 'vinted',
    careersUrl: 'https://www.vinted.com/jobs',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
  {
    companySlug: 'zalando',
    name: 'Zalando',
    atsType: 'smartrecruiters',
    boardToken: 'Zalando',
    careersUrl: 'https://jobs.zalando.com',
    notes: 'SmartRecruiters public posting API verified.',
    active: true,
  },
  {
    companySlug: 'pleo',
    name: 'Pleo',
    atsType: 'greenhouse',
    boardToken: 'pleo',
    careersUrl: 'https://www.pleo.io/careers',
    notes: 'Greenhouse public API verified.',
    active: true,
  },
];

export function getActiveAtsCompanies(): CompanyAtsEntry[] {
  return atsCompanies.filter(c => c.active && c.boardToken && c.atsType !== 'closed-system');
}
