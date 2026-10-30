# DARKSPOT — Decision Completeness Intelligence Platform
### *Know what's missing before you decide.*

[![Shinchan Online Hackathon 2026](https://img.shields.io/badge/Hackathon-Shinchan%202026-black.svg)](https://darkspot.intelligence)
[![Architecture](https://img.shields.io/badge/Architecture-Full--Stack%20Vite%20%2B%20Express%20%2B%20Gemini%203.8-slate.svg)]()
[![Frontend](https://img.shields.io/badge/UI-Tailwind%20%2B%20React%20Flow-emerald.svg)]()

---

## 1. Project Overview & The Core Problem

Most current AI research assistants and enterprise dashboards commit a fundamental epistemic error: **they summarize only what they find**. 

When a user asks:
> *"Should I apply for this scholarship?"*  
> *"Should our engineering team migrate our PostgreSQL database to Cloudflare D1?"*  
> *"Should our founding team sign this Series A term sheet?"*

Standard LLMs retrieve documents and produce a cheerful synthesis of available bullet points. They fail to detect:
1. **Critical Blind Spots**: Mandatory statutory conditions that were never mentioned.
2. **Direct Contradictions**: When one document says a test is mandatory and another says it was eliminated.
3. **Date Discrepancies**: A 15-day difference in application cutoff timestamps between two official PDFs.
4. **Outdated Policies**: When a quoted stipend or pricing tier is from a superseded cycle.

**DARKSPOT** pioneers **Decision Completeness Intelligence**. Rather than rushing to summarize, DARKSPOT first deconstructs the decision into necessary, falsifiable requirements. It then measures evidence coverage, flags direct contradictions with side-by-side claim comparison, categorizes evidence gaps, and produces a prioritized verification plan before any commitment is made.

---

## 2. Core Epistemic Pipeline

```
  ┌─────────────────────────────────────────────────────────────────┐
  │ 1. Decision Decomposition                                       │
  │    Converts ambiguous questions into falsifiable requirements.   │
  └───────────────────────────────┬─────────────────────────────────┘
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 2. Traceable Claim Extraction                                   │
  │    Pulls discrete claims strictly tied to verbatim quotations.  │
  └───────────────────────────────┬─────────────────────────────────┘
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 3. Contradiction & Date Discrepancy Detection                   │
  │    Normalizes context & cross-examines claims across sources.   │
  └───────────────────────────────┬─────────────────────────────────┘
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 4. Information Gap Classification                               │
  │    Categorizes each requirement: Supported, Conflicting,        │
  │    Outdated, Partial, Insufficient, or Not Found.              │
  └───────────────────────────────┬─────────────────────────────────┘
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 5. Prioritized Verification Action Planner                      │
  │    Assigns designated authorities (registrars, counsel, APIs).   │
  └───────────────────────────────┬─────────────────────────────────┘
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 6. Defensible Decision Readiness Assessment                     │
  │    Calculates mathematical evidence completeness & risk verdict. │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Features

- **Decision Readiness Assessment & Formula**: Calculates weighted completeness percentage: Critical ($4\times$), High ($3\times$), Medium ($2\times$), Low ($1\times$). If any Critical requirement has active contradictions or is missing, the status is immediately flagged as **`DECISION NOT READY`**.
- **Cross-Source Contradiction Radar**: Side-by-side comparison of incompatible claims (e.g. October 31 vs. November 15 deadline), detailing decision risk and recommended resolution steps.
- **Traceable Claim Inspector**: Click any claim to inspect the exact verbatim quotation from the source document, publication date, domain, and authority score.
- **Interactive Evidence Topology Graph**: Built with `@xyflow/react` (React Flow), allowing users to trace relationships from Decision $\to$ Requirements $\to$ Claims $\to$ Sources $\to$ Conflicts $\to$ Actions.
- **Actionable Verification Planner**: Check off verified items in real-time, inspect which authority to consult, and export the verification plan as Markdown for stakeholders.
- **SSRF & Security Defense**: Safe URL ingestion protecting internal subnets, localhost, and cloud metadata services.
- **Persistent Storage**: All investigations are persisted to `data/investigations.json` so page refreshes never erase work.
- **Pre-Calibrated Hackathon Scenarios**: Pre-loaded real-world case studies demonstrating deadline conflicts, GRE testing policy changes, and enterprise database PITR blindspots.

---

## 4. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, `@xyflow/react` (React Flow) |
| **Backend** | Express 4, Node.js (ESNext), `tsx`, Persistent File Store (`data/investigations.json`) |
| **AI Layer** | Google GenAI SDK (`@google/genai`), `gemini-3.8-flash` with structured JSON validation |
| **Design** | Premium White SaaS (`#FFFFFF`, `#FAFAF9`, `#EAEAEA`), Zero-Pill discipline, Tabular figures |

---

## 5. Getting Started & Local Setup

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd darkspot

# Install dependencies
npm install
```

### Environment Variables
Configure your environment in `.env`:
```bash
# GEMINI_API_KEY: Injected by AI Studio automatically or provided manually
GEMINI_API_KEY="your-gemini-api-key"

# Port defaults to 3000
PORT=3000
```

### Running Locally
```bash
# Start full-stack development server (Express + Vite on http://localhost:3000)
npm run dev

# Run TypeScript lint check
npm run lint

# Build production bundle
npm run build
```

---

## 6. Demonstration Guide (Judging Workflow)

To experience the full power of DARKSPOT in under 3 minutes:

1. **Launch Scenario 1 (STEM Fellowship)**:
   - Select *"Should I apply for the Global Excellence STEM Fellowship?"* from the top navigation dropdown.
   - Observe the **`DECISION NOT READY`** banner with **48% Evidence Completeness**.
2. **Inspect the Active Contradiction**:
   - Click the **Information Gaps** tab $\to$ **Contradictions & Conflicts**.
   - Notice the side-by-side comparison:
     - **2025 Handbook**: GRE $\ge 165$ mandatory, deadline Oct 31, 17:00 UTC.
     - **2026 Announcement**: GRE eliminated, deadline extended to Nov 15, 23:59 EST.
   - Read the **Decision Impact Analysis**: Submitting after Oct 31 risks portal lockout if the server cron job has not been updated!
3. **Inspect the Missing Blind Spot**:
   - Switch to the **Missing Evidence** tab.
   - Notice that while the FAQ mentions "household income must not exceed statutory thresholds", no document specifies the numeric dollar limit!
4. **Examine the Verification Plan**:
   - Go to the **Verification Plan** tab.
   - Click the checkbox to toggle an item as verified $\to$ updates persisted across reloads.
   - Click **Export Plan Markdown** to copy the formatted dossier.
5. **Explore the Relationship Graph**:
   - Click the **Relationship Graph** tab to navigate the topological graph of decisions, requirements, claims, sources, and action items with React Flow.
6. **Launch a Custom Investigation**:
   - Click **+ New Investigation**, enter your own decision question, paste source URLs or notes, and watch the pipeline execute in real-time.

---

## 7. Known Limitations & Future Roadmap

- **Autonomous Web Browsing**: Currently ingests user-provided URLs and documents with SSRF validation; future versions will integrate automated iterative web search loops.
- **Multi-Party Consensus**: Future releases will support collaborative multi-stakeholder annotations for board committees and investment teams.

---

*DARKSPOT — Know what's missing before you decide.*
