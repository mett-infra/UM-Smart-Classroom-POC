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

The build is a static site in `dist/`. For Cloudflare Pages:

- Framework preset: Vite (or none)
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`

The app uses normal URLs such as `/student/courses`. Cloudflare Pages serves `index.html` for unknown paths automatically when the project has no `404.html`, so deep links work without extra config. Follow the team deployment playbook for the final steps.

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
