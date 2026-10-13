# InternshipSearcher ✿

A personal internship radar. It watches job boards, GitHub internship lists and company career pages around the clock, keeps only the postings that fit what I'm looking for, and gives me a small kanban board to track every application.

Right now it's tuned for **Summer 2027 tech internships in Montréal** (4-month terms, open to undergrads), but the term, locations and filters are all editable from the settings panel.

## Features

- **Fresh finds column**: new postings show up live (Server-Sent Events) the moment a scan finds them, sorted by posting date, with desktop and phone notifications.
- **Strict filtering**: location (Montréal and nearby cities), term (Summer 2027, also detected in French: *été 2027*, *mai à août 2027*), length (drops 8, 12 and 16 month terms), level (no PhD/Master's-only or senior roles) and tech relevance.
- **Match score**: upload a CV (PDF, DOCX or TXT) and every posting gets a score with the overlapping skills, missing skills, French requirements and more. It runs entirely on the server, so the CV never leaves the app.
- **Application board**: drag cards between *Will apply*, *Applied*, *Rejected*, *Accepted* and *Ghosted*.
- **Auto-ghosting**: anything sitting in *Applied* for 30 days (configurable) moves to *Ghosted* on its own. Cards in other columns are never touched.
- **Notes and timeline** for each application, plus a manual "Add a job" for things found on Discord or Slack.
- **Private by design**: password login, signed http-only session cookie, `noindex` headers, and everything is stored in one SQLite file.

## Sources

| Source | How | Refresh |
| --- | --- | --- |
| [Simplify / Pitt CSC](https://github.com/SimplifyJobs/Summer2027-Internships) | `listings.json` with ETag caching | 5 min |
| [Vansh & Ouckah](https://github.com/vanshb03/Summer2027-Internships) | `listings.json` | 5 min |
| [SpeedyApply](https://github.com/speedyapply/2027-SWE-College-Jobs) (SWE + AI lists) | README tables | 10 min |
| [Northwestern Fintech](https://github.com/northwesternfintech/2027QuantInternships) | README | 30 min |
| LinkedIn | public guest job search for Montréal | 10 min |
| Greenhouse, Lever, Ashby, SmartRecruiters, Workable | public job board APIs for Montréal employers | 20 min |
| Workday | career site API (CAE, Autodesk, Intact, Desjardins, RBC, Pratt & Whitney…) | 30 min |
| Indeed, Glassdoor, ZipRecruiter… | [JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (optional API key) | 4 h |
| Adzuna | [Adzuna API](https://developer.adzuna.com/) (optional API key) | 1 h |

Company boards live in [`server/src/sources/companies.ts`](server/src/sources/companies.ts). Adding a company is one line.

When a posting comes from a list that only has a title, the full description is fetched from the original page (ATS APIs, JSON-LD, or the page text). The description then feeds the filters and the match score.

## Stack

- **Server**: Node 22, TypeScript, Express 5, better-sqlite3, cheerio, unpdf/mammoth for CV parsing
- **Client**: React 19, Vite, dnd-kit, plain CSS
- **Tests**: Vitest

```
server/src
├── sources/      one module per job source
├── pipeline/     normalize → filter → enrich → ingest, scheduler
├── matching/     CV parsing, skill dictionary, scoring
├── db/           SQLite schema and repositories
├── routes/       REST API + SSE
└── auth/         password login and signed sessions
client/src
├── components/   board, cards, drawer, modals, doodles
├── hooks/        live data (jobs, sources)
└── styles/
```

## Running locally

```bash
cp .env.example .env    # set APP_PASSWORD and SESSION_SECRET
npm install
npm run dev             # API on :3000, app on http://localhost:5173
```

```bash
npm test                # unit + pipeline tests
npm run typecheck
```

## Deploying

The app needs a server that is always on (for the scheduler) and a persistent disk (for SQLite). [Fly.io](https://fly.io) works well, and `fly.toml` already targets the Montréal region:

```bash
fly launch --no-deploy --copy-config
fly volumes create internship_data --region yul --size 1
fly secrets set APP_PASSWORD='something-long' SESSION_SECRET="$(openssl rand -hex 32)"
fly deploy
```

Any Docker host with a volume mounted at `/data` works too (Railway, Render with a disk, a VPS…).

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `APP_PASSWORD` | yes | password for the login screen |
| `SESSION_SECRET` | yes | random string used to sign sessions |
| `DATA_DIR` | | where the SQLite database lives (default `./data`) |
| `LINKEDIN_ENABLED` | | set to `false` to skip LinkedIn |
| `JSEARCH_API_KEY` | | enables the JSearch source (Indeed, Glassdoor, …) |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | | enables the Adzuna source |
| `NTFY_TOPIC` | | push notifications to your phone with [ntfy](https://ntfy.sh). Pick a long random topic name |
| `PUBLIC_URL` | | link opened when tapping a grouped notification |

## Notes

- The match score is a keyword comparison between the CV and the posting, not a prediction. It's useful for deciding what to apply to first.
- LinkedIn's public search is rate limited and scraping it is against LinkedIn's terms of service. It's only used at a low volume here, and it can be turned off.
- Postings are never auto-applied to. The app only finds them.
