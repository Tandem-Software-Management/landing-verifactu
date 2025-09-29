# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start local development server at localhost:4321 |
| `pnpm build` | Build production site to ./dist/ |
| `pnpm preview` | Preview production build locally |
| `pnpm install` | Install dependencies |

## Project Architecture

This is an Astro-based landing page for VeriFactu events by Tandem Software, using Tailwind CSS for styling.

### Key Structure
- **Landing Page**: Single-page application built with Astro
- **Email Registration**: API endpoint handles form submissions via nodemailer
- **Styling**: TailwindCSS 4.x with custom CSS variables and responsive design
- **Email Integration**: Uses nodemailer with SMTP configuration for form submissions

### Main Components
- `src/pages/index.astro` - Main landing page with embedded registration form
- `src/pages/api/registro.ts` - API endpoint for handling registration form submissions
- `src/layouts/Layout.astro` - Base HTML layout template
- `src/components/Welcome.astro` - Default Astro component (likely unused)

### Configuration
- **Astro Config**: Uses TailwindCSS via Vite plugin
- **TypeScript**: Strict configuration with Astro types
- **Email SMTP**: Configured for tandemsoftware.info domain
- **SSR**: API endpoint has prerendering disabled for dynamic functionality

### Key Features
- Responsive landing page design for VeriFactu compliance event
- Embedded registration form with validation
- Email notification system for new registrations
- Custom CSS with extensive responsive breakpoints
- Spanish language content focused on tax compliance regulations