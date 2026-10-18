# Tala AI — Intelligent Meeting Notetaker & Action Hub

> **Executive AI Meeting Notetaker, Prep & Privacy Hub for Teams & Organizations**  
> Private team meeting intelligence for all face-to-face and online sessions.  
> Original IP-safe work-alike engineered under D-org (`digitalmerch4862`).

---

## 🌟 Overview

**Tala AI** ("Tala" is Tagalog for *record, note, or star*) is an executive-grade, privacy-first general meeting notetaker designed for all team sessions — both face-to-face and virtual. Built for private team use, Tala AI provides live audio recording, audio file ingestion, multi-speaker diarization across 92 languages, collaborative meeting agendas with timeboxes, pre-meeting briefs, notes version history, cryptographic privacy auditing, cross-meeting action item tracking, and interactive global Q&A.

A rich suite of meeting templates (including Team Standup, Client Call, 1-on-1, Sales Call, Project Planning, and specialized Real Estate workflows) provides tailored structure and extraction while keeping the core experience fast, versatile, and general-purpose.

---

## 🚀 Complete Feature Architecture

### 1. Collaborative Prep & Agenda Management (`src/prep`)
- **Turnkey General & Industry Templates**: Pre-configured templates for Team Standup, Client Call, 1-on-1, Sales/Prospect Call, Project Planning, plus a dedicated category for Real Estate (Discovery, Site Viewing, Financing, Closing).
- **Timebox Management**: Calculate total planned duration, track allocated minutes per topic, and visualize pacing.
- **Topic Reordering & Talking Points**: Reorder agenda topics with live up/down actions, add interactive talking points, and monitor coverage.
- **Pre-Meeting AI Brief**: One-click synthesis of past meeting history, participant context, strategic talking points, and risk factors.
- **Carry-Over Engine**: Automatically transfer unfinished agenda topics, pending commitments, and open questions into structured follow-up meetings.

### 2. In-Browser Recording & Media Ingestion
- **Face-to-Face Meeting Capture**: In-browser audio recording via Web Audio and `MediaRecorder` API with live waveform meter.
- **Pause & Resume Controls**: Full pause and resume support during live discussions.
- **Off-The-Record Privacy Mode**: One-click toggle that halts transcription and summarization during confidential discussions, sensitive disclosures, or private sidebars.
- **Audio/Video Upload**: Ingest pre-recorded sessions (`.mp3`, `.wav`, `.m4a`, `.webm`, `.mp4`) with automatic speaker diarization.

### 3. Meeting Intelligence & Executive Summaries
- **Executive Recaps**: High-level overview, key discussion points, decisions made, and next steps for any team meeting.
- **Contextual Deal & Project Briefs**: Automatically extracts deal parameters and property metrics when real-estate or transaction templates are used.
- **Multi-Speaker Diarization**: Separates speakers (`Host`, `Guest`, `Speaker 1`, etc.) with interactive timestamp scrubber.
- **92 Multilingual Support**: Registry supporting Filipino / Tagalog (`fil-PH`), Cebuano (`ceb-PH`), Ilocano (`ilo-PH`), English, and 88 additional languages.

### 4. Notes Version History & Rollback
- **Tamper-Resistant Snapshotting**: Create manual and automated snapshots of notes and action items before any major modification.
- **Version Inspection**: Side-by-side review of past versions with timestamps and authors.
- **One-Click Rollback**: Restore any previous note version instantly with an auto-save audit trail.

### 5. Privacy Engine & Cryptographic Audit Trail (`src/privacy`)
- **Automated PII Sanitization**: Detect and mask Philippine mobile numbers (`09xx`, `+63`), landlines, TIN, SSS, PhilHealth, Pag-IBIG IDs, emails, and credit cards.
- **Custom Phrase Redaction**: Mask confidential terms or proprietary project codes across transcripts and summaries with `[REDACTED]`.
- **Tamper-Evident Hash Chain**: Every meeting edit, redaction, and retention purge is cryptographically chained using SHA-256 (`previousHash`, `currentHash`).
- **Retention Policy Engine**: Configurable retention windows (7d, 30d, 90d, 365d, Zero-Day immediate purge, or Indefinite) with background auto-purge and manual purge execution.

### 6. Action Items Hub & Searchable Pipeline
- **Cross-Meeting Action Items**: Centralized tracker with assignee delegation, due dates, priority tags, and status toggles (`todo`, `in_progress`, `completed`).
- **Search & Channel Filters**: Search across titles, transcripts, action items, participants, and tags with channel isolation.
- **Global Ask-AI Assistant**: Natural language queries across all recorded meetings with direct, clickable source meeting references.

### 7. Integrations & Guest Sharing
- **Local-First Guest Sharing**: Export self-contained, standalone offline HTML bundles or copy lightweight guest share links.
- **RFC 5545 Calendar Import**: Parse and import `.ics` files from Google Calendar, Microsoft Outlook, and Apple iCal directly into scheduled meetings.
- **CRM Push (JSON & CSV)**: Export deal attributes formatted for HubSpot and Salesforce ingestion.
- **Outbound Webhook Dispatcher**: Push real-time meeting payloads directly to custom automation endpoints (Zapier, Make, n8n, internal CRM).
- **Notion & Confluence Markdown**: Copy richly formatted Markdown tables and checklist tasks.

- **Google Calendar Sync via Composio (`/api/calendar`)**: Server-side Vercel function that connects to the active Composio `googlecalendar` toolkit to list upcoming events, link calendar events to Tala meetings (title, attendees, time), and schedule follow-up meetings. When `COMPOSIO_API_KEY` is absent, the UI displays `"Calendar sync off"` and local-first `.ics` import continues working seamlessly.

---

## 📅 Google Calendar via Composio (`/api/calendar`)

Tala AI integrates with Google Calendar through a thin Vercel serverless route (`api/calendar.ts`) backed by the Composio `googlecalendar` toolkit:
- **Server-Side Only**: The browser talks exclusively to `/api/calendar`. No API key or secret is ever exposed to the client.
- **Environment Variable**: Set `COMPOSIO_API_KEY` in the Vercel project environment settings.
- **Supported Operations**:
  1. **List Upcoming Events** (`GOOGLECALENDAR_FIND_EVENT`)
  2. **Create Follow-Up Meeting Event** (`GOOGLECALENDAR_CREATE_EVENT`)
  3. **Link Calendar Event to Tala Meeting** (synchronizes event title, attendee roster, and scheduled time)
- **Local-First Fallback**: When `/api/calendar` or `COMPOSIO_API_KEY` is absent, Tala displays `"Calendar sync off"` and RFC 5545 `.ics` file/paste import works offline.

---

## 🔑 "Needs Keys" Live Sync Adapters (Zero-Fake Policy)

In accordance with enterprise security standards and zero-fake policy, live bidirectional cloud synchronization for external CRMs and meeting bots requires registered organization credentials. Tala AI implements clean adapter interfaces, configuration schemas, and tests, and **explicitly marks these adapters as "Needs Keys" in both the UI and documentation**:

| Adapter | Status | Required Credentials | Setup Documentation |
| :--- | :--- | :--- | :--- |
| **HubSpot CRM Live Sync** | `NEEDS_KEYS` | `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_PORTAL_ID` | Create Private App in HubSpot portal with `crm.objects.deals.write` and `crm.objects.contacts.write` scopes. |
| **Salesforce CRM Live Sync** | `NEEDS_KEYS` | `SALESFORCE_CONSUMER_KEY`, `SALESFORCE_CONSUMER_SECRET` | Configure Connected App with OAuth 2.0 web-server flow in Salesforce Setup. |
| **Microsoft Teams / Meet Bot** | `NEEDS_KEYS` | `AZURE_BOT_APP_ID`, `GOOGLE_WORKSPACE_SERVICE_ACCOUNT` | Deploy recall/bot service container and register Microsoft Graph / Google Workspace bot credentials. |

> Tala AI does not emulate or fake successful third-party live authentication when credentials are not supplied.

---

## ☁️ Vercel Deployment

Tala AI is pre-configured for deployment on Vercel (`vercel.json` included):
1. Import `github.com/digitalmerch4862/tala` into Vercel.
2. Framework Preset: **Vite** (`npm run build`, output directory `dist`).
3. Serverless Function Route: `/api/calendar` (`api/calendar.ts`) is automatically deployed by Vercel.
4. Configure the server-side environment variable in Vercel Project Settings:
   - `COMPOSIO_API_KEY` — Composio API key for the account with active `googlecalendar` toolkit.

---

## 🛠️ Verification & Testing

### Running Tests Locally
```bash
# Install dependencies
npm ci

# Run unit tests (80 tests across 13 suites)
npm test

# Build production bundle
npm run build

# Run Playwright E2E test suite (17 comprehensive feature specs)
npm run test:e2e

# Run security & secrets check
npm run check:secrets
```

### Running E2E Specs on PC Docker Container
```bash
docker run --rm -v ~/cp-qa/tala:/work -w /work \
  mcr.microsoft.com/playwright:v1.50.1-noble \
  bash -c 'npm ci && npm run build && npm test && npx playwright test && npm run check:secrets'
```

---

## 📜 License
MIT © 2026 DMerch / Boss Rad (`digitalmerch4862@gmail.com`). All rights reserved.
