# The Nexus — CRM Analytics Dashboard

A client-side analytics dashboard for a real-estate CRM (The Cascades). You upload a
**Sell.do lead export** (Excel/CSV) and the app parses it *in the browser* and renders
KPIs, charts, a lead funnel, a sales-rep leaderboard, and management-ready reports with
AI-generated insights.

- **No app backend for the analytics** — parsing and all dashboards run entirely in the
  browser. The only server-side piece is a single serverless function that calls Gemini
  for the AI report text.
- **Theme:** navy `#214268` · cream `#ebe2d6` · gold `#b38f60`.

---

## Tech stack

| Concern            | Tool |
|--------------------|------|
| Markup / styling   | Plain HTML + CSS (no framework, **no build step**) |
| Logic              | Vanilla JavaScript |
| Spreadsheet parse  | [SheetJS / xlsx](https://sheetjs.com) (via CDN) |
| Charts             | [Chart.js](https://www.chartjs.org) (via CDN) |
| PDF export         | [html2canvas](https://html2canvas.hertzen.com) + [jsPDF](https://github.com/parallax/jsPDF) (via CDN) |
| AI insights        | [Netlify Function](netlify/functions/generate-insight.js) → Google **Gemini** |
| Hosting            | Netlify (static site + serverless function) |

There is **no build/bundler**. Edit a file, refresh the browser. That's the whole loop.

---

## Project structure

```
The-Nexus/
├── Front-End/                 # the entire static site (Netlify publish dir)
│   ├── index.html             # LOGIN page (served at "/", shows first)
│   ├── login.js               # login form logic (demo auth: admin / 1234)
│   ├── l-styles.css           # login page styles
│   │
│   ├── dashboard.html         # MAIN dashboard: upload + overview
│   ├── script.js              #   → upload/parse + dashboard analytics (writes crmData)
│   ├── styles.css             #   → dashboard styles
│   │
│   ├── leads.html + leads.js + leads.css        # Leads analytics
│   ├── sales.html + sales.js + sales.css        # Sales-team analytics
│   ├── campaigns.html + campaigns.js + campaigns.css   # Campaign analytics
│   ├── reports.html + reports.js + reports.css  # Report builder + AI insights + PDF
│   │
│   ├── settings.js            # SHARED: injects the Settings overlay + the SVG icon set
│   ├── settings.css           #   → overlay styles + dark-mode theme
│   └── favicon.png
│
├── netlify/functions/
│   └── generate-insight.js    # serverless Gemini backend (replaces the old Flask app)
│
├── netlify.toml               # Netlify config (publish dir + functions dir)
├── .gitignore                 # ignores .env, uploaded data files, node/netlify artifacts
└── backend/                   # LEGACY Flask server (superseded — see "Legacy" below)
```

---

## How it works — data flow

The pages talk to each other through **`sessionStorage`**, not a database:

```
 index.html (login)
      │  admin / 1234  →  redirect
      ▼
 dashboard.html ──(script.js)──►  parse upload with SheetJS
      │                           store parsed rows in  sessionStorage.crmData
      ▼
 leads.html / sales.html / campaigns.html
      │  each reads sessionStorage.crmData, computes its own KPIs/charts,
      │  AND writes a summary slice into  sessionStorage.reportAnalytics
      ▼
 reports.html ──(reports.js)──►  reads ONLY reportAnalytics (never the raw rows)
      │  selected metrics → POST /.netlify/functions/generate-insight
      │  Gemini returns JSON → rendered report → "Download PDF"
```

**`sessionStorage.crmData`** — the full array of parsed lead rows (objects keyed by the
Sell.do column names, e.g. `"Lead Stage"`, `"Lead Hotness"`, `"Attended By"`).

**`sessionStorage.reportAnalytics`** — a small summary the Reports page consumes. Each
analytics page writes its own slice:

```js
reportAnalytics.leads      = { total, hotLeads, qualified, conversions, conversionRate }
reportAnalytics.sales      = { representatives, totalCalls }
reportAnalytics.campaigns  = { topCampaign, totalCampaigns }
```

---

## Running locally

It's a static site, so any static file server works:

```bash
python3 -m http.server 8000 --directory Front-End
```

Then open <http://localhost:8000>. Log in with **`admin` / `1234`** and upload an
Excel/CSV export on the Dashboard.

**AI insights locally:** the report's AI text comes from the Netlify function, which does
not exist under a plain static server — you'll see an *"AI service temporarily
unavailable"* fallback (everything else works). To exercise the real Gemini call locally,
install the Netlify CLI and run `netlify dev` with a `GEMINI_API_KEY` in a local `.env`
(never commit it).

---

## AI backend (Gemini)

[`netlify/functions/generate-insight.js`](netlify/functions/generate-insight.js)

- **Request:** `POST { metrics: [{ name, value }] }`
- **Response:** `{ insight: "<JSON string>" }` where the JSON is
  `{ executive_summary, important_findings[], recommended_actions[] }`.
  It uses Gemini's `responseSchema` to *force* valid JSON — this is what the Reports page
  `JSON.parse`s.
- **Env vars:**
  - `GEMINI_API_KEY` *(required)* — set in the Netlify dashboard, **never committed**.
  - `GEMINI_MODEL` *(optional)* — defaults to `gemini-2.5-flash`.

---

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **New site from Git** → pick the repo. `netlify.toml` already sets
   `publish = "Front-End"` and `functions = "netlify/functions"`.
3. **Site settings → Environment variables** → add `GEMINI_API_KEY`.
4. Deploy. The login page is served at `/`.

---

## Contributing — where to change things

| I want to…                        | Edit |
|-----------------------------------|------|
| Add/rename a **metric in Reports** | `reports.html` (checkbox) + `reports.js` `getMetricValue()` + the writing page's `reportAnalytics` slice |
| Add a **sidebar nav item**         | the `<nav>` in each page **and** add an icon in `settings.js` → `LABEL_ICONS` |
| Change a **theme colour**          | the `:root` variables (⚠️ duplicated — see Gotchas) |
| Change **Settings** options        | `settings.js` (overlay markup + handlers) + `settings.css` |
| Change the **AI prompt / model**   | `netlify/functions/generate-insight.js` |

### ⚠️ Gotchas (read before editing)

- **CSS base styles are duplicated.** The shared layout (sidebar, header, KPI cards,
  tables) is copied into `styles.css`, `leads.css`, `campaigns.css`, and `sales.css`.
  A change to shared layout must be applied to **each** copy. (Consolidating these into
  one `base.css` is a good future refactor — see below.)
- **Reports depends on page-visit order.** `reportAnalytics` is only populated as you
  visit Leads / Sales / Campaigns. Going straight from upload → Reports leaves the
  unvisited sections showing `N/A`.
- **Sidebar icons are injected by `settings.js`** (one source of truth). The nav `<span>`
  glyphs in the HTML are placeholders that get replaced with SVGs on load.
- **Settings is an overlay, not a page.** `settings.js` intercepts clicks on any
  `a[href="settings.html"]`; there is intentionally no `settings.html` file.
- **Preferences** (display name, dark mode, reduce-motion, notifications) live in
  `localStorage` under the `nexus.*` keys.
- **Demo auth is client-side only** (`admin` / `1234` in `login.js`). It is not real
  security — replace before any real use.

---

## Known good future refactors (not yet done)

These are safe-to-do-later improvements that were intentionally deferred to avoid
regressions without a test suite:

1. **Extract a shared `base.css`** from the duplicated sidebar/header/card styles.
2. **Extract shared JS helpers** (`showNotification`, `isConvertedLead`,
   `isQualifiedLead`, `isHotLead`, `getCampaignName`) into one `shared.js` instead of
   re-declaring them per page.
3. Vectorize the remaining emoji KPI-card icons to match the SVG nav icons.

---

## Legacy

`backend/` contains the original **Flask** server (`app.py`) that called Gemini locally.
It has been **superseded by the Netlify function** and is not deployed. It's kept for
reference only; you can delete it once the Netlify deploy is confirmed.
