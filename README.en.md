<p align="center">
  <img src="code-diary-frontend/public/favicon.svg" width="88" alt="commit.log logo" />
</p>

<h1 align="center">commit.log</h1>

<p align="center"><i>// one commit a day — an AI-powered journal for developers</i></p>

<p align="center"><a href="README.md">Türkçe</a> · <b>English</b></p>

<p align="center">
  <a href="https://github.com/simsekbeyda/commit-log/actions/workflows/ci.yml"><img src="https://github.com/simsekbeyda/commit-log/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Java-21-orange" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F" alt="Spring Boot 3.5" />
  <img src="https://img.shields.io/badge/Spring%20AI-1.1-6DB33F" alt="Spring AI 1.1" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19" />
</p>

An **AI-powered journaling app for software developers**. Write down what you learned and where you got stuck; the app summarizes each entry, reads your mood, extracts keywords, suggests how to improve, answers your questions and prepares a weekly retrospective. A GitHub-style activity heatmap and streak counter keep you writing every day.

<p align="center">
  <img src="docs/screenshots/list-light.png" alt="Journal list with activity heatmap and tags" width="820" />
</p>

<table>
  <tr>
    <td><img src="docs/screenshots/detail-dark.png" alt="Entry detail with the AI assistant (dark theme)" /></td>
    <td><img src="docs/screenshots/weekly-report.png" alt="Weekly AI report" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/login.png" alt="Sign-in and demo account" /></td>
    <td align="center"><img src="docs/screenshots/mobile.png" alt="Mobile view" width="260" /></td>
  </tr>
</table>

> The screenshots show the Turkish UI; the app also ships a full English interface (TR/EN toggle in the header).

## Try it

The **"Try the demo account"** button on the sign-in screen creates your own guest account pre-filled with sample entries, with no sign-up needed. No OpenAI key is required either: without one, the AI features run on the built-in **demo mode**.

```bash
docker compose up --build      # http://localhost:3000
```

## Features

**Journal**
- Create, edit and soft-delete entries; search titles and content with server-side pagination
- **Tags** such as `#spring` or `#react`, filtering by tag, tag suggestions
- **Activity heatmap** (past year) and **streak counter** (🔥 current / longest streak)

**AI assistant** (Spring AI + OpenAI)
- Summary, sentiment, keywords, improvement tips and Q&A about an entry
- **Weekly report**: what you learned, where you struggled and what to focus on next week
- Turn AI keywords into tags with one click
- All prompts in one place ([AiPrompts.java](code-diary/src/main/java/com/codediary/services/AiPrompts.java)): system/user separation, **prompt injection** protection with `<journal>` delimiters, **structured JSON output** for sentiment and keywords
- Results are cached with **Caffeine** and invalidate automatically when an entry is edited, so the same analysis is never paid for twice
- **Demo mode**: without a key, a rule-based engine (Turkish suffix handling, a tech-term dictionary) answers the same endpoints

**Security and infrastructure**
- **Spring Security + JWT** (OAuth2 Resource Server, HS256) and BCrypt; every user sees only their own entries
- Turkish/English UI and API messages (`Accept-Language`), light/dark theme, responsive layout
- H2 (development) / **PostgreSQL** (Docker) profiles, multi-stage Dockerfiles, **GitHub Actions** CI
- Consistent JSON error bodies with Bean Validation and `@RestControllerAdvice`, Swagger UI

## Technical decisions

- **Stateless JWT authentication.** Because the frontend and backend are separate applications, the backend issues signed tokens instead of keeping server-side sessions. It uses Spring Security's own OAuth2 Resource Server support (Nimbus, HS256) rather than an extra JWT library.
- **User isolation in the data layer.** Every repository query is filtered by the entry's owner. Requesting someone else's entry returns 404 rather than 403, so the app does not even reveal that the entry exists.
- **Layered prompt-injection defense.** Rules go in the *system* message; user content goes in the *user* message inside `<journal>` tags, and the model is told to treat it as data, not instructions. Closing tags are escaped, and because messages are not run through a template engine, curly braces in the content are safe.
- **Structured output instead of text parsing.** Sentiment and keywords are requested in OpenAI's JSON mode and mapped straight into Java records. This replaced text-splitting code that broke whenever the model changed its format.
- **Self-invalidating cache.** The cache key for AI results is *entry + last update time + language + mode*. Editing an entry changes the key, so no eviction code is needed. Caffeine bounds the cache by size and TTL.
- **Zero-cost demo.** Without an OpenAI key, a rule-based engine answers the same endpoints. Each visitor gets a separate guest account, so nobody can see or break anyone else's data.
- **AI tests over real HTTP.** Tests run a local HTTP server (JDK `HttpServer`) that mimics OpenAI. Instead of mocking an interface, they check the actual request the app sends: model, message roles, JSON mode, temperature and language.

## Architecture

```
code-diary/                 Spring Boot backend
├── controller/             REST endpoints (Auth, Journals, AI)
├── services/               Business logic, AI prompts, demo AI engine, sample data
├── security/               JWT issuing/validation, SecurityFilterChain
├── repository/             Spring Data JPA (every query scoped to the user)
├── dto/ model/             Request/response objects and JPA entities
├── exception/              Localized global error handling
└── config/                 CORS, OpenAPI, first-run data

code-diary-frontend/        React SPA
├── pages/                  Sign-in, list, detail (+AI panel), form, 404
├── components/             Heatmap, weekly report, AiPanel, JournalCard…
├── context/                Session, theme and notification providers
├── i18n/                   TR/EN translations
└── services/               axios client and API calls
```

## Setup

### With Docker (recommended)

```bash
docker compose up --build
```

This starts PostgreSQL, the backend and the frontend together. The app runs at http://localhost:3000 and Swagger at http://localhost:8080/swagger-ui.html. For real AI, create a `.env` file in the project root containing `OPENAI_API_KEY=sk-...`; Docker Compose reads it automatically (the file is in `.gitignore` and never committed).

### Manually

**Requirements:** Java 21+, Node.js 18+

```bash
# Backend — runs on an H2 database
cd code-diary
cp .env.example .env        # OPENAI_API_KEY (optional, demo mode otherwise)
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run

# Frontend (in a second terminal, from the project root)
cd code-diary-frontend
npm install
npm start                   # http://localhost:3000
```

On first run, a `demo` / `demo1234` user is created with sample entries.

### Tests

```bash
# From the project root
cd code-diary && ./mvnw test && cd ..                      # backend: integration + unit tests
cd code-diary-frontend && npm test -- --watchAll=false     # frontend: component tests
```

The backend tests also verify the prompts sent to OpenAI (system/user separation, JSON mode, caching, language selection) against a local fake server, so no real API key is needed.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | OpenAI API key (demo mode if missing) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model |
| `AI_DEMO_MODE` | `true` | Use demo answers without a key (`false` → AI endpoints return 503) |
| `JWT_SECRET` | development key | Token signing key, **change it in production** (≥32 characters) |
| `SPRING_PROFILES_ACTIVE` | — | `postgres` → use PostgreSQL |
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | local PostgreSQL | Connection settings for the `postgres` profile |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Frontend origin |
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend URL used by the frontend (at build time) |

## API overview

Every endpoint except `/api/auth/*` and `/api/ai/status` requires `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` · `/api/auth/login` | Sign up / sign in → JWT |
| `POST` | `/api/auth/demo` | Guest account with sample data → JWT |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/rest/api/journals?page=0&size=6&q=&tag=` | List / search / filter by tag |
| `GET` `POST` `PUT` `DELETE` | `/rest/api/journals[/{id}]` | Entry CRUD (delete is a soft delete) |
| `GET` | `/rest/api/journals/tags` | Tags and usage counts |
| `GET` | `/rest/api/journals/activity?days=365` | Heatmap data and streaks |
| `GET` | `/api/ai/status` | AI mode: `openai` / `demo` / `off` |
| `GET` | `/api/ai/{summary,sentiment,keywords,suggestion}/{id}?refresh=` | AI analyses (cached) |
| `GET` | `/api/ai/weekly?refresh=` | Weekly report |
| `POST` | `/api/ai/ask/{id}` | Ask a question about an entry |

## Deploying a live demo

Thanks to demo mode, the app can run on free tiers without an API key:

1. **Database + backend (Render):** create a database with *New → PostgreSQL*, then a Docker *New → Web Service* from the `code-diary` folder. Environment variables: `SPRING_PROFILES_ACTIVE=postgres`, `DATABASE_URL=jdbc:postgresql://<host>:5432/<db>`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS=https://<frontend-url>`.
2. **Frontend (Vercel/Netlify):** root directory `code-diary-frontend`, build command `npm run build`, output `build`, environment variable `REACT_APP_API_URL=https://<backend-url>`. Rewrite all routes to `index.html` for client-side routing.
3. For real AI, add `OPENAI_API_KEY` to the backend and set a **monthly spending limit** in the OpenAI dashboard.

## License

[MIT](LICENSE)
