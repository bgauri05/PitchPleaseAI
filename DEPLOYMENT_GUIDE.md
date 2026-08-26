# BrandSetu — Free AWS Deployment Guide

> **Goal:** Host both the FastAPI backend and the React frontend on AWS
> with **$0/month** cost using the **AWS Free Tier** (12-month new-account
> free tier + always-free services).

---

## Architecture Overview

```
┌─────────────────────────┐      API calls       ┌──────────────────────────────┐
│   FRONTEND (React)      │ ──────────────────▶   │   BACKEND (FastAPI)          │
│   AWS S3 + CloudFront   │                       │   AWS Lambda + API Gateway   │
│   (Static hosting)      │ ◀──────────────────   │   (Serverless, via Mangum)   │
└─────────────────────────┘      JSON responses   └──────────────────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Supabase (cloud) │
                                                  │  (DB, Auth, etc.) │
                                                  └──────────────────┘
```

### Why This Stack Is Free

| Service             | Free Tier Allowance                         |
|---------------------|---------------------------------------------|
| **AWS Lambda**      | 1 M requests + 400,000 GB-seconds/month (always free) |
| **API Gateway**     | 1 M HTTP API calls/month (12-month free tier) |
| **S3**              | 5 GB storage + 20,000 GET requests/month (12-month) |
| **CloudFront**      | 1 TB transfer + 10 M requests/month (always free) |
| **Supabase**        | Already cloud-hosted — free tier has 500 MB DB, 50k auth users |
| **Groq API**        | Free tier — generous rate limits for Llama 3 |
| **HuggingFace API** | Free Serverless Inference for image gen |

---

## Prerequisites

- An **AWS account** (new accounts get 12-month free tier)
- **AWS CLI v2** installed and configured: `aws configure`
- **Node.js 18+** and **Python 3.11+**
- Your `.env` secrets ready (Supabase, Groq, HuggingFace, API key)

---

## Part 1 — Deploy the Backend (Lambda + API Gateway)

### Step 1: Install the SAM CLI

AWS SAM (Serverless Application Model) packages and deploys Lambda functions.

```bash
# Windows (via MSI)
# Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verify
sam --version
```

### Step 2: Build the Lambda Package

The project already has `Mangum` wired up in `main.py`, which converts
API Gateway events into ASGI calls.  The Lambda handler is:

```
backend/app/main.py  →  handler = Mangum(app, lifespan="off")
```

We've added a `template.yaml` (SAM template) in the repo root. Build:

```bash
cd BrandSetu
sam build
```

This reads `template.yaml`, installs Python dependencies, and packages
everything into `.aws-sam/build/`.

### Step 3: Deploy to AWS

```bash
sam deploy --guided
```

SAM will prompt you for:

| Prompt                     | What to Enter                                    |
|----------------------------|--------------------------------------------------|
| Stack Name                 | `brandsetu-api`                                  |
| AWS Region                 | `ap-south-1` (Mumbai, closest to India)          |
| Parameter Environment      | `production`                                     |
| Parameter ApiKey           | Your `API_KEY` value                             |
| Parameter GroqApiKey       | Your `GROQ_API_KEY`                              |
| Parameter SupabaseUrl      | Your Supabase project URL                        |
| Parameter SupabaseKey      | Your Supabase service role key                   |
| Parameter HfToken          | Your HuggingFace token                           |
| Parameter CorsOrigin       | Your CloudFront URL (add after Step 10, or `*`)  |
| Confirm deploy             | `y`                                              |

SAM saves your answers in `samconfig.toml` so future deploys are one command:

```bash
sam deploy
```

### Step 4: Note Your API URL

After deployment completes, SAM prints outputs:

```
Key                 ApiEndpoint
Description         API Gateway endpoint URL
Value               https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com
```

**Copy this URL.** This is your production backend.

Test it:
```bash
curl https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/
# → {"status":"alive","project":"BrandSetu API",...}
```

---

## Part 2 — Deploy the Frontend (S3 + CloudFront)

### Step 5: Create Your Production `.env`

Create `Frontend/.env.production`:

```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/api/v1
VITE_API_KEY=your-api-key-same-as-backend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 6: Build the Frontend

```bash
cd Frontend
npm install
npm run build
```

This outputs optimized static files to `Frontend/dist/`.

### Step 7: Create an S3 Bucket

```bash
aws s3 mb s3://brandsetu-frontend --region ap-south-1
```

### Step 8: Upload the Build

```bash
aws s3 sync Frontend/dist/ s3://brandsetu-frontend --delete
```

### Step 9: Create a CloudFront Distribution

CloudFront serves your S3 static site with HTTPS + global CDN.

```bash
aws cloudfront create-distribution \
  --origin-domain-name brandsetu-frontend.s3.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

> **For SPA routing:** You need to add a custom error response that redirects
> 403/404 errors to `/index.html` with a 200 status code. Do this in the
> AWS Console under your CloudFront distribution → Error Pages, or use the
> provided `cloudfront-config.json` with the AWS CLI.

Easier approach — use the **AWS Console**:
1. Go to **CloudFront** → **Create Distribution**
2. Origin domain: select your S3 bucket
3. Enable **Origin Access Control (OAC)** — this keeps S3 private
4. Default root object: `index.html`
5. Under **Error pages** → Create custom error response:
   - HTTP error code: `403` → Response page: `/index.html` → HTTP response code: `200`
   - HTTP error code: `404` → Response page: `/index.html` → HTTP response code: `200`
6. Create distribution

### Step 10: Update CORS with Your CloudFront Domain

Once your CloudFront distribution is deployed (takes ~5 min),
note the domain: `https://d1234abcdef.cloudfront.net`

Now update the backend's CORS origin. Re-deploy the SAM stack:

```bash
sam deploy --parameter-overrides \
  "CorsOrigin=https://d1234abcdef.cloudfront.net"
```

---

## Part 3 — Environment Variables Reference

### Backend (Lambda — set via SAM template parameters)

| Variable                      | Where It Goes     | Example                                |
|--------------------------------|-------------------|----------------------------------------|
| `ENVIRONMENT`                  | Lambda env var    | `production`                           |
| `API_KEY`                      | Lambda env var    | `your-secret-api-key`                  |
| `GROQ_API_KEY`                 | Lambda env var    | `gsk_xxxxxxxx`                         |
| `SUPABASE_URL`                 | Lambda env var    | `https://xyz.supabase.co`              |
| `SUPABASE_KEY`                 | Lambda env var    | `eyJhbGci...`                          |
| `HF_TOKEN`                     | Lambda env var    | `hf_xxxxxxxx`                          |
| `BACKEND_CORS_ORIGINS`         | Lambda env var    | `["https://d123.cloudfront.net"]`      |
| `META_APP_ID`                  | Lambda env var    | your Meta Developer App's App ID (not secret) |
| `META_APP_SECRET`              | Lambda env var    | your Meta Developer App's App Secret (keep private) |
| `META_REDIRECT_URI`            | Lambda env var    | `https://<your-api-domain>/api/v1/instagram/callback` — must be a public URL and must exactly match a "Valid OAuth Redirect URI" registered on the Meta app |
| `META_CONFIG_ID`               | Lambda env var    | your Meta App's Instagram config ID, if using one |
| `FIREBASE_SERVICE_ACCOUNT_JSON`| Lambda env var    | the full, minified contents of your Firebase service account key file (e.g. `jq -c . backend/*firebase-adminsdk*.json`) — NOT a file path, since Lambda has no persistent local file for it |

> **After deploying:** go to the Meta Developer App dashboard and update its
> registered "Valid OAuth Redirect URI" from the localhost one to the real
> `META_REDIRECT_URI` value above — Facebook's OAuth dialog rejects any
> redirect that isn't an exact match, so the connect flow will fail with
> `redirect_uri_mismatch` until this is updated.

### Frontend (Build-time — `Frontend/.env.production`)

| Variable                 | Example                                             |
|--------------------------|-----------------------------------------------------|
| `VITE_API_URL`           | `https://xxxxxxx.execute-api.ap-south-1.amazonaws.com/api/v1` |
| `VITE_API_KEY`           | `your-secret-api-key`                               |
| `VITE_SUPABASE_URL`      | `https://xyz.supabase.co`                           |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...`                                       |

---

## Part 4 — Post-Deployment Checklist

- [ ] **Test the health endpoint:** `curl <API_URL>/`
- [ ] **Test content generation:** Use the frontend to generate a post
- [ ] **Test image generation:** Click "Generate Visual" on a draft
- [ ] **Test download:** Click "Download Ready-to-Post Graphic"
- [ ] **Verify CORS:** No browser console errors for cross-origin requests
- [ ] **Check CloudFront SPA routing:** Navigate directly to `/dashboard` — should load the app, not a 404
- [ ] **Supabase auth:** Login/signup works end-to-end

---

## Part 5 — Optional: Custom Domain (Free with Freenom alternatives)

If you want `app.brandsetu.com` instead of a CloudFront URL:

1. Register a domain (or use one you have)
2. In AWS Console → **Route 53** → Create Hosted Zone
3. Request an SSL certificate in **ACM** (free, must be in `us-east-1` for CloudFront)
4. Add the domain as an alternate domain name (CNAME) on your CloudFront distribution
5. Point your DNS to the CloudFront distribution

---

## Part 6 — Updating the App

### Backend Update
```bash
sam build && sam deploy
```

### Frontend Update
```bash
cd Frontend && npm run build
aws s3 sync dist/ s3://brandsetu-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Lambda timeout | Increase `Timeout` in `template.yaml` (max 900s on free tier) |
| CORS errors in browser | Update `CorsOrigin` parameter and redeploy SAM |
| 502 on API Gateway | Check Lambda logs: `sam logs --stack-name brandsetu-api` |
| CloudFront shows old files | Create an invalidation: `aws cloudfront create-invalidation ...` |
| Cold starts are slow | Lambda keeps your function warm with regular traffic; or use provisioned concurrency (paid) |
| Image gen times out | HuggingFace free tier can be slow; the 120s Lambda timeout should cover it |
