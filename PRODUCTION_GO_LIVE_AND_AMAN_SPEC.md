# AegisDesk — Master Production Go-Live & Backend Integration Specification
**Document Version:** 1.0.0 (Production Release)  
**Date:** October 26, 2026  
**Target Systems:** AegisDesk Web Platform (`aegisdesk-round-3.1`) & AegisDesk FastAPI Backend (`Aman's Dashboard / aegisdesk-backend`)

---

## 1. Executive Summary & Architecture

This document is your single source of truth to take **AegisDesk live**. It separates responsibilities between **You (Founder/Admin)**, **Antigravity (AI Assistant)**, and **Aman (Backend Engineer)** so nobody steps on each other's toes and deployment is smooth.

### Architecture Overview

```
[ Visitor / Client Browser ]
           │
           ▼ (HTTPS)
[ Vercel: AegisDesk Next.js ] <─── Hosted from Public/Clean GitHub Repo
    ├── Marketing Pages & Cal.com Booking
    ├── Client Portal & Demo Simulator
    └── Next.js Secure Server Proxy (/api/assistant, /api/documents)
           │
           │  (Authenticated via AEGIS_BACKEND_SECRET_KEY)
           ▼
[ Cloud Backend: Aman's FastAPI ] <─── Auto-deploys from Aman's Private GitHub Repo
    ├── Hosted on Render / Railway / Fly.io
    ├── LangGraph RAG Agent & Hallucination Guardrails
    └── Supabase Database (PostgreSQL + pgvector + Storage)
```

### Key Principles
1. **Website Codebase is Public-Safe:** The website repository will be pushed to a public GitHub branch. Zero secrets, API tokens, or private credentials are in the code. Everything sensitive is loaded via Vercel Environment Variables.
2. **Backend Codebase is Private & Continuous:** Aman maintains his backend repository privately. Whenever Aman commits and pushes to his GitHub repo, his cloud hosting (Render/Railway) automatically pulls and redeploys the latest version.
3. **Frontend Uses the Polished Round 3.1 UI:** We do **not** use Aman's unfinished frontend dashboard. We keep our polished, high-converting Round 3.1 UI and simply call Aman's FastAPI endpoints.
4. **Hero Page is Deferred:** The current fading image transitions are frozen as-is for launch. No changes needed.

---

## 2. Immediate Action Plan: What You Need To Do Right Now

Follow these 4 simple steps. You do not need to do any coding.

### Step 1: Create a Free Supabase Project (5 Minutes)
1. Go to [supabase.com](https://supabase.com) and create a new project (select AWS Mumbai `ap-south-1` or your preferred region).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open and run the two migration scripts located in your website folder:
   - Migration 1: [`supabase/migrations/20261025000000_initial_schema.sql`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/supabase/migrations/20261025000000_initial_schema.sql)
   - Migration 2: [`supabase/migrations/20261026000000_events_api_and_org_settings.sql`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/supabase/migrations/20261026000000_events_api_and_org_settings.sql)
4. Go to **Storage** tab > Create a private bucket called `client-knowledge-base`.
5. Go to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

### Step 2: Push Website to a Clean GitHub Repository (3 Minutes)
1. Verify that your `.env.local` is **never** committed (it is already in `.gitignore`).
2. Run in terminal:
   ```bash
   git status
   ```
   Confirm that `.env.local` is **not** listed under untracked or staged files.
3. Commit and push your code to your GitHub repo (public or private):
   ```bash
   git add .
   git commit -m "feat: production release ready round 3.1"
   git push origin main
   ```

---

### Step 3: Deploy to Vercel & Set Environment Variables (5 Minutes)
1. Go to [vercel.com](https://vercel.com) > **Add New Project** > Import your GitHub repository.
2. Under **Environment Variables**, paste the following keys:

| Environment Variable | Source / Description | Required For |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://aegisdesk.com` or `https://aegisdesk.vercel.app`) | Site metadata & OpenGraph |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://xyz.supabase.co`) | Database & Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` public key | Public client queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` secret key | Server-side mutations & RLS bypass |
| `AEGIS_BACKEND_URL` | The live URL where Aman hosts the backend (e.g. `https://api.aegisdesk.com` or Render URL) | AI RAG Proxy |
| `AEGIS_BACKEND_SECRET_KEY` | Shared secret token agreed between you and Aman | Authenticating with Aman's API |
| `NEXT_PUBLIC_CAL_LINK` | Your Cal.com link (already configured by you) | Demo & Consultation Booking |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | Enables production mode |

3. Click **Deploy**. Vercel will build and deploy the website.

---

### Step 4: Send the "Contract for Aman" to Aman (1 Minute)
Copy and send Section 3 below to Aman so he knows exactly how to host his backend and what rules to follow.

---

## 3. The Contract for Aman: Backend Hosting & API Specification
*(Copy and send this entire section directly to Aman)*

> ### 📢 Message for Aman: Backend Deployment & Integration Contract
>
> Hey Aman! The AegisDesk website is hosted on Vercel and is ready to connect directly to your FastAPI backend.
>
> To make sure updates from your laptop seamlessly deploy without breaking the live website, here is the setup guide and the API contract:
>
> ### 1. How to Host the Backend for Continuous Auto-Deploy
> 1. Keep your backend in your private GitHub repository (`Aman's Dashboard / aegisdesk-backend`).
> 2. Create a free account or web service on **Render.com**, **Railway.app**, or **Fly.io**.
> 3. Connect your private GitHub repository to the web service.
>    - Build Command: `pip install -r requirements.txt` (or use Dockerfile provided in `backend/Dockerfile`)
>    - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
> 4. **Auto-Deploy is now active:** Every time you push a commit to your `main` branch on GitHub, Render/Railway will automatically rebuild and deploy the new code within 60 seconds.
>
> ### 2. Environment Variables You Must Set on Your Backend Host
> - `DATABASE_URL`: Your Supabase PostgreSQL connection string (with pgvector enabled).
> - `SUPABASE_URL`: Supabase project URL.
> - `SUPABASE_SERVICE_KEY`: Supabase service role key (for storage & vector management).
> - `GEMINI_API_KEY` (or `OPENAI_API_KEY`): For your LangGraph LLM & embeddings.
> - `AEGIS_SHARED_API_KEY`: A random 32-character string shared with Vercel for authentication.
> - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins, including your Vercel URL (e.g. `https://aegisdesk.vercel.app,https://aegisdesk.com`).
>
> ### 3. CORS Configuration Required in `app/main.py`
> Ensure your FastAPI CORS middleware allows the website:
> ```python
> from fastapi.middleware.cors import CORSMiddleware
>
> app.add_middleware(
>     CORSMiddleware,
>     allow_origins=["https://aegisdesk.vercel.app", "https://aegisdesk.com", "http://localhost:3000"],
>     allow_credentials=True,
>     allow_methods=["*"],
>     allow_headers=["*"],
> )
> ```
>
> ### 4. Immutable API Endpoints (DO NOT RENAME OR BREAK)
> The website calls these exact endpoints. Please do not change their path or response structure:
>
> #### A. Health Check
> - **Endpoint:** `GET /health`
> - **Response:** `{"status": "ok", "version": "1.0.0"}`
>
> #### B. AI Customer Support Chat (Widget / Portal)
> - **Endpoint:** `POST /widget/chat`
> - **Header:** `Authorization: Bearer <AEGIS_SHARED_API_KEY>`
> - **Request JSON:**
>   ```json
>   {
>     "tenant_id": "uuid-string",
>     "conversation_id": "uuid-string-or-null",
>     "message": "User query here"
>   }
>   ```
> - **Expected Response JSON:**
>   ```json
>   {
>     "conversation_id": "uuid-string",
>     "response": "AI generated answer grounded in policy...",
>     "citations": [
>       {"document_id": "doc-uuid", "title": "Return Policy.pdf", "chunk_text": "..."}
>     ],
>     "escalated": false,
>     "confidence": 0.95
>   }
>   ```
>
> #### C. Document Ingestion
> - **Endpoint:** `POST /documents/upload`
> - **Header:** `Authorization: Bearer <AEGIS_SHARED_API_KEY>`
> - **Body:** `multipart/form-data` with `file: <pdf>` and `tenant_id: <uuid>`
> - **Expected Response JSON:**
>   ```json
>   {
>     "document_id": "uuid-string",
>     "filename": "policy.pdf",
>     "status": "indexing",
>     "chunks_created": 12
>   }
>   ```
>
> #### D. List Documents
> - **Endpoint:** `GET /documents?tenant_id=<uuid>`
> - **Header:** `Authorization: Bearer <AEGIS_SHARED_API_KEY>`
> - **Expected Response JSON:**
>   ```json
>   {
>     "documents": [
>       {
>         "id": "uuid-string",
>         "filename": "policy.pdf",
>         "status": "indexed",
>         "created_at": "2026-10-26T12:00:00Z"
>       }
>     ]
>   }
>   ```
>
> ### 5. Database Schema Rules
> - You can add new columns or tables anytime.
> - **Never drop or rename** existing columns in `organizations`, `documents`, `conversations`, or `messages` without coordinating first.

---

## 4. Final Go-Live "Green Light" Checklist

Before you announce to users, run through these 5 quick checks. Once they pass, you have the **Green Light**:

| # | Check Item | Status | Verification Method |
| :---: | :--- | :---: | :--- |
| **1** | **Vercel Build Passes** | ⬜ | Visit your Vercel deployment URL. Ensure homepage, `/pricing`, `/demo`, and `/contact` render cleanly with zero 500 errors. |
| **2** | **Zero Secrets Leaked** | ⬜ | Inspect your public GitHub repo. Ensure `.env.local` is absent and no API keys appear in commit history. |
| **3** | **Cal.com Modal Works** | ⬜ | Click "Book Architecture Review" on the site. Ensure the Cal.com scheduling popup opens and allows selecting a time. |
| **4** | **Backend Health Check** | ⬜ | In your browser, open `https://<aman-backend-url>/health`. Ensure it returns `{"status": "ok"}`. |
| **5** | **Legal & Footer Complete** | ⬜ | Check `/privacy` and `/terms`. Ensure links resolve and your contact email is visible. |

---

## 5. Summary of What Is Done & What Is Frozen

- ✅ **Website UI & Design:** Complete, hardened, responsive, accessible, and fast.
- ✅ **Cal.com Integration:** Ready and active.
- ✅ **Public Repo Security:** Hardened with `.gitignore` and Vercel-isolated env variables.
- ⏸️ **Hero Section Animation:** Kept as smooth image transitions for V1.
- ⏸️ **Aman’s Dashboard Frontend:** Skipped in favor of our Round 3.1 client portal. Only Aman's FastAPI backend endpoints are connected.

**When you finish Steps 1, 2, and 3 above, tell me and we will do the final verification together!**
