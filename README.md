# PitchPleaseAI 🚀

PitchPleaseAI  is a serverless, AI-powered multi-agent automated social media content generation platform. It acts as an intelligent marketing assistant that understands a company's brand DNA, researches trends, drafts highly tailored content, automatically generates marketing images, and schedules weekly posts.

## 🌟 Key Features

- **Multi-Agent AI Orchestration:** Powered by LangGraph, forming a pipeline with three distinct AI agents:
  - **Researcher:** Contextualizes trends and analyzes brand identity.
  - **Creator:** Drafts social media posts tailored to specific platforms.
  - **Sentinel:** Acts as a strict critique and editor, enforcing revision loops until quality standards are met.
- **Brand Memory (RAG):** Uses Supabase `pgvector` and HuggingFace embeddings (`all-MiniLM-L6-v2`) to store and retrieve brand-specific knowledge, ensuring all generated content aligns with the brand's unique voice.
- **Cost-Optimized LLM Routing:** Built for high performance and resilience. Defaults to Groq (Llama-3.3-70B) for ultra-low latency inference, with an automatic fallback to AWS Bedrock (Claude 3 Haiku) to ensure zero downtime.
- **Automated Image Generation:** Integrates completely free-tier optimized HuggingFace Serverless Inference (FLUX.1-schnell) to instantly generate compelling visuals for posts.
- **Visual Planner:** A fully interactive React-based Weekly Planner to schedule and manage your social media pipeline.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Framer Motion (for fluid animations), Lucide React
- **State/Auth:** Supabase JS SDK, React Context API

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **AI/LLM:** LangGraph, LangChain, Groq, AWS Bedrock, HuggingFace
- **Database:** Supabase (PostgreSQL, pgvector, Row Level Security)
- **Deployment Wrapper:** Mangum (ASGI adapter for AWS Lambda)

### Infrastructure (AWS Serverless)
- **Functions & API:** AWS Lambda, Amazon API Gateway
- **Orchestration:** AWS SAM (Serverless Application Model)
- **Static Hosting:** Amazon S3 + CloudFront

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- AWS CLI & AWS SAM CLI configured
- Supabase Account
- API Keys: Groq, AWS Bedrock, HuggingFace

### Database Setup
1. Create a Supabase project.
2. Run the provided `supabase-migration.sql` in the Supabase SQL Editor to set up the `generated_content` and `weekly_plan` tables, pgvector extensions, and RLS policies.

### Backend Setup
```bash
cd backend
python -m venv venv
# Activate the environment
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory with the following keys:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_key
HF_TOKEN=your_huggingface_token
# AWS Bedrock fallback keys (if running outside of AWS environment)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```
Run the local FastAPI server:
```bash
cd app
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd Frontend
npm install
```
Create a `.env.local` file in the `Frontend/` directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
VITE_BACKEND_API_KEY=your_secure_api_key_for_backend
```
Run the local dev server:
```bash
npm run dev
```

## ☁️ Deployment

PitchPleaseAI is designed for AWS Serverless. We use AWS SAM for the backend and S3/CloudFront for the frontend.

Please refer to the `DEPLOYMENT_GUIDE.md` and the `deploy.sh` script for automated zero-downtime deployment instructions.

## 📄 License
This project is for hackathon and portfolio purposes. See `Frontend/ATTRIBUTIONS.md` for open-source credits.
