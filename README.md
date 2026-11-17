# Greenwood Public School — Offline Demo Showcase

Self-contained React demo. **No live calls** to `demo.local`. All data comes from `src/demo-data/*.json` via `src/services/demo-router.js`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Demo login

On the login screen use any username and password (example: `demo` / `demo`). Sanctum / live auth is not used.

## Bank Payouts showcase

1. Log in → admin dashboard loads with demo stats.
2. Sidebar → **Actions** → **Bank Payouts** (route: `/bank-payouts`).
3. Try:
   - Day list (School PG, CC Avenue, difference, next payout, payout due, result)
   - Date-gap notes on mismatch days
   - Click a day → student rows, settle date / mode / UTR, Reversed badge
   - **Get daily report** / **Generate Report** (downloads a demo PDF)
   - **Settlement report**, **Class report**
   - **Fees report** → PG breakup, Other sources, wallet receipts collapse, Concession

Demo payment dates: **3 Nov – 8 Nov 2025**.

## How offline mode works

- `DEMO_MODE = true` in `src/services/api.request.js`
- Every `getRequest` / `postRequest` / blob call is routed through `demo-router.js`
- Live Axios base URL is never used while `DEMO_MODE` is true
"# greenwood_public" 
