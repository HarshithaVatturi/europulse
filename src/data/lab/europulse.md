---
title: "EuroPulse Platform Architecture & Development"
type: "Project"
status: "In Progress"
date: "2026-09-29"
tags: ["Astro", "React", "TypeScript", "Tailwind CSS v4", "MiniSearch", "Static Architecture"]
links:
  - label: "GitHub Repository"
    url: "https://github.com/europulse/europulse"
  - label: "Architecture Spec"
    url: "/about/"
draft: false
summary: "Building an ultra-fast, zero-cost European business and career intelligence engine hosted statically on GitHub Pages with Astro 5, React islands, and client-side graph relationships."
---

## Project Overview

EuroPulse is an editorial intelligence platform engineered to bridge European macroeconomic and industrial news directly into concrete career opportunities, roles, and skills.

### Key Architecture Principles

1. **Pure Static Generation**: Built with Astro 5 static output and React islands for client interactivity. Every route compiles to clean static HTML (`index.html`), ensuring instant time-to-first-byte (TTFB), zero database operational cost, and full SEO indexing without SPA workarounds on GitHub Pages.
2. **Deterministic Data Graph**: All entities (Countries, Industries, Companies, Topics, Skills, Roles, Degrees, Jobs, and News) link through a single unidirectional reference graph. Reverse relationships (e.g. which jobs require Python, which companies operate in Sweden, which news impacts MIM graduates) are derived at build time in `src/lib/graph.ts`.
3. **Data-Terminal Editorial Aesthetic**: Broadsheet typography (Newsreader) paired with high-precision monospace data elements (IBM Plex Mono) and clean UI interfaces (IBM Plex Sans), avoiding generic SaaS templates.
4. **GDPR & Privacy Compliant**: Zero third-party trackers, zero cookies, self-hosted Fontsource typefaces, and static client-side search powered by MiniSearch.
