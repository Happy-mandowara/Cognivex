# 🚀 MediKiosk — Render Deployment Guide

MediKiosk is pre-configured for **1-Click Deployment on [Render](https://render.com)** using Render Blueprints (`render.yaml`).

---

## 🏗️ Architecture on Render

```
   +-------------------------------------------------------------+
   |                      RENDER CLOUD                           |
   |                                                             |
   |   [ medikiosk-frontend ]             [ medikiosk-backend ]  |
   |   Type: Static Site                  Type: Web Service      |
   |   Vite + React (Free CDN)            FastAPI (Python 3.12)  |
   |   https://<frontend>.onrender.com    https://<backend>.onrender.com
   |            |                                  |             |
   |            +-------- (API Requests) --------->+             |
   |                                                             v
   |                                                   [ medikiosk-db ]
   |                                                   PostgreSQL 16
   +-------------------------------------------------------------+
```

---

## ⚡ Option 1: 1-Click Deploy via Render Blueprint (Recommended)

### Step 1: Push Code to your GitHub

Open PowerShell in this directory (`thisIsArchitecture`) and push to your GitHub account:

```powershell
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "feat: complete MediKiosk with Render blueprint configuration"

# 2. Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/medikiosk.git

# 3. Push main branch
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. In the top navbar, click **New +** → select **Blueprint**.
3. Connect your GitHub repository (`medikiosk`).
4. Render will automatically read [`render.yaml`](render.yaml) and discover the 3 services:
   - **`medikiosk-backend`** (Python Web Service)
   - **`medikiosk-frontend`** (Static Site with SPA rewrite rules)
   - **`medikiosk-db`** (PostgreSQL 16 Managed Database)
5. Click **Apply**.
6. Render will automatically provision the database, build the backend, build the frontend, and link `VITE_API_URL` dynamically!

---

## 🛠️ Option 2: Manual Setup via Render Dashboard

If you prefer configuring services individually through the Render GUI:

### 1. Database (`medikiosk-db`)
- Click **New +** → **PostgreSQL**
- Name: `medikiosk-db`
- Database: `medikiosk`
- User: `medikiosk_user`
- Plan: **Free**
- Copy the **Internal Database URL** once created.

### 2. Backend Web Service (`medikiosk-backend`)
- Click **New +** → **Web Service**
- Connect your GitHub repository.
- **Root Directory**: leave blank (or `.`)
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: **Free**
- Add **Environment Variables**:
  - `PYTHON_VERSION`: `3.12.0`
  - `PYTHONPATH`: `.`
  - `BACKEND_CORS_ORIGINS`: `*`
  - `DATABASE_URL`: paste your PostgreSQL Internal URL (e.g. `postgresql://...`)
  - `REDIS_URL`: leave empty (uses in-memory fallback)
  - `ABDM_GATEWAY_URL`: `https://dev.abdm.gov.in/gateway`
- **Health Check Path**: `/api/health`
- Click **Create Web Service**.
- Note the backend URL (e.g. `https://medikiosk-backend.onrender.com`).

### 3. Frontend Static Site (`medikiosk-frontend`)
- Click **New +** → **Static Site**
- Connect your GitHub repository.
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- Add **Environment Variable**:
  - `VITE_API_URL`: `https://medikiosk-backend.onrender.com` (your backend URL)
- Under **Redirects / Rewrites**:
  - Add Rule: `/*` → `/index.html` (Rewrite)
- Click **Create Static Site**.

---

## 🔑 Pre-Seeded Accounts

Once deployed, the backend automatically seeds all demonstration accounts:

| Role | Email | Password | Primary Workflow |
|---|---|---|---|
| **Patient** | `patient@medikiosk.demo` | `Patient!123` | Bilingual Kiosk Intake, Vitals, Ashtavidha, Consent |
| **Doctor** | `doctor@medikiosk.demo` | `Doctor!123` | OPD Queue, Case Sheet, SOAP verification, Rx Builder, FHIR |
| **Admin** | `admin@medikiosk.demo` | `Admin!123` | System Health, User Management, Audit Logs |

---

## 🧪 Post-Deployment Verification Checklist

1. **Backend Health Check**:
   Visit `https://<your-backend>.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "HEALTHY",
     "project": "MediKiosk Clinical SaaS",
     "version": "1.0.0",
     "database": "CONNECTED",
     "abdm_gateway": "ONLINE (NRCES FHIR R4)",
     "ayush_engine": "READY (Prakriti + Kent/Boericke + NAMASTE-ICD)"
   }
   ```
2. **Interactive Swagger Docs**:
   Visit `https://<your-backend>.onrender.com/docs`
3. **Frontend Application**:
   Visit `https://<your-frontend>.onrender.com`
   - Log in as Doctor (`doctor@medikiosk.demo` / `Doctor!123`)
   - Verify live OPD Queue, SOAP generation, and Ayush Tridosha radar.
