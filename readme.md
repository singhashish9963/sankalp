# Sankalp — AI-Powered Career Platform

> **"Transform Your Career with AI-Powered Guidance"**
> An end-to-end career preparation suite by **Team UnFazed**

Sankalp (Sanskrit: *resolve*, *commitment*) is a full-stack web platform that combines AI mock interviews, personalized career roadmaps, job discovery, ATS resume analysis, automated resume generation, peer chat, and quiz-based learning — all in one place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Chrome Extension Setup](#chrome-extension-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Architecture Overview](#architecture-overview)

---

## Features

### AI Mock Interview System
- Specify your target role and skills, generates tailored interview questions
- Questions are read aloud via **Deepgram Aura-2** text-to-speech
- Answer by speaking — responses are transcribed in real time with **Deepgram STT**
- A parallel **Flask CV/ML microservice** scores body language and voice tone
- Final score = 50% response quality + 25% voice tone + 25% body language
- Full interview reports are stored in PostgreSQL; past weaknesses are recalled across sessions via **Qdrant** vector memory

### AI Career Roadmap Generator
- Multi-step **LangGraph** agent analyzes bookmarked jobs against your profile
- Identifies skill gaps, fetches live learning resources via **Tavily** web search
- Generates a 4–7 step learning plan with time estimates, skills, and resource links
- Roadmaps are cached in MongoDB for fast subsequent loads

### ATS Resume Analysis
- Upload a PDF/DOCX resume and paste a job description
- LLM returns match score (0–100%), missing/present keywords, and tailored recommendations

### AI Resume Generator
- Monaco Editor form for structured data entry
- **LLaMA 3.3 70B** (via OpenRouter) generates a complete LaTeX resume
- Live LaTeX preview with automated validation and template fallback

### Job Discovery
- Scrapes **LinkedIn** (Cheerio) and **Naukri** (Apify) job listings
- **SerpAPI** integration for additional job search
- Bookmark jobs to your profile; bookmarked roles drive roadmap generation

### AI Quiz Generator
- Enter any topic to get a 5-question multiple-choice quiz
- Tries Gemini first, falls back to GPT-4o-mini, then a static fallback
- Scores tracked per user in MongoDB

### Peer-to-Peer Chat
- Real-time messaging between platform users
- Unread message counts and read receipts via MongoDB

### Smart Text Saver (Chrome Extension)
- Select any text on any webpage and save it with one click
- In-extension AI chatbot powered by **Gemini** to query your saved snippets

### Multilingual Support
- Full UI translation system supporting **English** and **Hindi**

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, GSAP, Three.js |
| **Backend** | Node.js, Express.js v5, Prisma ORM |
| **AI / LLM** | Google Gemini API, OpenRouter (LLaMA 3.3 70B), LangChain, LangGraph |
| **Speech** | Deepgram (STT + Aura-2 TTS) |
| **Vector DB** | Qdrant (768-dim Gemini embeddings, cosine similarity) |
| **Databases** | PostgreSQL (Supabase + Prisma), MongoDB Atlas, Upstash Redis |
| **Auth** | Supabase Auth |
| **Job Scraping** | Apify (Naukri), Cheerio (LinkedIn), SerpAPI |
| **CV/ML** | Python Flask microservice (body language + voice tone analysis) |
| **Extension** | Chrome MV3 (content script + service worker + popup) |
| **Rate Limiting** | Upstash Redis + `@upstash/ratelimit` |

---

## Project Structure

```
sankalp/
├── backend/                    # Express.js API server (port 3001)
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL schema (nextstep schema)
│   └── src/
│       ├── server.js           # Main Express app
│       ├── routes/
│       │   └── interviews.js   # Mock interview CRUD routes
│       └── services/
│           ├── llm.js          # Question generation & evaluation (OpenRouter/GPT-4o)
│           ├── memory.js       # User memory (Prisma + Qdrant)
│           ├── embeddings.js   # Gemini embeddings via OpenRouter
│           ├── qdrant.js       # Qdrant vector DB client
│           ├── deepgram.js     # Speech-to-text transcription
│           ├── elevenlabs.js   # Text-to-speech (Deepgram Aura-2)
│           ├── worker.js       # Async evaluation queue
│           └── context.js      # Interview context builder
├── frontend/                   # Next.js 15 App Router (port 3000)
│   └── src/
│       ├── middleware.js       # Auth guard for /dashboard/* and /user/*
│       ├── app/
│       │   ├── page.js         # Landing page
│       │   ├── auth/           # Login & signup pages
│       │   ├── dashboard/      # Main app (interview, jobs, roadmap, quiz, resume, chat, profile)
│       │   └── api/            # Next.js API routes
│       ├── agents/
│       │   ├── generate_roadmap.js   # LangGraph roadmap agent
│       │   ├── generate_ats.js       # ATS analysis agent
│       │   └── generate_goals.js     # Goals/skills extraction agent
│       ├── components/         # Landing and dashboard UI components
│       ├── hooks/              # useAuth, useInterview, useJobs
│       ├── lib/                # MongoDB, Supabase, API client, i18n
│       └── mongowork/          # MongoDB CRUD helpers
└── Extension/                  # Chrome Extension MV3
    ├── manifest.json
    ├── background.js           # Service worker
    ├── content.js              # Page content script
    └── popup.js                # Popup UI (Chat + Saved Texts tabs)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a Supabase project)
- MongoDB Atlas cluster
- Qdrant instance (local or cloud)
- Python 3.9+ (for the Flask analysis microservice)
- API keys for: Google Gemini, OpenRouter, Deepgram, Apify, Tavily, Upstash Redis, SerpAPI

### Backend Setup

```bash
cd backend
npm install

# Configure environment variables (see below)
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The backend runs on **http://localhost:3001**.

You will also need a **Flask microservice** running on port 5001 for body language and voice tone analysis.

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables (see below)
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend runs on **http://localhost:3000**.

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked** and select the `Extension/` folder
4. Ensure the backend server is running

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma) |
| `OPENROUTER_API_KEY` | OpenRouter key for GPT-4o interview logic and embeddings |
| `GEMINI_API_KEY` | Google Gemini API key (Smart Text Saver chatbot) |
| `DEEPGRAM_API_KEY` | Deepgram key for STT and TTS |
| `DEEPGRAM_VOICE` | Deepgram voice name (optional, default: `alloy`) |
| `DEEPGRAM_MODEL` | Deepgram model (optional, default: `aura-2`) |
| `QDRANT_URL` | Qdrant instance URL (default: `http://localhost:6333`) |
| `QDRANT_API_KEY` | Qdrant API key (required for Qdrant Cloud) |
| `FLASK_ANALYSIS_URL` | Flask CV/ML server URL (default: `http://127.0.0.1:5001`) |
| `PORT` | Server port (default: `3001`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini key (quiz generation) |
| `OPENROUTER_API_KEY` | OpenRouter key (roadmap, ATS, resume, goals agents) |
| `TAVILY_API_KEY` | Tavily key for roadmap resource web search |
| `APIFY_TOKEN` | Apify token for Naukri job scraping |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (rate limiting) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXT_PUBLIC_SITE_URL` | Site URL for OpenRouter referrer header (optional) |

---

## API Reference

### Backend Express API (`http://localhost:3001`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check, lists available endpoints |
| `POST` | `/api/save` | Save a text snippet (Smart Text Saver) |
| `GET` | `/api/texts` | Get all saved text snippets |
| `DELETE` | `/api/texts/:id` | Delete a saved text snippet |
| `POST` | `/api/query` | Query saved texts via Gemini AI |
| `GET` | `/interviews` | List all interviews |
| `POST` | `/interviews` | Create a new mock interview (generates questions via GPT-4o) |
| `GET` | `/interviews/:id` | Get a single interview with questions, transcripts, and reports |
| `POST` | `/interviews/:id/answer` | Submit an audio answer (transcribed + queued for evaluation) |
| `GET` | `/interviews/:id/questions/:questionId/audio` | Get TTS audio for a question |
| `GET` | `/interviews/transcripts/:transcriptId/evaluation` | Get evaluation result for a transcript |
| `GET` | `/interviews/:id/analysis-status` | Check Flask body-language analysis status |
| `GET` | `/interviews/:id/report` | Get the full interview report (also triggers memory update) |

### Frontend Next.js API (`http://localhost:3000`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login via Supabase |
| `POST` | `/api/auth/signup` | Create a new account |
| `GET/POST/PUT` | `/api/chat` | List users / get message history / mark as read |
| `POST` | `/api/chat/send` | Send a peer-to-peer message |
| `GET` | `/api/linkedin` | Scrape LinkedIn jobs |
| `GET` | `/api/naukri` | Scrape Naukri jobs via Apify |
| `GET` | `/api/serpapi` | Search jobs via SerpAPI |
| `POST` | `/api/roadmap` | Generate an AI career roadmap for bookmarked jobs |
| `POST` | `/api/quiz` | Generate a 5-question quiz on any topic |
| `POST` | `/api/gen_resume` | Generate a LaTeX resume via LLM |
| `POST` | `/api/chatbot` | AI assistant for the dashboard |
| `POST` | `/api/extract-text` | Extract text from a PDF or DOCX file |
| `GET` | `/api/getProfile` | Fetch a user's MongoDB profile |
| `POST` | `/api/saveProfile` | Save a user's MongoDB profile |
| `GET` | `/api/getScores` | Get quiz scores for a user |
| `POST` | `/api/saveScore` | Save a quiz score |
| `POST` | `/api/saveBookmarkedJob` | Bookmark a job to a user's profile |
| `POST` | `/api/user/processing` | Extract skills and goals from a resume via LLM |
| `POST` | `/api/user/ats-check` | Run ATS analysis against a job description |

---

## Database Schema

### PostgreSQL (Prisma — `nextstep` schema)

| Model | Purpose |
|---|---|
| `Interview` | Core interview session (role, status, scores) |
| `Question` | Individual interview questions per session |
| `Transcript` | User answers with evaluation scores |
| `Report` | Final interview report with aggregate scores |
| `UserMemory` | Per-user persistent memory (strengths, weaknesses, summaries) |
| `SkillSnapshot` | Per-interview per-skill scores |
| `UserAggregate` | Rolled-up user statistics across all interviews |

### Qdrant (Vector DB)

- **Collection:** `interview_memories`
- **Vector size:** 768 dimensions (Gemini 1.5 Embedding)
- **Distance metric:** Cosine similarity
- Used for semantic retrieval of past weaknesses/summaries when building interview context

### MongoDB (`AI_Interview` database)

| Collection | Purpose |
|---|---|
| `Profiles` | User profile data, bookmarked jobs, roadmap, skills, goals |
| `Chats` | Peer-to-peer messages with read receipts |
| `Scores` | Quiz scores per user |

### Supabase (PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | Auth user records with `uniquePresence` session tokens |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│   Next.js 15 App  ◄──────────────►  Chrome Extension   │
└───────────┬─────────────────────────────────┬───────────┘
            │ Next.js API Routes               │ REST
            │ (port 3000)                      │ (port 3001)
┌───────────▼──────────────┐      ┌────────────▼──────────┐
│   Next.js Server-Side    │      │  Express.js Backend   │
│  LangGraph Agents:       │      │  Interview Engine:    │
│  • Roadmap Generator     │      │  • GPT-4o Questions   │
│  • ATS Analyzer          │      │  • Deepgram STT/TTS   │
│  • Goals Extractor       │      │  • Evaluation Queue   │
└─────┬────────┬───────────┘      └────┬──────┬───────────┘
      │        │                       │      │
      ▼        ▼                       ▼      ▼
 Supabase  MongoDB               PostgreSQL  Qdrant
  (Auth)  (Profiles,             (Prisma —  (Vector
          Chats,                  Interview  Memory)
          Scores)                  Data)
                                        │
                               ┌────────▼────────┐
                               │  Flask (5001)   │
                               │  Body Language  │
                               │  Voice Tone     │
                               └─────────────────┘
```

---

*Built with passion by **Team UnFazed***
