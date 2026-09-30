export interface NavItem {
  label: string;
  href: string;
}

export interface OwnerConfig {
  name: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl?: string;
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

export interface NewsletterConfig {
  webhookUrl?: string;
  providerName?: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  basePath: string;
  locale: string;
  dateFormat: string;
  nav: NavItem[];
  footerNav: NavItem[];
  owner: OwnerConfig;
  newsletter?: NewsletterConfig;
}

export const siteConfig: SiteConfig = {
  name: 'EuroPulse',
  shortName: 'EuroPulse',
  tagline: "Europe's business news, connected to your career",
  description:
    'A Europe-focused business and career intelligence platform. The differentiator: every business story connects directly to industry trends, skills, and open jobs.',
  url: 'https://europulse.github.io',
  basePath: import.meta.env.BASE_URL || '/',
  locale: 'en-GB',
  dateFormat: 'D MMMM YYYY',
  nav: [
    { label: 'Pulse', href: '/pulse/' },
    { label: 'News', href: '/news/' },
    { label: 'Industries', href: '/industries/' },
    { label: 'Countries', href: '/countries/' },
    { label: 'Companies', href: '/companies/' },
    { label: 'Jobs', href: '/jobs/' },
    { label: 'Career Hub', href: '/careers/' },
  ],
  footerNav: [
    { label: 'Sources & Transparency', href: '/sources/' },
    { label: 'About & Methodology', href: '/about/' },
    { label: 'My Lab', href: '/my-lab/' },
    { label: 'Search', href: '/search/' },
  ],
  // Owner fields ship empty as required by the brief.
  // The About page's owner section and any social links stay hidden until they are filled in.
  owner: {
    name: '',
    role: '',
    bio: '',
    location: '',
    socials: {
      github: '',
      linkedin: '',
      twitter: '',
      email: '',
    },
  },
  // Newsletter integration endpoint (Brevo, Buttondown, Formspree, or Cloudflare Worker)
  newsletter: {
    webhookUrl: '',
    providerName: 'Brevo / Privacy-First EU Dispatch',
  },
};

/**
 * Checks if the owner information is populated.
 */
export function isOwnerPopulated(owner: OwnerConfig = siteConfig.owner): boolean {
  return Boolean(owner.name && owner.name.trim().length > 0);
}
