# PredMarket — MFT Farewell Prediction Market

A real-time prediction market web app built with **Next.js + Supabase**, styled like Polymarket.

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router), Tailwind CSS, Syne + JetBrains Mono fonts
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Hosting**: Vercel
- **Auth**: Custom username/password (no Supabase Auth — users table)

---

## Quick Setup

### 1. Run Supabase SQL Seed

Go to your Supabase project → **SQL Editor** and run the contents of `supabase_seed.sql`.

This will:
- Insert all 28 markets (one per person)
- Insert all 28 users with `₹10,00,000` starting balance
- Disable RLS so all reads/writes work with the anon key

### 2. Enable Supabase Realtime

In Supabase → **Database → Replication**, make sure these tables have realtime enabled:
- `markets`
- `trades`
- `users`

### 3. Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Login

- **Username**: Any name from the list (e.g. `Abhishek Mandot`, `Anmol`, `Raj`)
- **Password**: `MFT` (same for everyone)

---

## How It Works

### Market Mechanics
- Every market starts at YES = ₹700 (70%), NO = ₹300 (30%)
- YES + NO always = ₹1000
- Buying YES pushes the YES price up
- Buying NO pushes the YES price down
- Prices clamped between ₹10 and ₹990

### Price Formula
```js
// Buying YES: price moves toward 990
newYes = currentYes + (1000 - currentYes) * impact

// Buying NO: price moves toward 10
newYes = currentYes - currentYes * impact

// impact = min(amount / 50000, 0.15)  → max 15% move per trade
```

### Realtime
- All users subscribed to `markets` table via Supabase Realtime
- Price bar, percentage displays flash green/red on update
- Trade feed on individual market pages updates live

---

## Project Structure

```
predmarket/
├── pages/
│   ├── index.js          → redirect to /login or /markets
│   ├── login.js          → login page
│   ├── markets.js        → markets listing with realtime
│   ├── portfolio.js      → user trades + leaderboard
│   └── market/[id].js   → individual market trading page
├── components/
│   ├── Navbar.js         → top nav with live balance
│   ├── MarketCard.js     → card with flash animations
│   └── TradeModal.js     → buy YES/NO modal
├── lib/
│   ├── supabase.js       → supabase client
│   ├── auth.js           → auth context + login logic
│   └── markets.js        → price calc + formatting
├── styles/
│   └── globals.css       → tailwind + custom animations
├── supabase_seed.sql     → run once in Supabase SQL editor
└── vercel.json           → deployment config
```

---

## Features

- ✅ Real-time price updates for all connected users
- ✅ Flash animations on price changes (green = up, red = down)
- ✅ Quick-buy amounts (₹1K, ₹5K, ₹10K, ₹50K, ₹1L, MAX)
- ✅ Trade preview (shares received, new price, balance after)
- ✅ Live activity feed per market
- ✅ Leaderboard by balance
- ✅ Ticker tape on login screen
- ✅ Price history log per market session
- ✅ Mobile responsive

---

## Supabase Setup Notes

If markets/users already exist, the seed uses `ON CONFLICT DO NOTHING` to avoid duplicates.

Make sure RLS is **disabled** or policies allow anon reads/writes. The seed script runs:
```sql
ALTER TABLE markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```
