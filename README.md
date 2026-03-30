# Research Paper Summarization & Evaluation Pipeline

> An end-to-end AI-powered pipeline for ingesting, summarizing, and semantically searching academic research papers; built to demonstrate production-grade LLM integration, RAG architecture, and cloud-native deployment.

---

## Overview

Keeping up with academic literature is time-consuming. This project automates the heavy lifting: drop in a PDF (or a folder of them), and the pipeline extracts the text, sends it through a large language model, and returns a structured summary covering key findings, novelty, real-world applications, and limitations.

Papers are embedded into a vector store for semantic search, so you can query across your entire library with natural language, *"find papers related to transformer attention mechanisms in low-resource languages"*, and get ranked, relevant results instantly.

A lightweight scheduler watches for new papers and processes them automatically, while a web frontend makes the whole system accessible to non-technical users. Token usage and cost estimates are tracked throughout, giving full visibility into API consumption.

---

## Key Features

- **PDF Ingestion**: Upload single papers or batch-process entire folders
- **LLM Summarization**: Structured summaries via OpenAI GPT or through Amazon Bedrock, with long-context chunking for large papers
- **Semantic Search**: Natural language queries across all ingested papers using vector embeddings
- **Automated Pipeline**: Scheduled job processing with async task queue and status tracking
- **Usage Dashboard**: Token consumption, cost estimates, and processing stats
- **Full-Stack SvelteKit**: Single unified app — frontend, backend routes, and API in one project

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM & Embeddings | OpenAI (GPT, text-embedding-3-small), Amazon Bedrock |
| Frontend & Backend | SvelteKit (full-stack) |
| Database | PostgreSQL (Supabase or Amazon RDS) |
| Vector Search | pgvector |
| Containerization | Docker, Docker Compose |
| Cloud Deployment | Vercel / AWS (EC2, ECS) |
| CI/CD | GitHub Actions |

---

## Project Task Breakdown

---

## Phase 1: Project Setup & Infrastructure

- [x] Initialize Git repository with `.gitignore`, `README.md`, and branch strategy
- [ ] Scaffold SvelteKit project with TypeScript
- [x] Configure environment variable management (`.env`, `$env/static/private`)
- [ ] Set up Docker and write base `Dockerfile`
- [ ] Write `docker-compose.yml` to orchestrate backend, frontend, and database services locally
- [x] Set up PostgreSQL
- [x] Enable pgvector extension

---

## Phase 2: Data Ingestion

- [x] Build a PDF ingestion module that accepts local files or URLs
- [x] Integrate a parsing library (e.g., `pdf-parse` or `pdfjs-dist`) to extract clean text
- [ ] Handle edge cases: scanned PDFs, multi-column layouts, references sections
- [ ] Store raw extracted text in the database, linked to the uploaded file
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
- [ ] Store structured summaries as JSON in the database, linked to the source paper
- [ ] Add token usage logging per request (model, prompt tokens, completion tokens, cost estimate)

---

## Phase 4: Semantic Search (RAG Layer)

- [ ] Integrate OpenAI `text-embedding-3-small` for paper embeddings
- [ ] Store embeddings in PostgreSQL using pgvector
- [ ] Chunk paper text and upsert embeddings into the vector store on ingestion
- [ ] Build a semantic search endpoint: given a query, return top-k relevant papers
- [ ] Combine vector search with keyword metadata filters (author, date, topic)

---

## Phase 5: Backend API (SvelteKit Server Routes)

- [ ] Scaffold API routes under `src/routes/api/`
- [ ] Endpoints to build:
  - `POST /api/papers/ingest`: upload and process a PDF
  - `GET /api/papers`: list all papers with metadata and summary
  - `GET /api/papers/[id]`: retrieve full summary and details for one paper
  - `POST /api/search`: semantic search across ingested papers
  - `GET /api/stats`: token usage, cost estimates, paper counts
- [ ] Add input validation and error handling

---

## Phase 6: Job Scheduler (Pipeline Orchestration)

- [ ] Set up a scheduled job to watch for new PDFs (folder, S3 bucket or Supabase Storage bucket)
- [ ] Use a lightweight scheduler (e.g., `APScheduler` or a serverless cron trigger)
- [ ] Build a processing queue so papers are summarized asynchronously
- [ ] Add job status tracking: `pending`, `processing`, `complete`, `failed`
- [ ] Send a notification (email or webhook) when a batch job completes

---

## Phase 7: Frontend (SvelteKit)

- [ ] Build paper upload interface (drag-and-drop PDF uploader)
- [ ] Build paper list view with metadata, tags, and summary preview
- [ ] Build paper detail view with full structured summary
- [ ] Build semantic search bar with results ranked by relevance
- [ ] Build a usage dashboard: papers processed, tokens consumed, estimated cost
- [ ] Ensure responsive layout and clean, readable typography

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
## Phase 8: Testing & Quality

- [ ] Write unit tests for ingestion, chunking, and prompt-building logic
- [ ] Write integration tests for API routes
- [ ] Test pipeline with a diverse set of papers (short, long, multi-column, scanned)
- [ ] Load test the API with concurrent ingestion requests

---

## Phase 9: Deployment & Documentation

- [ ] Deploy SvelteKit app to Vercel
- [ ] Configure Supabase environment variables in Vercel
- [ ] Set up CI/CD pipeline (GitHub Actions): lint, test, deploy on merge to `main`
- [ ] Write thorough `README.md`:
  - Project overview and motivation
  - Architecture diagram
  - Local setup instructions
  - Environment variables reference
- [ ] Add an architecture diagram (system components and data flow)
- [ ] Record a short demo video walking through the app
- [ ] Write a brief blog post or LinkedIn article explaining design decisions
- [ ] Deploy a live public demo instance

---

## Milestones

| Milestone | Phases | Goal |
|---|---|---|
| MVP | 1–3 | Ingest a PDF and get a structured LLM summary |
| Search | 4–5 | Query papers semantically via API |
| Automation | 6 | Pipeline runs on a schedule without manual triggers |
| Full Product | 7 | Usable frontend for non-technical users |
| Production Ready | 8–10 | Deployed, tested, documented, and demo-able |
