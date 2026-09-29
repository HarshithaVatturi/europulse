import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const countries = defineCollection({
  loader: file('src/data/countries.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
    iso2: z.string(),
    capital: z.string(),
    currency: z.string(),
    languages: z.array(z.string()),
    isEU: z.boolean(),
    isSchengen: z.boolean(),
    isEurozone: z.boolean(),
    businessHubs: z.array(z.string()),
    studentInfo: z.object({
      officialPortalUrl: z.string().url(),
      visaSummary: z.string(),
      postStudyWorkDuration: z.string(),
      tuitionNotes: z.string(),
    }),
    aliases: z.array(z.string()),
    gridCoords: z.object({
      row: z.number(),
      col: z.number(),
    }),
  }),
});

const industries = defineCollection({
  loader: file('src/data/industries.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
    color: z.string(),
    trends: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        direction: z.enum(['up', 'down', 'stable']),
        period: z.string(),
      })
    ),
    momentumSeries: z.array(z.number()),
    aliases: z.array(z.string()),
  }),
});

const topics = defineCollection({
  loader: file('src/data/topics.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const companies = defineCollection({
  loader: file('src/data/companies.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
    hqCity: z.string(),
    country: z.string(),
    operatingCountries: z.array(z.string()),
    industry: z.string(),
    founded: z.number(),
    products: z.array(z.string()),
    website: z.string().url(),
    careersUrl: z.string().url(),
    skills: z.array(z.string()),
    degrees: z.array(z.string()),
    internshipNotes: z.string(),
  }),
});

const skills = defineCollection({
  loader: file('src/data/skills.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    category: z.enum(['Technical', 'Engineering', 'Business & Analytics', 'Management', 'Domain Knowledge']),
    summary: z.string(),
    aliases: z.array(z.string()),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const roles = defineCollection({
  loader: file('src/data/roles.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    function: z.string(),
    skills: z.array(z.string()),
    industries: z.array(z.string()),
    entryRoutes: z.array(z.string()),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const degrees = defineCollection({
  loader: file('src/data/degrees.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
    skills: z.array(z.string()),
    roles: z.array(z.string()),
    roadmap: z.array(
      z.object({
        stage: z.string(),
        period: z.string(),
        focus: z.string(),
        actions: z.array(z.string()),
      })
    ),
  }),
});

const startups = defineCollection({
  loader: file('src/data/startups.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    summary: z.string(),
    country: z.string(),
    city: z.string(),
    industry: z.string(),
    founded: z.number(),
    fundingStage: z.string(),
    amount: z.string(),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const news = defineCollection({
  loader: file('src/data/news.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    date: z.string(),
    source: z.object({
      name: z.string(),
      url: z.string().url().optional(),
    }),
    summary: z.string().max(350), // original and <=60 words
    careerImpact: z.string(),
    countries: z.array(z.string()),
    industries: z.array(z.string()),
    companies: z.array(z.string()),
    topics: z.array(z.string()),
    skills: z.array(z.string()),
    roles: z.array(z.string()),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const jobs = defineCollection({
  loader: file('src/data/jobs.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    company: z.string(),
    country: z.string(),
    city: z.string(),
    industry: z.string(),
    function: z.string(),
    degrees: z.array(z.string()),
    experience: z.enum(['Graduate / Entry', '1-3 Years', '3-5 Years', '5+ Years', 'Student']),
    employmentType: z.enum(['Full-time', 'Graduate Programme', 'Working Student', 'Apprenticeship', 'Thesis', 'Internship']),
    workMode: z.enum(['On-site', 'Hybrid', 'Remote']),
    languages: z.array(z.string()),
    skills: z.array(z.string()),
    postedDate: z.string(),
    source: z.string(),
    applyUrl: z.string().url(),
    featured: z.boolean(),
    isDemo: z.boolean(),
  }),
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/lab' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['Project', 'Experiment', 'Architecture', 'Research']),
    status: z.enum(['In Progress', 'Shipped', 'Exploring']),
    date: z.string(),
    tags: z.array(z.string()),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    ),
    draft: z.boolean().default(false),
    summary: z.string(),
  }),
});

export const collections = {
  countries,
  industries,
  topics,
  companies,
  skills,
  roles,
  degrees,
  startups,
  news,
  jobs,
  lab,
};
