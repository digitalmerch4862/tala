# Tala AI — Intelligent Meeting Notetaker & Action Hub

> **Executive AI Meeting Notetaker & Action Tracker for Real Estate & Enterprise**  
> Custom-built for **Boss Rad**, Business Development Manager in Real Estate (PH).  
> Original IP-safe work-alike engineered under D-org (`digitalmerch4862`).

---

## 🌟 Overview

**Tala AI** ("Tala" is Tagalog for *record, note, or star*) is an executive-grade, privacy-first meeting notetaker designed for high-stakes face-to-face and virtual business negotiations.

Engineered specifically around Philippine real estate workflows (pre-selling developments, BGC/Makati luxury condos, CALAX commercial lots, broker commissions, bank vs Pag-IBIG financing, and reservation agreements), Tala AI provides live audio recording, audio file ingestion, multi-speaker diarization across 92 languages, structured executive briefs, cross-meeting action item tracking, and interactive Q&A.

---

## 🚀 Phase 1 Feature Set

### 1. In-Browser Face-to-Face Meeting Capture
- **Microphone Recording**: Direct in-browser audio capture via Web Audio & `MediaRecorder` API with live volume metering and waveform feedback.
- **Off-the-Record Privacy Toggle**: Instantly pauses audio recording and transcription during sensitive price negotiations or confidential disclosures.
- **Audio/Video Upload**: Drag & drop ingestion for Zoom/Meet recordings, voice memos, and video calls (`.mp3`, `.wav`, `.m4a`, `.webm`, `.mp4`).

### 2. Multi-Speaker Diarization & 92 Languages
- **Speaker Turns**: Distinguishes speakers (e.g. `Rad (BDM)`, `Buyer / Client`, `Broker Partner`).
- **Interactive Scrubber**: Click any timestamp in the transcript to instantly jump the audio playback to that exact second.
- **92 Languages**: Comprehensive multilingual registry including Filipino / Tagalog (`fil-PH`), Cebuano / Bisaya (`ceb-PH`), Ilocano (`ilo-PH`), English (US/UK/AU), Spanish, Mandarin, Japanese, and 85+ global languages.

### 3. Real Estate & Executive Template Catalog
Includes 7 turnkey meeting structures with customized extraction instructions:
1. **Client Property Discovery** — Buyer investment vs end-use intent, target CBD location, unit layout (Studio/1BR/2BR), TCP budget envelope, and equity amortization schedule.
2. **Site Viewing & Tripping Notes** — On-site unit inspection, natural light/views, developer turnover finishes, dues estimate, and hold requests.
3. **Developer & Broker Alignment** — Commission tiers (e.g., 4.5%), inventory blocks, advance release terms, and quota incentive trips.
4. **Financing & Mortgage Brief** — Commercial bank loans vs Pag-IBIG Fund, downpayment equity terms, ITR/COE documentation checklist.
5. **Closing & Reservation Follow-up** — Unit reservation agreements (RA), earnest money, Buyer Information Sheets (BIS), and CTS timelines.
6. **Executive 1-on-1 & Strategic Review** — OKR tracking, pipeline health, roadblock triage, and management decisions.
7. **General Meeting & Team Sync** — Collaborative agendas, open discussions, and assigned accountability.

### 4. Meeting Intelligence & Searchable Library
- **Executive Summaries**: High-level overview, key discussion points, decisions made, and next steps.
- **Real Estate Deal Parameters**: Automatically extracts property type, location, budget envelope, and financing scheme into dedicated executive cards.
- **Action Items Hub**: Cross-meeting task manager with assignee delegation, due dates, priority tags (High/Medium/Low), and one-click status toggles.
- **Searchable Meeting Library**: Client-side full-text search indexing titles, transcripts, action items, participants, tags, and deal metrics with channel filters.
- **Ask AI Assistant**: Context-aware chat over meeting transcripts to query details ("What was the agreed budget?", "List all buyer objections").
- **Exporting**: One-click Markdown copy, JSON export, and `.MD` file downloads.

---

## 🔒 Privacy & Architecture

- **Zero-Training Pledge**: Meeting recordings, transcripts, and financial terms remain local in browser `IndexedDB`. No proprietary real estate negotiations are used to train public models.
- **LLM Fleet Subscription**: Powered by the internal agy fleet subscription pool (no paid API key required).
- **Transcription Capability Matrix & Gap Disclosure**:
  - Live face-to-face recording runs in real-time through the browser Web Speech API (zero API cost).
  - Pre-recorded file batches run through the local diarization adapter and fleet whisper pipeline, completely avoiding paid third-party cloud transcription subscriptions.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/digitalmerch4862/tala.git
cd tala

# Install dependencies
npm ci

# Start development server
npm run dev

# Run unit test suite
npm test

# Build for production
npm run build

# Run Playwright E2E tests
npm run test:e2e

# Check for secrets
npm run check:secrets
```

---

## 📜 License
MIT © 2026 DMerch / Boss Rad. All rights reserved.
