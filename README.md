
Every business gets a persistent **Business Memory** — the Researcher agent grounds each draft in it, so a bakery's captions never sound like a law firm's. Nothing goes out without a human clicking "Approve & Schedule" first; a background poller then handles the actual publish through Instagram's Graph API when the scheduled time comes.

## Features

- **Agent content pipeline** — Researcher → Creator → Sentinel, built on LangGraph, tuned per platform (Instagram, LinkedIn, WhatsApp, Twitter/X, Facebook, Email)
- **Weekly planner** — plan a full week of posts in one pass, with festival-aware suggestions computed live from the calendar
- **Real Instagram automation** — OAuth connect, image generation, and genuine Graph API publishing on a schedule, not a mockup
- **Brand memory (RAG)** — Supabase `pgvector` + HuggingFace embeddings ground every draft in a persistent, per-business style profile
- **Human-in-the-loop** — nothing auto-publishes without explicit approval

## Stack

| | |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind |
| **Backend** | FastAPI, LangGraph, LangChain, Groq |
| **Data** | Supabase (Postgres, pgvector, Row-Level Security) |
| **Auth** | Firebase (trusted by Supabase via Third-Party Auth) |
| **Scheduling** | APScheduler (background polling) |
| **Deploy** | Vercel (frontend) · Render (backend) |

## Running locally

### Database
Create a Supabase project and run the migrations in `backend/migrations/` (in order) via the Supabase SQL Editor.

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in your own keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd Frontend
npm install
cp .env.example .env.local   # fill in your own keys
npm run dev
```

Both `.env.example` files list the exact variables each side needs — Groq/Supabase keys for the backend, Supabase/Firebase client config for the frontend, plus Meta app credentials for Instagram OAuth.

## Deployment

Frontend deploys to Vercel, backend to Render, both auto-deploying from this repo. See `DEPLOYMENT_GUIDE.md` for the full walkthrough.

## License
This project is for hackathon and portfolio purposes. See `Frontend/ATTRIBUTIONS.md` for open-source credits.
