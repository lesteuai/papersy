# Papersy

## Project Task Breakdown (before Workspace rewrite)

---

## Phase 1: Project Setup & Infrastructure

- [x] Initialize Git repository with `.gitignore`, `README.md`, and branch strategy
- [x] Scaffold SvelteKit project with TypeScript
- [x] Configure environment variable management (`.env`, `$env/static/private`)
- [ ] Set up Docker and write base `Dockerfile`
- [x] Write `docker-compose.yml` to orchestrate backend, frontend, and database services locally
- [x] Set up PostgreSQL
- [x] Enable pgvector extension

---

## Phase 2: Data Ingestion

- [x] Build a PDF ingestion module that accepts local files or URLs
- [x] Integrate a parsing library (e.g., `pdf-parse` or `pdfjs-dist`) to extract clean text
- [ ] Handle edge cases: scanned PDFs, multi-column layouts, references sections
- [x] Store raw extracted text in the database, linked to the uploaded file
- [ ] Write a batch ingestion flow that processes multiple PDFs in one run
- [ ] Add basic metadata extraction: title, authors, publication date (via regex or LLM)

---

## Phase 3: LLM Summarization Pipeline

- [x] Design a structured prompt template for paper summarization:
  - Summary
  - Key findings
  - References
  - Methodology
  - Limitations
- [x] Integrate OpenAI API as the summarization model
- [ ] Implement long-context chunking strategy for papers exceeding token limits
- [x] Store structured summaries as JSON in the database, linked to the source paper
- [ ] Add token usage logging per request (model, prompt tokens, completion tokens, cost estimate)

---

## Phase 4: Semantic Search (RAG Layer)

- [x] Integrate OpenAI `text-embedding-3-small` for paper embeddings
- [x] Store embeddings in PostgreSQL using pgvector
- [x] Chunk paper text and upsert embeddings into the vector store on ingestion
- [x] Build a semantic search endpoint: given a query, return top-k relevant papers
- [ ] Combine vector search with keyword metadata filters (author, date, topic)

---

## Phase 5: Backend API (SvelteKit Server Routes)

- [x] Scaffold API routes under `src/routes/api/`
- [x] Endpoints built:
  - `POST /api/upload`: upload and process a PDF
  - `GET /api/jobs/[id]`: poll job status
  - `POST /api/chat`: RAG-based chat with paper context
  - `GET /api/papers/[id]`: retrieve paper details
  - `DELETE /api/papers/[id]`: delete paper and vectors
- [x] Input validation and error handling

---

## Phase 6: Job Scheduler (Pipeline Orchestration)

- [x] Async job processing for PDF uploads
- [x] Job status tracking: `pending`, `processing`, `done`, `failed`
- [ ] Set up a scheduled job to watch for new PDFs (folder, S3 bucket or Supabase Storage bucket)
- [ ] Use a lightweight scheduler (e.g., `APScheduler` or a serverless cron trigger)
- [ ] Send a notification (email or webhook) when a batch job completes

---

## Phase 7: Frontend (SvelteKit)

- [x] Build paper upload interface
- [x] Build paper list view with metadata and summary preview
- [x] Build paper detail view with full structured summary
- [x] Build RAG-based chat interface scoped to selected paper
- [ ] Build semantic search bar with results ranked by relevance
- [ ] Build a usage dashboard: papers processed, tokens consumed, estimated cost
- [x] Ensure responsive layout and clean, readable typography

---

## Phase 8: Containerization & Cloud Deployment

- [ ] Finalize and optimize all Dockerfiles (multi-stage builds where applicable)
- [ ] Test full stack locally with `docker-compose up`
- [ ] Choose cloud target: Cloud Run (GCP), Azure Container Apps, or AWS ECS
- [ ] Write infrastructure-as-code config (e.g., `cloudbuild.yaml` or `terraform` basics)
- [ ] Set up CI/CD pipeline (GitHub Actions):
  - Lint and test on push
  - Build and push Docker image to container registry
  - Deploy to cloud on merge to `main`
- [ ] Configure secrets management in the cloud environment (not hardcoded `.env`)
- [ ] Set up a managed cloud database (Amazon RDS)

---

## Phase 9: Testing & Quality

- [x] Write unit tests for ingestion, chunking, and prompt-building logic
- [ ] Write integration tests for API routes
- [ ] Test pipeline with a diverse set of papers (short, long, multi-column, scanned)
- [ ] Load test the API with concurrent ingestion requests

---

## Phase 10: Deployment & Documentation

- [x] Deploy SvelteKit app to Vercel
- [x] Configure environment variables in cloud deployment
- [ ] Set up CI/CD pipeline (GitHub Actions): lint, test, deploy on merge to `main`
- [ ] Finalize README with project overview, architecture, setup, and env reference
- [ ] Add architecture diagram (system components and data flow)
- [x] Record a short demo video walking through the app
- [x] Write a brief blog post or LinkedIn article explaining design decisions
- [x] Deploy a live public demo instance
