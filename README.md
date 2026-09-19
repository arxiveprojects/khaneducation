# Khan Education

School operating system for multi-tenant schools: enrollments, attendance, activity, and book-based chapter lessons. Khan Education does not generate lesson media itself. It stores school data in PostgreSQL and asks a separate **slidegen** service to extract a table of contents, generate one chapter at a time, and vectorize the chapter with page and paragraph citations.

## What changed

The previous app was a single-tenant lesson site on DynamoDB with in-process Gemini lesson and video generation. That path is gone. The current app is a school OS:

- **Schools and tenancy.** Owner, admin, teacher, and student memberships. Teacher invitations, student applications, subject assignment, and class enrollment.
- **Books, not freeform lessons.** Staff upload a book to a subject. Slidegen builds the TOC, then generates and vectorizes chapters one at a time.
- **Isolated chapter player.** Generated HTML/CSS/JS runs in a sandboxed iframe (`allow-scripts` only). The host handles voice (`voice.read`), citations, and progress via `postMessage`.
- **Operations desk.** Staff see jobs, attendance, activity, and faculty/student performance for a school.
- **PostgreSQL instead of DynamoDB.** SQLAlchemy 2, Alembic, and `psycopg`. PynamoDB CRUD is removed.
- **Slidegen instead of in-app AI.** Jobs go out over SQS FIFO (`MessageGroupId=book_id`) or the slidegen HTTP API. Progress comes back through an HMAC webhook. Vectors stay in slidegen namespaces, not in this database.

## How a book becomes chapters

1. A teacher or admin uploads a book on a subject.
2. Khan Education creates a `TOC` job and enqueues it to slidegen (SQS if `SQS_SLIDEGEN_QUEUE_URL` is set, otherwise `SLIDEGEN_API_URL`). If neither is set, a local stub creates placeholder chapters.
3. Slidegen posts progress to `/internal/slidegen/webhook`.
4. After the TOC is ready, the next pending chapter is queued (`GENERATE_CHAPTER`, then vectorize).
5. The student player loads `/embed/chapters/{chapter_id}` in an iframe. Tooltips can request host TTS and show book page citations. Chapter progress is written from `progress` / `voice.read` messages.

## Product surfaces

**Students**

- Apply to a school, see enrolled subjects, play a chapter, take a quiz, and ask the assistant (RAG against the chapter namespace when slidegen is configured).
- Dashboard: progress, quiz scores, applications.

**Teachers and school staff**

- Create a school, invite teachers, review applications, create subjects, assign teachers, enroll students, upload books.
- Workspace: enrollments, attendance, generation jobs, activity feed, and a performance desk (progress, scores, attendance).

## Tech stack

| Layer | Choice |
| --- | --- |
| API | FastAPI 2.0, Pydantic, JWT |
| Data | PostgreSQL 16, SQLAlchemy 2, Alembic |
| Generation | slidegen (SQS FIFO or HTTP) + HMAC webhook |
| Files | S3 (`S3_BOOKS_BUCKET`) or `LOCAL_UPLOAD_DIR` |
| Web | React, Vite, TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query |
| E2E | Playwright (`web/npm run test:e2e`) |

Layout:

- `app/routers` — HTTP
- `app/services.py` — school, book, job, dashboard, and webhook logic
- `app/models.py` / `app/schemas.py` — Postgres models and API contracts
- `app/clients/slidegen.py` — enqueue and RAG query
- `app/activity.py` — school activity events
- `web/src/pages/SchoolWorkspace.tsx` — staff desk
- `web/src/components/chapters/ChapterPlayer.tsx` — iframe host

## Local setup

Needs Python 3.13+, [uv](https://docs.astral.sh/uv/), Node 18+, Docker, and Git.

```bash
git clone https://github.com/ikram98ai/khaneducation.git
cd khaneducation
cp .env.example .env
# Set SECRET_KEY (openssl rand -base64 32). Leave slidegen URLs empty to use the local stub.
```

```bash
make db          # postgres:16 on localhost:5432 (user/pass/db: khan / khan / khaneducation)
make sync        # uv sync
make migrate     # alembic upgrade head
make seed        # demo users and a sample school
make dev         # API at http://127.0.0.1:8000 (docs at /docs)
```

```bash
cd web
npm install
npm run dev      # http://127.0.0.1:5173 — talks to the local API
```

Demo accounts (password `Abc123()`):

| Email | Role |
| --- | --- |
| `owner@example.com` | School owner |
| `teacher@example.com` | Teacher |
| `student@example.com` | Student |

## Environment

See `.env.example`. Important keys:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres URL (`postgresql+psycopg://...`) |
| `SECRET_KEY` | JWT signing key. Required when `DEBUG=false` |
| `SLIDEGEN_API_URL` / `SLIDEGEN_API_KEY` | HTTP job + RAG API |
| `SLIDEGEN_WEBHOOK_SECRET` | HMAC for `/internal/slidegen/webhook` |
| `SLIDEGEN_CALLBACK_BASE_URL` | Public API base slidegen should call back |
| `SQS_SLIDEGEN_QUEUE_URL` | FIFO queue; takes precedence over HTTP enqueue |
| `S3_BOOKS_BUCKET` | Book storage; unset uses `LOCAL_UPLOAD_DIR` |
| `PUBLIC_APP_ORIGIN` | Frontend origin |

## API map

Interactive docs: `http://127.0.0.1:8000/docs`.

| Area | Examples |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login` |
| Schools | `GET/POST /schools`, invitations, applications, subjects, enrollments, attendance, jobs, activity, `GET /schools/{id}/performance` |
| Books | `POST /subjects/{id}/books`, `GET /books/{id}/jobs` |
| Chapters | `GET /books/{id}/chapters`, `POST /chapters/{id}/progress`, `GET /embed/chapters/{id}` |
| Jobs | `GET /jobs/{id}`, `POST /internal/slidegen/webhook` |
| Learning | `GET /chapters/{id}/quiz`, `POST /quizzes/{id}/submit`, `POST /assistant/query` |

## Scripts

**Backend (makefile)**

- `make db` — start Postgres
- `make migrate` — apply Alembic
- `make seed` — demo data
- `make dev` — FastAPI
- `make lint` / `make format`

**Frontend**

- `npm run dev`
- `npm run build`
- `npm run test:e2e`
- `npm run deploy` — existing S3 / CloudFront helper (legacy infra)

Terraform and the Lambda/Mangum wrapper are still in the repo. They are not the local development path.

## License

MIT. See `LICENSE`.
