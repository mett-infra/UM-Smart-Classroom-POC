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

### Review 1 changes (management)
- **Live operations:** recording controls removed. **Observe** opens a simulated CCTV view of the room (3 cameras, pan, tilt, zoom, snapshot, full screen; faces blurred). Online classes show that there is no room camera.
- **Navigation:** Academic performance and Students and staff removed.
- **Network incidents:** no manual reporting. Unauthorised, malicious or unusual network activity (rogue Wi-Fi, credential attacks, malware traffic, unregistered devices, spoofing, data exfiltration, configuration drift) is detected and recorded automatically. The first event arrives about 20 seconds after the management panel opens, then about once a minute. Presenter shortcut: **Shift + N** records the next event immediately.
- **Campus setup:** Building, master room, sub room hierarchy. Devices are paired to sub rooms with a wizard: device name and pairing number, network check (device and room gateway must be on UM-IoT), pairing progress bar, then either troubleshooting (wrong network or wrong pairing number) or successful registration.
- **Smart rooms:** shows every sub room from Campus setup with its paired devices, an interactive room layout (tap a device to control it), room scenes and per-device controls.
- **Maintenance:** "Report an issue" removed. Ticket numbers open a detailed dialog (what happened, impact, signals, next steps, history).
- **Reports:** "Proposed success measures" removed.
- Saved demo data moved to a new storage key, so every browser starts from the new sample data.

### Day 2: Management (part 2)
- **Door schedules** (`/management/doors`): a simulated campus clock (play, pause, fast-forward) drives door schedules. Teaching rooms open at 08:00 and lock at 17:00 (editable), labs 08:30 to 18:00, auditoriums 07:30 to 22:00. At each boundary the request goes to the controllers and the state shows only once confirmed; offline controllers show as unknown, never as locked. Manual overrides with reason and expiry, holiday exceptions, schedule per door, event log, and a fire alarm test that releases every door in a building.
- **Automation** (`/management/automation`): inactivity rules by room type (after 5, 10, 15 or 30 minutes empty) with the devices each rule switches off. Door, camera, sensor, microphone, network and safety equipment is never switched off. A live simulation shows a room emptying, the countdown, and the automatic switch-off, with a history log.
- **Voice commands**: microphone button in the management top bar and in each Smart room. Works by voice in Chrome and Edge (English or Bahasa Melayu) or by typing. Only approved commands run, the room must be clear, shutting down a room asks for confirmation, and every command is logged.
- Demo tip: on Door schedules click **Watch the 17:00 lock**. On Automation pick a room, click **Everyone leaves** at 60x speed.

### Review 2 changes (Smart rooms)
- **Smart rooms simplified:** the room layout and scenes are replaced by one card per device with a clear **On / Off** switch. Air-con, fans, displays, cameras and microphones are on or off only (no temperature, speed or input settings). Room-wide buttons: **All on**, **All off** (asks first). Lights can still be dimmed by voice, as agreed in the meeting.
- **Door:** **Lock / Unlock** only, plus a **door timer** per room (for example DK1 unlocks at 08:00 and locks at 18:00, Monday to Friday). The timer also appears on Door schedules and runs in its simulation ("Watch the 18:00 lock").

### Day 3: Management (part 3)
- **Attendance** (`/management/attendance`): every room with its live headcount now and capacity alerts at 80% (busy) and 90% (near capacity). Select a room, then pick any day in the last 60 days from the calendar or date picker. Today is live: check-ins up to the demo clock, people still in the room, peak so far. Past days show the sessions held, everyone who attended (name, matric or staff ID, role, programme, faculty, time in and out, how they checked in, on time or late), filters, CSV export, and a person record with their last 60 days in that room. Opening a person record is written to the audit log.
- Sample data covers holidays (Merdeka Day, Malaysia Day), the semester break, orientation week, hall events (career fair, Innovation Day) and Makmal 1 under maintenance.
- Face sign-up for the mock student database is paused until the photos and consent are received.

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
