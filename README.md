# Nathan Somevi Developer Website

<p align="left">
  <img src="https://img.shields.io/badge/Next.js_16-App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-UI_Runtime-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Strictly_Typed-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-Custom_Design_System-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/OpenAI-Agent_Provider-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI provider" />
  <img src="https://img.shields.io/badge/Groq-Provider_Fallback-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq fallback provider" />
  <img src="https://img.shields.io/badge/Google_Calendar-Live_Booking-4285F4?style=for-the-badge&logo=googlecalendar&logoColor=white" alt="Google Calendar integration" />
</p>

A custom portfolio and lead-generation site for Nathan Somevi / Somevi Labs.

This project is not a static brochure. It is a small product: a design-led homepage, a live work showcase, an on-site AI assistant that qualifies leads, and a Google Calendar booking flow that can turn visitor intent into a scheduled meeting. The goal is simple: make the site feel polished to a recruiter, useful to a client, and technically credible to an engineer.

## Why This Repo Is Worth Looking At

- It shows front-end craft without hiding behind a template or UI kit.
- It combines product design, engineering, and business conversion in one codebase.
- It integrates an AI agent in a practical way: qualifying leads, answering scoped questions, and handing users into booking.
- It ships real API work, not just mocked interactions.
- It demonstrates the kind of thinking needed for client work: clear UX, performance, accessibility, guardrails, and automation.

## What Visitors Actually See

| Surface | What it does | Why it matters |
| --- | --- | --- |
| Sticky navigation | Smooth-scroll navigation with responsive mobile menu | Keeps the site usable and intentional on both desktop and mobile |
| Hero section | Personal positioning, headshot, animated delivery messaging, and strong CTA | Makes the value proposition immediate |
| Feature grid | Explains the product mindset: conversion, performance, accessibility, and editable-content thinking | Communicates engineering quality in business language |
| Services band | Expandable service cards for strategy, UI/UX, build, motion, maintenance, and AI agent work | Turns capabilities into a scannable offer |
| Work showcase | Clickable project cards linking to live websites | Gives visible proof of execution |
| Booking flow | Portal-based modal with calendar UI, slot selection, form capture, and confirmation state | Converts interest into a real meeting |
| AI widget | Floating assistant with suggested prompts and conversational replies | Adds a modern product layer and captures intent early |
| Footer CTA | Final conversion point with contact routes and supporting links | Reinforces the business goal of the site |

## Live Work Featured In The UI

- [Team Church Glasgow](https://teamchurchglasgow.com/)
- [Skara Ceilidh Band](https://skaraceilidh.com/)
- [Celtic Worship](https://celticworship.netlify.app/)
- [Zerua](https://zerua.netlify.app/)
- [Stem Player](https://stem-player.netlify.app/)

## AI Agent Integration

The AI assistant is the most distinctive part of the project because it is integrated as a business workflow, not a gimmick.

### How it fits into the site

1. `components/ChatAgentWidget.tsx` renders a floating assistant with prompt chips, client-side thread state, loading states, and CTA escalation.
2. User messages are posted to `app/api/agent/route.ts`.
3. The route sanitizes the chat history, applies rate limiting, checks for static high-frequency intents, and only calls a model when needed.
4. The agent can call internal tools to return services, estimate price ranges, expose booking details, and capture quote-request data.
5. Responses are normalized into a structured, recruiter-friendly tone with a follow-up question and booking handoff.
6. When the conversation reaches booking intent, the UI can push the user directly into the `Book a Call` flow.

### What the agent does well

- Answers common project-start questions without making the user hunt through the page
- Gives directional pricing and timeline guidance
- Collects qualification details for quotes
- Explains services and next steps
- Pushes users toward booking instead of letting the conversation drift

### Guardrails built into the implementation

- Per-IP rate limiting: `20` requests per `60` seconds
- Message sanitization and trimming before provider calls
- Common intents handled statically first to reduce model cost and latency
- Structured response formatting so output stays short and useful
- Tool syntax blocked from leaking into the user experience
- Fallback path from OpenAI to Groq when configured
- Clear scope boundary: the assistant helps qualify and route work, it does not pretend to be a coding agent for the visitor

### Internal tools exposed to the model

- `get_services`
- `estimate_price_range`
- `get_booking_details`
- `submit_quote_request`

That means the agent is not just chatting. It is wired into real site logic and controlled server-side business rules.

## Booking And Scheduling Flow

The booking experience is another strong part of the project because it closes the loop from landing page to booked meeting.

- `components/BookCallButton.tsx` opens a portal modal with direct contact options plus a custom booking interface
- `GET /api/booking/slots` reads live availability from Google Calendar free/busy data
- `POST /api/booking` validates input, re-checks conflicts, and creates the event
- `lib/server/googleCalendar.ts` signs a service-account JWT, exchanges it for an access token, reads free/busy windows, and creates events
- When available, the event creation flow also requests a Google Meet link
- Timezone, meeting length, booking window, and workday hours are env-driven

This is a practical example of full-stack product work: front-end interaction design, server validation, external API integration, and real-world failure handling.

## Technical Highlights

| Area | Implementation |
| --- | --- |
| Front end | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 plus custom CSS variables in `app/globals.css` |
| Design language | Custom palette, 8px spacing rhythm, textured backgrounds, pixel-notch accents, reduced-motion support |
| Typography | `Space Grotesk` and `IBM Plex Mono` via `next/font/google` |
| Media | `next/image` for optimized image delivery |
| Icon system | Custom inline SVG pixel icons generated from 6x6 binary maps |
| Vector art | Custom section artwork rendered in SVG, not pulled from a design library |
| AI orchestration | OpenAI Responses API path plus Groq chat-completions fallback |
| Validation | Static agent regression checks and model-path canary tests in `scripts/` |

## External Services And APIs

| Service | Role in the project |
| --- | --- |
| OpenAI | Primary provider for the website assistant |
| Groq | Secondary provider / fallback for the assistant |
| Google Calendar API | Availability lookup and booking event creation |
| Google OAuth service-account flow | Server-side authentication for calendar access |
| Google Meet | Attached automatically when supported by the event creation flow |
| Google Fonts through `next/font` | Optimized delivery of `Space Grotesk` and `IBM Plex Mono` |

## Project Structure

```text
app/
  api/
    agent/route.ts           AI assistant orchestration, tool calling, fallback logic
    booking/route.ts         Booking submission endpoint
    booking/slots/route.ts   Public availability endpoint
  globals.css                Design tokens, motion, texture, component utilities
  layout.tsx                 Fonts, metadata, root layout
  page.tsx                   Homepage composition

components/
  BookCallButton.tsx         Booking modal + calendar UI
  ChatAgentWidget.tsx        Floating AI chat interface
  FeatureGrid.tsx            Product-proof feature section
  Hero.tsx                   Hero copy and CTA surface
  HeroIllustration.tsx       Headshot presentation
  Navigation.tsx             Sticky nav and mobile menu
  PixelIcon.tsx              Inline SVG icon system
  SectionVectorArt.tsx       Decorative vector artwork
  ServicesBand.tsx           Expandable services section
  SiteFooter.tsx             Footer CTA and contact links
  WorkShowcase.tsx           Live project cards

lib/server/
  googleCalendar.ts          Free/busy queries, JWT auth, event creation

scripts/
  test-agent-static.sh       Static-path regression tests
  test-agent-canary.sh       Provider-path canary checks
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file and add the variables you need:

```bash
# AI assistant
AGENT_PROVIDER=auto
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

# Google Calendar booking
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=
BOOKING_TIMEZONE=Europe/London
BOOKING_MEETING_MINUTES=30
BOOKING_SLOT_DAYS=14
BOOKING_WORKDAY_START=09:00
BOOKING_WORKDAY_END=18:00
```

### Provider behavior

- `AGENT_PROVIDER=auto` prefers OpenAI first
- If OpenAI is unavailable and Groq is configured, the route can fall back to Groq
- If neither provider is configured, the assistant returns a setup error instead of failing silently

## Validation

```bash
npm run lint
npm run test:agent:static
npm run test:agent:canary
```

Notes:

- The shell tests are Bash-based and use `curl`
- The canary script also expects `jq`
- By default both scripts hit `http://127.0.0.1:3000/api/agent`
- Override with `AGENT_BASE_URL` when needed

## Engineering Notes

- The site is deliberately custom. There is no off-the-shelf portfolio theme or heavy component library doing the work.
- The AI assistant is business-scoped on purpose. It is designed to qualify, guide, and convert, not to become an unbounded chatbot.
- Quote capture is currently lightweight and runtime-local; the natural next production step would be CRM or database persistence.
- The repo shows the overlap between design, product thinking, and implementation, which is the kind of work this site is meant to represent.

## For Recruiters And Hiring Teams

If you are skimming this repository as part of an application, the short version is:

- I can build polished user-facing interfaces
- I can integrate external services cleanly
- I can apply AI where it actually improves a product flow
- I think about conversion, usability, and technical guardrails together
- I can ship the front end and the back end needed to make a small product feel complete
