export type TrendDirection = 'up' | 'down' | 'stable';

export type ExperienceLevel =
  | 'Graduate / Entry'
  | '1-3 Years'
  | '3-5 Years'
  | '5+ Years'
  | 'Student';

export type EmploymentType =
  | 'Full-time'
  | 'Graduate Programme'
  | 'Working Student'
  | 'Apprenticeship'
  | 'Thesis'
  | 'Internship';

export type WorkMode = 'On-site' | 'Hybrid' | 'Remote';

export type LabStatus = 'In Progress' | 'Shipped' | 'Exploring';
export type LabType = 'Project' | 'Experiment' | 'Architecture' | 'Research';

export interface CountryStudentInfo {
  officialPortalUrl: string;
  visaSummary: string;
  postStudyWorkDuration: string;
  tuitionNotes: string;
}

export interface MacroIndicators {
  iso2: string;
  gdpGrowthRate: number | null;
  gdpPeriod: string | null;
  unemploymentRate: number | null;
  unemploymentPeriod: string | null;
  youthUnemploymentRate: number | null;
  youthUnemploymentPeriod: string | null;
  source: string;
  lastUpdated: string;
}

export interface Country {
  id: string;
  slug: string;
  name: string;
  summary: string;
  featured: boolean;
  isDemo: boolean;
  iso2: string;
  capital: string;
  currency: string;
  languages: string[];
  isEU: boolean;
  isSchengen: boolean;
  isEurozone: boolean;
  businessHubs: string[];
  studentInfo: CountryStudentInfo;
  aliases: string[];
  gridCoords: { row: number; col: number };
}

export interface IndustryTrend {
  title: string;
  description: string;
  direction: TrendDirection;
  period: string;
}

export interface Industry {
  id: string;
  slug: string;
  name: string;
  summary: string;
  featured: boolean;
  isDemo: boolean;
  color: string;
  trends: IndustryTrend[];
  momentumSeries: number[];
  aliases: string[];
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  summary: string;
  featured: boolean;
  isDemo: boolean;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  summary: string;
  featured: boolean;
  isDemo: boolean;
  hqCity: string;
  country: string; // country slug
  operatingCountries: string[];
  industry: string; // industry slug
  founded: number;
  products: string[];
  website: string;
  careersUrl: string;
  skills: string[]; // skill slugs
  degrees: string[]; // degree slugs
  internshipNotes: string;
}

export interface NewsSource {
  name: string;
  url?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  source: NewsSource;
  summary: string;
  careerImpact: string;
  countries: string[]; // country slugs
  industries: string[]; // industry slugs
  companies: string[]; // company slugs
  topics: string[]; // topic slugs
  skills: string[]; // skill slugs
  roles: string[]; // role slugs
  featured: boolean;
  isDemo: boolean;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string; // company slug
  country: string; // country slug
  city: string;
  industry: string; // industry slug
  function: string; // function name
  degrees: string[]; // degree slugs
  experience: ExperienceLevel;
  employmentType: EmploymentType;
  workMode: WorkMode;
  languages: string[];
  skills: string[]; // skill slugs
  postedDate: string; // YYYY-MM-DD
  source: string;
  applyUrl: string;
  featured: boolean;
  isDemo: boolean;
}

export interface DegreeRoadmapStage {
  stage: string;
  period: string;
  focus: string;
  actions: string[];
}

export interface Degree {
  id: string;
  slug: string;
  name: string;
  summary: string;
  skills: string[]; // skill slugs
  roles: string[]; // role slugs
  roadmap: DegreeRoadmapStage[];
  featured: boolean;
  isDemo: boolean;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  summary: string;
  function: string;
  skills: string[]; // skill slugs
  industries: string[]; // industry slugs
  entryRoutes: string[];
  featured: boolean;
  isDemo: boolean;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  summary: string;
  category: 'Technical' | 'Engineering' | 'Business & Analytics' | 'Management' | 'Domain Knowledge';
  aliases: string[];
  featured: boolean;
  isDemo: boolean;
}

export interface Startup {
  id: string;
  slug: string;
  name: string;
  summary: string;
  country: string; // country slug
  city: string;
  industry: string; // industry slug
  founded: number;
  fundingStage: string;
  amount: string;
  featured: boolean;
  isDemo: boolean;
}

export interface PulseCountryBrief {
  countrySlug: string;
  countryIso2: string;
  countryName: string;
  items: Array<{
    text: string;
    industrySlug: string;
    industryName: string;
    companySlug?: string;
  }>;
}

export interface PulseEdition {
  date: string; // YYYY-MM-DD
  editionNumber: number;
  isDemo: boolean;
  leadSummary: string;
  countryBriefs: PulseCountryBrief[];
  sideRail: {
    companiesToWatch: string[]; // company slugs
    industriesToWatch: Array<{
      slug: string;
      name: string;
      trend: TrendDirection;
      note: string;
    }>;
    careerInsightOfDay: {
      title: string;
      content: string;
      linkedRoleSlug?: string;
      linkedRoleName?: string;
    };
    startupFundingWatch: Array<{
      startupSlug: string;
      name: string;
      round: string;
      amount: string;
      industrySlug: string;
      countryIso2: string;
    }>;
  };
}

export interface LabEntry {
  slug: string;
  title: string;
  type: LabType;
  status: LabStatus;
  date: string;
  tags: string[];
  links: Array<{ label: string; url: string }>;
  draft: boolean;
  summary: string;
  content?: string;
}

export interface JobFilterParams {
  query?: string;
  country?: string;
  city?: string;
  industry?: string;
  function?: string;
  degree?: string;
  experience?: string;
  employmentType?: string;
  workMode?: string;
  language?: string;
  page?: number;
  limit?: number;
}

export interface NewsFilterParams {
  query?: string;
  country?: string;
  industry?: string;
  topic?: string;
  company?: string;
  skill?: string;
  role?: string;
  page?: number;
  limit?: number;
}
