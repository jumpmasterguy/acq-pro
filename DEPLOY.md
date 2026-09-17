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
STRIPE_PRICE_ID_LIFETIME=price_...     ← $99 one-time price ID
STRIPE_PRICE_ID_MONTHLY=price_...      ← $5.99/mo recurring price ID
STRIPE_PRICE_ID_TEAM=price_...         ← $399 one-time (Team Pack)
STRIPE_PRICE_PACK_PM_ESSENTIALS=price_...    ← $24
STRIPE_PRICE_PACK_PROPOSAL_TOOLKIT=price_... ← $34
STRIPE_PRICE_PACK_CPARS_PLAYBOOK=price_...   ← $34

# On every boot the server looks each STRIPE_PRICE_* ID up in Stripe and checks it is
# active and charges the amount above (table: server/stripeHealth.ts). Mismatches are
# printed in a loud banner in the Railway logs AND emailed to ADMIN_EMAILS via Resend.
# Any checkout route that returns 500 also emails ADMIN_EMAILS (max one per route / 15 min).
ADMIN_EMAILS=you@example.com           ← where the alerts go
RESEND_API_KEY=re_...                  ← needed for the alert emails

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

**Product 3: Acqlerate Team Pack**
- Name: "Acqlerate Team Pack — 10 Seats"
- Price: $399.00 USD, one-time
- Copy the `price_...` ID → set as `STRIPE_PRICE_ID_TEAM` in Railway variables
- Note: seats are currently provisioned by hand — see `sendTeamPurchaseAdminAlert` in
  `server/email.ts`. The admin (ADMIN_EMAILS) gets an email on every purchase with the
  buyer's info; there's no self-serve seat invite flow yet. That's the next build once
  this converts a few real customers.

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

---

## Native builds (iOS + Android via Capacitor)

The web app is wrapped by Capacitor. `capacitor.config.ts` points the native
shells at the Railway backend, so a native build serves the deployed web app
rather than a bundled copy — but the web assets still have to be copied in.

### One-time setup on a new Mac

**1. Accept the Xcode licence.** This needs your password and cannot be done
for you. Nothing else below works until it's run — it blocks `xcodebuild`,
`simctl`, CocoaPods *and* Homebrew:

```bash
sudo xcodebuild -license accept
```

**2. Android toolchain** (not needed for iOS). This is the combination that
actually works — `brew install --cask temurin` needs an admin password, and
plain `brew install openjdk` gives you JDK 26, which Gradle 8.14 rejects:

```bash
brew install openjdk@21
brew install --cask android-commandlinetools

export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

sdkmanager --sdk_root="$ANDROID_HOME" --licenses          # accept Google's SDK licences
sdkmanager --sdk_root="$ANDROID_HOME" "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

Put those four exports in your shell profile so they survive new terminals.

### Every build

```bash
npm run build && npx cap sync
```

`sync` copies `dist/public` into both platforms and installs native
dependencies. Then:

```bash
npx cap open ios       # opens Xcode    — run on a simulator or device
npx cap open android   # opens Android Studio
```

Or straight from the command line:

```bash
# iOS simulator
cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build

# Android debug APK → android/app/build/outputs/apk/debug/app-debug.apk
cd android && ./gradlew assembleDebug
```

### Testing a native build against a local server

`server.url` points the native shells at Railway, so a native build always
shows the *deployed* site — bundled assets are never used, and `API_BASE` is
empty so relative `/api` calls only resolve against that origin. To test
local changes on a device, temporarily point it at your machine:

```ts
server: { url: 'http://localhost:5050/app', cleartext: true },
ios: { limitsNavigationsToAppBoundDomains: false, ... }
```

and run the server with `LOCAL_HTTP=1` so the CSP doesn't force every asset
to https. Revert all three before committing.

### Notes

- Keep `@capacitor/cli`, `core`, `ios` and `android` on the same major
  version. They drifted once (CLI on 7, everything else on 8), which makes
  `cap sync` unsupported.
- **No prices or purchase actions may appear in a native build** (App Store
  guideline 3.1.1). This is enforced by `isNativeApp()` in
  `client/src/lib/platform.ts`; the native Pro access screen explains
  upgrading on acqlerate.com instead. Re-check this after any change to
  `UpgradePage.tsx`.
- Google OAuth does not complete inside an embedded webview
  (`disallowed_useragent`). "Continue with Google" needs a native
  social-login plugin or a system-browser handoff before it works on device.
- `ios.contentInset` must stay `'never'`. On `'automatic'` WKWebView adds its
  own safe-area inset on top of the CSS `env()` ones, which leaves a blank
  strip under the status bar and an uncovered home-indicator area.
- Because `server.url` is the site root, the native app opens the marketing
  landing page, not the academy at `/app`. Worth deciding deliberately.
