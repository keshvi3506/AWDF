# TaskFlow AI — AWDF Practicals 8–13

This repository keeps the original TaskFlow AI frontend and integrates the backend, testing, CI, and containerization work for AWDF Practicals 9–13. Existing frontend source files (`frontend/src/App.jsx`, `main.jsx`, and `style.css`) are preserved unchanged.

## Technology
- React 18 + Vite (original interface)
- Node.js + Express
- MongoDB + Mongoose in Docker; JSON-file fallback for local backend-only testing
- `node-cache` (60-second in-memory cache)
- Node.js `EventEmitter` (asynchronous task notifications)
- Docker Compose (frontend, backend, MongoDB)
- GitHub Actions + Vitest + Supertest
- Groq API (backend-only AI integration)

## Project structure

```text
TaskFlow-AWDF-Practicals-8-to-13/
├── .github/workflows/ci.yml
├── backend/
│   ├── data/tasks.json
│   ├── tests/api.test.js
│   ├── events.js
│   ├── listeners.js
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Original frontend source preserved
├── docker-compose.yml
├── .env.example
└── README.md
```

## Practical 8 — React performance / lazy loading

The provided TaskFlow frontend is currently a single-page React component, not a multi-route app with separate Projects and Contact pages. To respect the instruction to keep the frontend unchanged, no route or component changes have been made. Do not claim React.lazy/Suspense route-based lazy loading is completed yet. The required before/after bundle and Network-tab measurements must be captured in the browser. If the instructor requires the exact React.lazy/Suspense demonstration, approval is needed for a minimal frontend entry-point or route-component change; the existing UI can remain visually identical.

## Practical 9 — In-memory caching

- `node-cache` stores `GET /api/tasks` for 60 seconds.
- First request returns `X-Cache: MISS`; subsequent requests normally return `X-Cache: HIT` until expiry or invalidation.
- `POST`, `PATCH`, and `DELETE` invalidate the task-list cache. Updates/deletes also invalidate the affected individual-task cache.
- `GET /api/tasks/:id` caches an individual task.
- `GET /api/debug/cache` returns hit/miss counters, cache keys, and TTL.
- The backend logs request duration in milliseconds.

Evidence: call `GET http://localhost:5000/api/tasks` at least three times, record the response times and `X-Cache` values, modify a task, and verify the next list request is a MISS. Record at least three cache-hit and three cache-miss timings; do not invent measurements.

## Practical 10 — Event-driven asynchronous processing

- `events.js` defines a shared EventEmitter.
- `listeners.js` registers `task-created`, `task-deleted`, and `task-created-error` listeners.
- After a task is saved, the API returns `201` and emits `task-created`; the listener logs task details and a completion message after a two-second demonstration delay.
- Deleting a task emits `task-deleted`.

Evidence: keep the backend terminal visible, create a task, note the API response time, and capture the notification and delayed completion timestamps. Then delete a task and capture its notification.

## Practical 11 — Docker and Docker Compose

The Compose file runs three services on a bridge network:
- `frontend`: multi-stage React build served by Nginx at port `5173`.
- `backend`: Express API at port `5000`.
- `mongodb`: MongoDB at internal port `27017`, with persistent named volume `mongodb_data`.

The backend connects to `mongodb://mongodb:27017/taskdb` inside Compose. The hostname is the service name; `localhost` would refer to the backend container itself.

Run from the repository root:

```powershell
Copy-Item .env.example .env
# Optional: edit .env and set your GROQ_API_KEY

docker compose up --build
```

Open `http://localhost:5173`. Check services with `docker compose ps`. Stop with `docker compose down`. To also delete saved MongoDB data, use `docker compose down -v`.

## Practical 12 — GitHub Actions CI

`.github/workflows/ci.yml` runs on pushes to `main`, installs backend dependencies, and runs automated Vitest/Supertest API tests. The workflow uses the backend working directory. After pushing, open the repository's **Actions** tab to inspect the run.

Local test commands:

```powershell
cd backend
npm install
npm test
```

For the practical journal, deliberately break one assertion and push to show a failed run, then restore it and push to show a passed run. Capture both screenshots. The repository README can display the workflow badge once the repository owner/name is known.

## Practical 13 — Groq AI integration

- Existing frontend AI interaction is preserved.
- `POST /api/ai/generate-description` calls Groq from the backend.
- Keep `GROQ_API_KEY` private in `backend/.env` for local use, or root `.env` for Docker Compose. Never place the key in React source or commit either `.env` file.
- `GET /api/ai/status` reports whether the key is configured.
- The backend applies a one-request-per-task-key-per-minute limit and a 20-second timeout. If AI is unavailable, a standard fallback description is returned so task creation can continue.
- Generated text is a suggestion; review it before saving. Do not submit confidential or personal data to an external AI service.

## Run locally without Docker

Terminal 1 — backend:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Leave `MONGO_URI` blank for JSON-file mode, or set it to your local MongoDB URI.

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Notes and limitations

- The original frontend source files have intentionally not been modified.
- Practical 8's exact route-based `React.lazy()`/`Suspense` requirement is not represented by the current single-component frontend. This is documented rather than falsely claiming completion.
- Cache is in-memory and resets when the backend restarts; it is suitable for the lab, not shared multi-instance production use.
- EventEmitter is in-process and not a durable message queue.
- Practical 12 requires real GitHub Actions failed and passed run screenshots after you push this repository; these cannot be generated locally.
