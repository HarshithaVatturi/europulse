import type { APIRoute } from 'astro';
import {
  getNews,
  getJobs,
  getCompanies,
  getIndustries,
  getCountries,
  getDegrees,
  getRoles,
  getSkills,
} from '@/services';

export const prerender = true;

export const GET: APIRoute = async () => {
  const [news, jobs, companies, industries, countries, degrees, roles, skills] =
    await Promise.all([
      getNews(),
      getJobs(),
      getCompanies(),
      getIndustries(),
      getCountries(),
      getDegrees(),
      getRoles(),
      getSkills(),
    ]);

  const indexData = [
    ...news.map((n) => ({
      id: `news-${n.slug}`,
      type: 'News',
      title: n.title,
      subtitle: `${n.date} · ${n.summary.slice(0, 90)}...`,
      url: `/news/${n.slug}/`,
      keywords: `${n.title} ${n.summary} ${n.careerImpact} ${n.industries.join(' ')} ${n.countries.join(' ')} ${n.companies.join(' ')}`,
    })),
    ...jobs.map((j) => ({
      id: `job-${j.slug}`,
      type: 'Job',
      title: j.title,
      subtitle: `${j.company.toUpperCase()} · ${j.city}, ${j.country.toUpperCase()} · ${j.employmentType}`,
      url: `/jobs/${j.slug}/`,
      keywords: `${j.title} ${j.company} ${j.city} ${j.country} ${j.industry} ${j.function} ${j.skills.join(' ')}`,
    })),
    ...companies.map((c) => ({
      id: `company-${c.slug}`,
      type: 'Company',
      title: c.name,
      subtitle: `${c.hqCity} · ${c.industry} · Founded ${c.founded}`,
      url: `/companies/${c.slug}/`,
      keywords: `${c.name} ${c.hqCity} ${c.industry} ${c.products.join(' ')}`,
    })),
    ...industries.map((i) => ({
      id: `industry-${i.slug}`,
      type: 'Industry',
      title: i.name,
      subtitle: i.summary.slice(0, 90),
      url: `/industries/${i.slug}/`,
      keywords: `${i.name} ${i.summary} ${i.aliases.join(' ')}`,
    })),
    ...countries.map((c) => ({
      id: `country-${c.slug}`,
      type: 'Country',
      title: `${c.name} (${c.iso2})`,
      subtitle: `Capital: ${c.capital} · Currency: ${c.currency}`,
      url: `/countries/${c.slug}/`,
      keywords: `${c.name} ${c.iso2} ${c.capital} ${c.aliases.join(' ')}`,
    })),
    ...degrees.map((d) => ({
      id: `degree-${d.slug}`,
      type: 'Degree',
      title: d.name,
      subtitle: d.summary.slice(0, 90),
      url: `/careers/${d.slug}/`,
      keywords: `${d.name} ${d.summary} ${d.roles.join(' ')}`,
    })),
    ...roles.map((r) => ({
      id: `role-${r.slug}`,
      type: 'Role',
      title: r.name,
      subtitle: `Function: ${r.function} · ${r.summary.slice(0, 70)}...`,
      url: `/careers/roles/${r.slug}/`,
      keywords: `${r.name} ${r.function} ${r.summary} ${r.skills.join(' ')}`,
    })),
    ...skills.map((s) => ({
      id: `skill-${s.slug}`,
      type: 'Skill',
      title: s.name,
      subtitle: `Category: ${s.category} · ${s.aliases.join(', ')}`,
      url: `/jobs/?query=${encodeURIComponent(s.name)}`,
      keywords: `${s.name} ${s.category} ${s.aliases.join(' ')}`,
    })),
  ];

  return new Response(JSON.stringify(indexData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
