# EuroPulse

> Europe's business news, connected to your career.

EuroPulse is an editorial intelligence and career navigation platform focused on the European industrial and macroeconomic landscape. It connects every major business development directly to skills, career paths, and live job opportunities:

$$\text{News} \longrightarrow \text{Company} \longrightarrow \text{Industry} \longrightarrow \text{Country} \longrightarrow \text{Skills} \longrightarrow \text{Roles} \longrightarrow \text{Jobs}$$

Designed for Master’s, MIM, MBA, and engineering students, international job seekers, and young professionals targeting Europe, EuroPulse operates as a 100% static platform hosted free on GitHub Pages with zero operational overhead, zero tracking cookies, and broadsheet typography paired with financial terminal data density.

---

## 🌟 Key Features

1. **Europe Business Pulse (`/pulse/`)**: A daily dated briefing (masthead, edition number, country briefs for FR, DE, NL, IT, and SE) with side-rails tracking companies to watch, industry momentum, today's hiring, and startup funding.
2. **Career Impact Trail**: On every news dispatch, a dedicated panel maps the direct career implication, providing interactive hops across Company → Industry → Country → Skills → Roles → Computed Related Jobs.
3. **Career Hub Path Explorer (`/careers/`)**: Select any European graduate degree (e.g., MIM, MBA, MSc Robotics, MSc Data Science) to trace recommended skills, target roles, top hiring sectors, employer monograms, and matched opportunities, plus stage-by-stage career roadmaps.
4. **Command Palette & Smart Search (⌘K / Ctrl+K)**: Instant offline search powered by MiniSearch with build-time indexing and alias detection (e.g., *"chips"* → Semiconductors, *"Robotics jobs in France"* → direct filtered jump).
5. **Multi-Facet Jobs Explorer (`/jobs/`)**: URL-synced filtering across country, city, industry, function, degree, experience level, employment type (graduate programmes, working student, thesis), work mode, and language, with responsive mobile drawer support.
6. **Europe Tile Map**: An interactive 5×5 geographical grid visualizing activity across 14 European economies without relying on heavy canvas or vector mapping libraries.
7. **My Lab (`/my-lab/`)**: Personal engineering and research log with category filters, a skill competencies matrix, project timeline, and draft-mode protection.
8. **Editorial Visual Identity**: Newsreader serif headlines, IBM Plex Sans body, and tabular IBM Plex Mono numerals; class-based dark mode with zero-flash inline script.

---

## 📋 Prerequisites

- **Node.js**: `v20.0.0` or later (tested on Node v24 LTS)
- **Package Manager**: `npm` (v10+ recommended)
- **Operating System**: Windows, macOS, or Linux

---

## 🚀 Running Locally

1. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/your-username/europulse.git
   cd europulse
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:4321/`.

3. **Verify Types and Templates**:
   ```bash
   npm run check
   ```

---

## 🏗️ Building and Previewing

To generate the static production build:

```bash
# Build static site to ./dist (149 pages)
npm run build

# Preview the production output locally
npm run preview
```

### Validating Internal Links

EuroPulse includes an automated link validation script that scans all static HTML files in `./dist`:

```bash
node scripts/check-links.mjs
```

### Testing Sub-Path Deployments

To simulate hosting under a repository sub-path (such as `https://username.github.io/europulse/`):

```bash
# In PowerShell:
$env:BASE_PATH="/europulse"; npm run build; node scripts/check-links.mjs

# In Bash / macOS:
BASE_PATH="/europulse" npm run build && node scripts/check-links.mjs
```

---

## 🚢 Deploying to GitHub Pages

EuroPulse includes a turnkey GitHub Actions deployment workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Step-by-Step Setup:

1. Push the repository to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/europulse.git
   git branch -M main
   git push -u origin main
   ```
2. Navigate to your GitHub repository in the browser.
3. Go to **Settings** → **Pages**.
4. Under **Build and deployment** → **Source**, select **GitHub Actions**.
5. The workflow automatically reads the repository name to configure `SITE` and `BASE_PATH`. Every push to `main` will build and publish the site.

---

## ⚙️ Customization & Renaming

EuroPulse is built to be completely rename-ready. All brand names, taglines, URLs, navigation menus, and owner details live in a single configuration file: [`src/config/site.ts`](src/config/site.ts).

```typescript
export const siteConfig = {
  name: 'EuroPulse',
  tagline: "Europe's business news, connected to your career.",
  description: 'Europe-focused business and career intelligence platform...',
  url: 'https://europulse.github.io',
  basePath: '/',
  // ...
};
```

### Filling in Owner Details

By default, owner fields ship empty. The owner section on the `/about/` page and social links in the footer remain completely hidden until you populate them:

```typescript
// in src/config/site.ts:
owner: {
  name: 'Your Name',
  title: 'Lead Architect & Editor',
  bio: 'Product engineer passionate about European industrial competitiveness...',
  location: 'Paris / Berlin',
  links: {
    github: 'https://github.com/your-username',
    linkedin: 'https://linkedin.com/in/your-profile',
    twitter: 'https://x.com/your-handle',
    email: 'contact@example.com',
  },
}
```

---

## 🧪 Working with Data & Content Collections

All data files live in [`src/data/`](src/data/) and are validated against Zod schemas in [`src/content.config.ts`](src/content.config.ts).

### Replacing Demo Data with Real Data

Illustrative records carry `isDemo: true`:
- Displays amber badges (*"Demo article"*, *"Demo listing"*, *"Example profile"*).
- Injects `<meta name="robots" content="noindex" />`.
- Excludes the record from the public `sitemap.xml`.
- Suppresses `NewsArticle` / `JobPosting` schema markup to maintain pristine search console health.

To publish real data:
1. Update or append records in `src/data/news.json` or `src/data/jobs.json`.
2. Set `isDemo: false`.
3. Provide valid real-world URLs (`applyUrl`, `source.url`). The site will automatically display standard "Apply" buttons and indexable metadata with zero code modifications.

### Adding a "My Lab" Entry

The owner's personal research lab lives in `src/data/lab/`. To add an entry:
1. Create a new Markdown file, e.g. `src/data/lab/my-new-project.md`:
   ```markdown
   ---
   title: "Cross-Border Tax Simulator"
   type: "Project" # 'Project' | 'Experiment' | 'Architecture' | 'Research'
   status: "In Progress" # 'In Progress' | 'Shipped' | 'Exploring'
   date: "2026-10-15"
   tags: ["TypeScript", "WebAssembly", "Finance"]
   draft: false
   links:
     - label: "GitHub"
       url: "https://github.com/username/project"
   summary: "A client-side tax and social security estimator for European remote workers."
   ---

   Detailed documentation, architecture notes, and learnings go here...
   ```
2. Setting `draft: true` keeps the entry visible only during development.

---

## 🏛️ Project Architecture

```
src/
├── components/
│   ├── islands/        # Interactive React components (hydrated with client:idle / client:visible)
│   └── ui/             # Pre-rendered Astro components (zero client JS overhead)
├── config/             # Central site settings and navigation
├── data/               # Type-safe JSON and Markdown content collections
├── lib/
│   ├── graph.ts        # Graph traversal and reverse link derivation
│   ├── search.ts       # MiniSearch configuration and alias query parser
│   └── url.ts          # Central URL helper and en-GB date formatting
├── services/           # Data access layer (abstracted swap points for future APIs)
├── styles/             # Tailwind CSS v4 design tokens and theme variables
├── types/              # Domain models and TypeScript contracts
└── pages/              # Static file-based routing (149 generated HTML pages)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the planned automated daily ingestion pipeline, Eurostat REST API integration, and ethical data guidelines.

---

## ⚖️ License & Ethics

- Source code licensed under the MIT License.
- Adheres strictly to European data privacy standards: no tracking scripts, no third-party cookies, and self-hosted fonts via Fontsource.
