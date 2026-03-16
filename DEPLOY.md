# AcqPro — Railway Deployment Guide

## Overview

AcqPro runs as a full-stack Node.js app:
- **Frontend:** React + Vite (built to `dist/public/`, served as static files by Express)
- **Backend:** Express.js on port 5000
- **Sessions:** In-memory (memorystore) — persists across requests, resets on restart
- **Payments:** Stripe Checkout + webhooks

---

## Step 1 — Push to GitHub

```bash
cd /path/to/acq-pro

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit — AcqPro with auth + Stripe"

# Create a new repo on GitHub (github.com → New repository → "acq-pro")
git remote add origin https://github.com/YOUR_USERNAME/acq-pro.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `acq-pro` repo
4. Railway will auto-detect the `railway.toml` and build/start commands

---

## Step 3 — Set Environment Variables

In Railway → your project → **Variables**, add:

```
SESSION_SECRET=30946563cb7fe5481d1b4dcf79250a43657fe6c66de64c7522ead00fae11f6d66097bdc5454f9fe1acfb8dcbc73deafd

STRIPE_SECRET_KEY=sk_live_...          ← from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        ← after creating webhook (Step 4)
STRIPE_PRICE_ID_LIFETIME=price_...     ← $149 one-time price ID
STRIPE_PRICE_ID_MONTHLY=price_...      ← $29/mo recurring price ID

APP_URL=https://YOUR-APP.up.railway.app  ← your Railway URL (shown after first deploy)
NODE_ENV=production
PORT=5000
```

---

## Step 4 — Create Stripe Products & Webhook

### Products (in Stripe Dashboard → Products → Add product):

**Product 1: AcqPro Pro — Lifetime**
- Name: "AcqPro Pro — Lifetime Access"
- Price: $149.00 USD, one-time
- Copy the `price_...` ID → set as `STRIPE_PRICE_ID_LIFETIME`

**Product 2: AcqPro Pro — Monthly**
- Name: "AcqPro Pro — Monthly"
- Price: $29.00 USD/month, recurring
- Copy the `price_...` ID → set as `STRIPE_PRICE_ID_MONTHLY`

### Webhook (Stripe Dashboard → Developers → Webhooks → Add endpoint):

- **Endpoint URL:** `https://YOUR-APP.up.railway.app/api/stripe/webhook`
- **Events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.deleted`
- Copy the **Signing secret** (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Update APP_URL

After your first Railway deploy:
1. Copy your Railway URL (e.g. `https://acq-pro-production.up.railway.app`)
2. Set `APP_URL` in Railway variables to that URL
3. Railway will auto-redeploy

---

## Step 6 — Update Perplexity Deployment

After Railway is live, rebuild and redeploy the static frontend:

```bash
npm run build
# Then redeploy via Perplexity Computer
```

---

## Architecture Notes

- **Sessions are in-memory.** User accounts persist as long as the Railway service is running. When Railway restarts the service (e.g. after a new deploy), users need to log back in — their accounts are still there (in memory), but sessions are cleared.
- **For production at scale:** Add a PostgreSQL database (Railway can provision one) and migrate MemStorage to a real DB. The schema is already Drizzle-ready.
- **Custom domain:** In Railway → Settings → Networking → Add custom domain. Point your GoDaddy DNS CNAME to `cname.railway.app`.

---

## Test Stripe Integration

Use Stripe test mode keys first:
- `sk_test_...` instead of `sk_live_...`
- Test card: `4242 4242 4242 4242`, any future date, any CVC
- Switch to live keys when ready to charge real customers
