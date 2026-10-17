# Tala AI — Intelligent Meeting Notetaker & Action Hub

> **Executive AI Meeting Notetaker, Prep & Privacy Hub for Real Estate & Enterprise**  
> Custom-built for **Boss Rad**, Business Development Manager in Real Estate (PH).  
> Original IP-safe work-alike engineered under D-org (`digitalmerch4862`).

---

## 🌟 Overview

**Tala AI** ("Tala" is Tagalog for *record, note, or star*) is an executive-grade, privacy-first meeting notetaker designed for high-stakes face-to-face and virtual business negotiations.

Engineered specifically around Philippine real estate workflows (pre-selling developments, BGC/Makati luxury condos, CALAX commercial lots, broker commissions, bank vs Pag-IBIG financing, and reservation agreements), Tala AI provides live audio recording, audio file ingestion, multi-speaker diarization across 92 languages, collaborative meeting agendas with timeboxes, pre-meeting briefs, notes version history, cryptographic privacy auditing, cross-meeting action item tracking, and interactive global Q&A.

---

## 🚀 Complete Feature Architecture

### 1. Collaborative Prep & Agenda Management (`src/prep`)
- **Turnkey Real Estate & Business Templates**: Pre-configured templates for Client Property Discovery, Site Viewing / Tripping, Developer Alignment, Financing & Mortgage, and Closing Follow-Up.
- **Timebox Management**: Calculate total planned duration, track allocated minutes per topic, and visualize pacing.
- **Topic Reordering & Talking Points**: Reorder agenda topics with live up/down actions, add interactive talking points, and monitor coverage.
- **Pre-Meeting AI Brief**: One-click synthesis of past deal history, participant context, strategic talking points, and objection risk factors.
- **Carry-Over Engine**: Automatically transfer unfinished agenda topics, pending commitments, and open questions into structured follow-up meetings.

### 2. In-Browser Recording & Media Ingestion
- **Face-to-Face Meeting Capture**: In-browser audio recording via Web Audio and `MediaRecorder` API with live waveform meter.
- **Pause & Resume Controls**: Full pause and resume support during live discussions.
- **Off-The-Record Privacy Mode**: One-click toggle that halts transcription and summarization during confidential pricing, commission splits, or sensitive disclosures.
- **Audio/Video Upload**: Ingest pre-recorded sessions (`.mp3`, `.wav`, `.m4a`, `.webm`, `.mp4`) with automatic speaker diarization.

### 3. Real Estate Intelligence & Executive Summaries
- **Executive Recaps**: High-level overview, key discussion points, decisions made, and next steps.
- **Real Estate Deal Brief**: Automatically extracts property type, location, budget envelope (TCP), and financing scheme.
- **Multi-Speaker Diarization**: Separates speakers (`Rad (BDM)`, `Buyer / Client`, `Broker Partner`) with interactive timestamp scrubber.
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

---

## 🔑 "Needs Keys" Live Sync Adapters (Zero-Fake Policy)

In accordance with enterprise security standards and zero-fake policy, live bidirectional cloud synchronization requires registered organization credentials. Tala AI implements clean adapter interfaces, configuration schemas, and tests, but **explicitly marks live third-party sync adapters as "Needs Keys" in both the UI and documentation**:

| Adapter | Status | Required Credentials | Setup Documentation |
| :--- | :--- | :--- | :--- |
| **Google Calendar OAuth** | `NEEDS_KEYS` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Configure OAuth 2.0 Client ID with `calendar.events.readonly` scope in Google Cloud Console. |
| **HubSpot CRM Live Sync** | `NEEDS_KEYS` | `HUBSPOT_ACCESS_TOKEN` (Private App Token) | Create Private App in HubSpot portal with `crm.objects.deals.write` and `crm.objects.contacts.write` scopes. |
| **Salesforce CRM Live Sync** | `NEEDS_KEYS` | `SALESFORCE_CLIENT_ID`, `SALESFORCE_INSTANCE_URL`, `SALESFORCE_SECRET` | Configure Connected App with OAuth 2.0 web-server flow in Salesforce Setup. |
| **Microsoft Teams / Meet Bot** | `NEEDS_KEYS` | `TEAMS_APP_ID`, `TEAMS_BOT_PASSWORD`, `MEET_BOT_SERVICE_URL` | Deploy recall/bot service container and register Microsoft Graph bot credentials. |

> Tala AI does not emulate or fake successful third-party live authentication when credentials are not supplied.

---

## 🛠️ Verification & Testing

### Running Tests Locally
```bash
# Install dependencies
npm ci

# Run unit tests (73 tests across 12 suites)
npm test

# Build production bundle
npm run build

# Run Playwright E2E test suite (16 comprehensive feature specs)
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
