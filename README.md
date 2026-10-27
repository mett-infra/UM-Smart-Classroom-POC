# UM Smart Classroom (proof of concept)

A clickable, frontend-only proof of concept of a virtual classroom and campus management platform, prepared by METGABB for Universiti Malaya.

It shows three connected portals in one site:

| Portal | Persona (fictional) | What you can show |
| --- | --- | --- |
| Student | Aina Sofea binti Rahman, BCS Year 2 | Home dashboard, join a live hybrid class, course content by week, assignment submission, timetable, recordings with captions, grades, AI study assistant, announcements |
| Lecturer | Dr. Farid Hakimi bin Zulkifli | Teaching home, host the live class (slides, whiteboard, polls, Q&A, breakout rooms, recording, screen share), course content, attendance with check-in code, gradebook, class insights, AI teaching assistant |
| Management | Prof. Dr. Lim Mei Ling | University overview, live operations, academic performance by faculty, students and staff, smart rooms and automation, maintenance tickets, reports |

Switch between portals at any time with the Student / Lecturer / Management switch in the top bar.

## Important: frontend only

- There is **no backend, no database and no API**. Everything runs in the browser.
- All names, courses, numbers and charts are **fictional sample data** in `src/data/mock.ts`.
- Actions (submitting work, marking, posting announcements, room controls, tickets) are saved in the browser's local storage so a demo survives a refresh. Use **Reset demo data** in the sidebar to start the story again.
- Camera and screen sharing in the live class use the presenter's own device and never leave the browser.
- CSV and calendar downloads are generated in the browser.
- The AI assistants are scripted and clearly labelled as simulated.

## Smart campus build (week of 26 October 2026)

Built from the meeting with the Deputy Dean and the functional specification (v1.0). Everything stays frontend only: integrations are simulated so the screens behave as if the backend already exists.

### Day 1: Management (part 1)
- **Network incidents** (`/management/network`): live alerts when a Faculty of Engineering managed device reaches a restricted site or app, on campus Wi-Fi, eduroam, lab LAN or another network (via the endpoint agent). A banner appears on every management page. Lifecycle: New, Acknowledged, Investigating, On hold, Resolved, False positive, with owner, notes and history. Also internet usage by hour, category and building, data-source freshness, and restricted policies.
- **Campus setup** (`/management/campus`): campus, building, floor and room tree; room master editor with validation and setup checks; device registry; CSV import with row-by-row validation.
- **Audit log** (`/management/audit`): who changed what and when, with export.
- Demo tip: on Network incidents, press **Simulate network event** to raise an incident on the spot. The live feed also raises one about every minute.

## Suggested demo path (about 10 minutes)

1. Open the landing page and explain the three roles.
2. **Student**: home, then **Join class**. Show chat, captions (switch EN/BM), raise hand, reactions. Wait about 15 seconds for the lecturer's poll and vote.
3. **Student**: My courses, WIA2004, week 7 content. Assignments, open Assignment 2, attach a file, submit.
4. **Student**: AI study assistant, ask for flashcards.
5. **Lecturer**: home, open live class. Switch to whiteboard and draw, start recording, launch a poll, open breakout rooms, end class and publish the recording.
6. **Lecturer**: attendance with the check-in code, gradebook (enter marks, release), AI teaching assistant (generate a quiz).
7. **Management**: overview, live operations, academic performance, smart rooms (turn equipment on and off), maintenance (report and resolve a ticket), reports (generate and download).

## Run locally

Requires Node.js 20 or newer (22 recommended, see `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:5173
```

Production build:

```bash
npm run build     # output in dist/
npm run preview   # serve the built site locally
```

## Deploying

### GitHub Pages (current)

Deployment is automatic. `.github/workflows/deploy-pages.yml` builds the site and publishes it on every push to `main`.

- One-time setup: repo **Settings > Pages > Build and deployment > Source: GitHub Actions**.
- Site address: `https://<owner>.github.io/<repo-name>/`, for example `https://mett-infra.github.io/UM-Smart-Classroom-POC/`.
- The workflow builds with `--base=/<repo-name>/` so all files load from the sub-folder, and copies `index.html` to `404.html` so deep links such as `/student/courses` work after a refresh.
- Watch progress in the **Actions** tab. A green tick means the site is live.

### Any other static host (Cloudflare Pages, Netlify)

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION=22`

These hosts serve `index.html` for unknown paths, so no extra config is needed.

`public/robots.txt` and a `noindex` meta tag keep the demo out of search engines.

## Project structure

```
src/
  App.tsx                 routes for all three portals
  main.tsx                app entry
  components/             shell (sidebar, top bar, role switch), UI kit, chart styles
  data/                   types and all sample data (mock.ts)
  store/DemoStore.tsx     in-browser demo state, toasts, activity log
  pages/
    Landing.tsx           role picker
    shared/               live classroom, timetable, announcements
    student/              student portal
    lecturer/             lecturer portal
    management/           management portal
  styles/                 design tokens, base, components and page styles
```

## Tech

React 19, TypeScript, Vite, React Router, Recharts, Lucide icons, Plus Jakarta Sans (bundled locally, no external font requests).

## Not part of this POC

Real sign-in, integration with SPeCTRUM, the student information system, conferencing platforms, room controllers or AI services. These would be scoped during discovery.
