import type {
  NewsArticle,
  Company,
  Industry,
  Country,
  Skill,
  Role,
  Job,
  Degree,
  Startup,
} from '@/types';
import {
  getCompanies,
  getIndustries,
  getCountries,
  getSkills,
  getRoles,
  getJobs,
  getDegrees,
  getNews,
  getStartups,
} from '@/services';

export interface NewsImpactTrail {
  news: NewsArticle;
  companies: Company[];
  industries: Industry[];
  countries: Country[];
  skills: Skill[];
  roles: Role[];
  relatedJobs: Job[];
}

export interface DegreePathExplorerData {
  degree: Degree;
  skills: Skill[];
  roles: Role[];
  industries: Industry[];
  companies: Company[];
  jobs: Job[];
}

export interface CompanyGraphData {
  company: Company;
  country?: Country;
  industry?: Industry;
  operatingCountries: Country[];
  jobs: Job[];
  news: NewsArticle[];
  similarCompanies: Company[];
  skills: Skill[];
  degrees: Degree[];
}

export interface CountryGraphData {
  country: Country;
  companies: Company[];
  startups: Startup[];
  jobs: Job[];
  news: NewsArticle[];
  leadingIndustries: Array<{ industry: Industry; jobCount: number }>;
}

export interface IndustryGraphData {
  industry: Industry;
  companies: Company[];
  startups: Startup[];
  jobs: Job[];
  news: NewsArticle[];
  leadingCountries: Array<{ country: Country; jobCount: number }>;
  roles: Role[];
  skills: Skill[];
}

export interface RoleGraphData {
  role: Role;
  skills: Skill[];
  industries: Industry[];
  degrees: Degree[];
  jobs: Job[];
}

export interface SkillGraphData {
  skill: Skill;
  jobs: Job[];
  companies: Company[];
  roles: Role[];
  degrees: Degree[];
  news: NewsArticle[];
}

/**
 * Builds the complete Career Impact Trail for a news article:
 * Company -> Industry -> Country -> Skills -> Roles -> Jobs
 * Related jobs are computed strictly from the graph (same company, or same industry & country).
 */
export async function getNewsImpactTrail(news: NewsArticle): Promise<NewsImpactTrail> {
  const [allCompanies, allIndustries, allCountries, allSkills, allRoles, allJobs] =
    await Promise.all([
      getCompanies(),
      getIndustries(),
      getCountries(),
      getSkills(),
      getRoles(),
      getJobs(),
    ]);

  const companies = allCompanies.filter((c) =>
    news.companies.some((slug) => slug.toLowerCase() === c.slug.toLowerCase())
  );

  const industries = allIndustries.filter((i) =>
    news.industries.some((slug) => slug.toLowerCase() === i.slug.toLowerCase())
  );

  const countries = allCountries.filter((c) =>
    news.countries.some((slug) => slug.toLowerCase() === c.slug.toLowerCase())
  );

  const skills = allSkills.filter((s) =>
    news.skills.some((slug) => slug.toLowerCase() === s.slug.toLowerCase())
  );

  const roles = allRoles.filter((r) =>
    news.roles.some((slug) => slug.toLowerCase() === r.slug.toLowerCase())
  );

  // Compute related jobs: same company, or same industry AND country
  const newsCompanySlugs = new Set(news.companies.map((c) => c.toLowerCase()));
  const newsIndustrySlugs = new Set(news.industries.map((i) => i.toLowerCase()));
  const newsCountrySlugs = new Set(news.countries.map((c) => c.toLowerCase()));

  const relatedJobs = allJobs.filter((job) => {
    const jobComp = job.company.toLowerCase();
    const jobInd = job.industry.toLowerCase();
    const jobCountry = job.country.toLowerCase();

    if (newsCompanySlugs.has(jobComp)) return true;
    if (newsIndustrySlugs.has(jobInd) && newsCountrySlugs.has(jobCountry)) return true;
    return false;
  });

  return {
    news,
    companies,
    industries,
    countries,
    skills,
    roles,
    relatedJobs,
  };
}

/**
 * Career Hub Path Explorer:
 * Degree -> Skills -> Roles -> Industries -> Companies -> Matching Jobs
 */
export async function getDegreePath(degreeSlug: string): Promise<DegreePathExplorerData | undefined> {
  const [allDegrees, allSkills, allRoles, allIndustries, allCompanies, allJobs] =
    await Promise.all([
      getDegrees(),
      getSkills(),
      getRoles(),
      getIndustries(),
      getCompanies(),
      getJobs(),
    ]);

  const degree = allDegrees.find(
    (d) => d.slug.toLowerCase() === degreeSlug.toLowerCase() || d.id.toLowerCase() === degreeSlug.toLowerCase()
  );
  if (!degree) return undefined;

  const degreeSkillSlugs = new Set(degree.skills.map((s) => s.toLowerCase()));
  const degreeRoleSlugs = new Set(degree.roles.map((r) => r.toLowerCase()));

  const skills = allSkills.filter((s) => degreeSkillSlugs.has(s.slug.toLowerCase()));
  const roles = allRoles.filter((r) => degreeRoleSlugs.has(r.slug.toLowerCase()));

  // Derive target industries from the matched roles
  const industrySlugs = new Set<string>();
  roles.forEach((r) => r.industries.forEach((ind) => industrySlugs.add(ind.toLowerCase())));
  const industries = allIndustries.filter((i) => industrySlugs.has(i.slug.toLowerCase()));

  // Derive target companies: companies in those industries, or companies explicitly seeking this degree
  const companies = allCompanies.filter(
    (c) =>
      c.degrees.some((d) => d.toLowerCase() === degree.slug.toLowerCase()) ||
      industrySlugs.has(c.industry.toLowerCase())
  );

  // Derive matching jobs
  const jobs = allJobs.filter(
    (j) =>
      j.degrees.some((d) => d.toLowerCase() === degree.slug.toLowerCase()) ||
      industrySlugs.has(j.industry.toLowerCase()) ||
      skills.some((sk) => j.skills.includes(sk.slug))
  );

  return {
    degree,
    skills,
    roles,
    industries,
    companies,
    jobs,
  };
}

/**
 * Derives comprehensive graph connections for a Company profile.
 */
export async function getCompanyGraph(companySlug: string): Promise<CompanyGraphData | undefined> {
  const [allCompanies, allCountries, allIndustries, allJobs, allNews, allSkills, allDegrees] =
    await Promise.all([
      getCompanies(),
      getCountries(),
      getIndustries(),
      getJobs(),
      getNews(),
      getSkills(),
      getDegrees(),
    ]);

  const company = allCompanies.find(
    (c) => c.slug.toLowerCase() === companySlug.toLowerCase() || c.id.toLowerCase() === companySlug.toLowerCase()
  );
  if (!company) return undefined;

  const country = allCountries.find((c) => c.slug.toLowerCase() === company.country.toLowerCase());
  const industry = allIndustries.find((i) => i.slug.toLowerCase() === company.industry.toLowerCase());

  const operatingCountries = allCountries.filter((c) =>
    company.operatingCountries.map((oc) => oc.toLowerCase()).includes(c.slug.toLowerCase())
  );

  const jobs = allJobs.filter((j) => j.company.toLowerCase() === company.slug.toLowerCase());
  const news = allNews.filter((n) =>
    n.companies.some((cs) => cs.toLowerCase() === company.slug.toLowerCase())
  );

  const similarCompanies = allCompanies.filter(
    (c) =>
      c.slug !== company.slug &&
      (c.industry.toLowerCase() === company.industry.toLowerCase() ||
        c.country.toLowerCase() === company.country.toLowerCase())
  );

  const skills = allSkills.filter((s) => company.skills.includes(s.slug));
  const degrees = allDegrees.filter((d) => company.degrees.includes(d.slug));

  return {
    company,
    country,
    industry,
    operatingCountries,
    jobs,
    news,
    similarCompanies,
    skills,
    degrees,
  };
}

/**
 * Derives comprehensive graph connections for a Country profile.
 */
export async function getCountryGraph(countrySlug: string): Promise<CountryGraphData | undefined> {
  const [allCountries, allCompanies, allStartups, allJobs, allNews, allIndustries] =
    await Promise.all([
      getCountries(),
      getCompanies(),
      getStartups(),
      getJobs(),
      getNews(),
      getIndustries(),
    ]);

  const country = allCountries.find(
    (c) => c.slug.toLowerCase() === countrySlug.toLowerCase() || c.id.toLowerCase() === countrySlug.toLowerCase()
  );
  if (!country) return undefined;

  const companies = allCompanies.filter(
    (c) =>
      c.country.toLowerCase() === country.slug.toLowerCase() ||
      c.operatingCountries.some((oc) => oc.toLowerCase() === country.slug.toLowerCase())
  );

  const startups = allStartups.filter((s) => s.country.toLowerCase() === country.slug.toLowerCase());
  const jobs = allJobs.filter((j) => j.country.toLowerCase() === country.slug.toLowerCase());
  const news = allNews.filter((n) =>
    n.countries.some((nc) => nc.toLowerCase() === country.slug.toLowerCase())
  );

  // Leading industries based on job frequency
  const indCount = new Map<string, number>();
  jobs.forEach((j) => indCount.set(j.industry, (indCount.get(j.industry) || 0) + 1));
  const leadingIndustries = Array.from(indCount.entries())
    .map(([indSlug, jobCount]) => ({
      industry: allIndustries.find((i) => i.slug === indSlug)!,
      jobCount,
    }))
    .filter((item) => Boolean(item.industry))
    .sort((a, b) => b.jobCount - a.jobCount);

  return {
    country,
    companies,
    startups,
    jobs,
    news,
    leadingIndustries,
  };
}

/**
 * Derives comprehensive graph connections for an Industry profile.
 */
export async function getIndustryGraph(industrySlug: string): Promise<IndustryGraphData | undefined> {
  const [allIndustries, allCompanies, allStartups, allJobs, allNews, allCountries, allRoles, allSkills] =
    await Promise.all([
      getIndustries(),
      getCompanies(),
      getStartups(),
      getJobs(),
      getNews(),
      getCountries(),
      getRoles(),
      getSkills(),
    ]);

  const industry = allIndustries.find(
    (i) => i.slug.toLowerCase() === industrySlug.toLowerCase() || i.id.toLowerCase() === industrySlug.toLowerCase()
  );
  if (!industry) return undefined;

  const companies = allCompanies.filter((c) => c.industry.toLowerCase() === industry.slug.toLowerCase());
  const startups = allStartups.filter((s) => s.industry.toLowerCase() === industry.slug.toLowerCase());
  const jobs = allJobs.filter((j) => j.industry.toLowerCase() === industry.slug.toLowerCase());
  const news = allNews.filter((n) =>
    n.industries.some((ni) => ni.toLowerCase() === industry.slug.toLowerCase())
  );

  // Leading countries by job count
  const countryCounts = new Map<string, number>();
  jobs.forEach((j) => countryCounts.set(j.country, (countryCounts.get(j.country) || 0) + 1));
  const leadingCountries = Array.from(countryCounts.entries())
    .map(([cSlug, jobCount]) => ({
      country: allCountries.find((c) => c.slug === cSlug)!,
      jobCount,
    }))
    .filter((item) => Boolean(item.country))
    .sort((a, b) => b.jobCount - a.jobCount);

  const roles = allRoles.filter((r) =>
    r.industries.some((ind) => ind.toLowerCase() === industry.slug.toLowerCase())
  );

  // Derived skills from jobs in this industry
  const skillCounts = new Map<string, number>();
  jobs.forEach((j) => j.skills.forEach((sk) => skillCounts.set(sk, (skillCounts.get(sk) || 0) + 1)));
  const skills = Array.from(skillCounts.keys())
    .map((slug) => allSkills.find((s) => s.slug === slug)!)
    .filter(Boolean);

  return {
    industry,
    companies,
    startups,
    jobs,
    news,
    leadingCountries,
    roles,
    skills,
  };
}

/**
 * Derives comprehensive graph connections for a Role profile.
 */
export async function getRoleGraph(roleSlug: string): Promise<RoleGraphData | undefined> {
  const [allRoles, allSkills, allIndustries, allDegrees, allJobs] = await Promise.all([
    getRoles(),
    getSkills(),
    getIndustries(),
    getDegrees(),
    getJobs(),
  ]);

  const role = allRoles.find(
    (r) => r.slug.toLowerCase() === roleSlug.toLowerCase() || r.id.toLowerCase() === roleSlug.toLowerCase()
  );
  if (!role) return undefined;

  const skills = allSkills.filter((s) => role.skills.includes(s.slug));
  const industries = allIndustries.filter((i) => role.industries.includes(i.slug));
  const degrees = allDegrees.filter((d) => d.roles.includes(role.slug));

  const jobs = allJobs.filter(
    (j) =>
      j.function.toLowerCase() === role.function.toLowerCase() ||
      skills.some((sk) => j.skills.includes(sk.slug))
  );

  return {
    role,
    skills,
    industries,
    degrees,
    jobs,
  };
}

/**
 * Derives comprehensive graph connections for a Skill.
 */
export async function getSkillGraph(skillSlug: string): Promise<SkillGraphData | undefined> {
  const [allSkills, allJobs, allCompanies, allRoles, allDegrees, allNews] = await Promise.all([
    getSkills(),
    getJobs(),
    getCompanies(),
    getRoles(),
    getDegrees(),
    getNews(),
  ]);

  const skill = allSkills.find(
    (s) => s.slug.toLowerCase() === skillSlug.toLowerCase() || s.id.toLowerCase() === skillSlug.toLowerCase()
  );
  if (!skill) return undefined;

  const jobs = allJobs.filter((j) => j.skills.includes(skill.slug));
  const companies = allCompanies.filter((c) => c.skills.includes(skill.slug));
  const roles = allRoles.filter((r) => r.skills.includes(skill.slug));
  const degrees = allDegrees.filter((d) => d.skills.includes(skill.slug));
  const news = allNews.filter((n) => n.skills.includes(skill.slug));

  return {
    skill,
    jobs,
    companies,
    roles,
    degrees,
    news,
  };
}
