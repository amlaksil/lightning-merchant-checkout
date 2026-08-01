# Lightning Merchant Checkout

A merchant checkout demo for the Bitcoin + Lightning bootcamp. The project starts from an LND invoice flow and is being refactored into a real checkout experience with persistent sales records, ETB pricing, and Bitcoin Core comparison tooling.

<img width="2654" height="1510" alt="Screenshot from 2026-08-01 21-24-37" src="https://github.com/user-attachments/assets/1e7fe060-ed52-4987-9c34-f3bcbb7c2b1d" />

<img width="2628" height="1438" alt="Screenshot from 2026-08-01 21-24-58" src="https://github.com/user-attachments/assets/83bab75d-93c4-4bc0-a1b2-3987f332280d" />

<img width="2548" height="1436" alt="Screenshot from 2026-08-01 21-26-16" src="https://github.com/user-attachments/assets/9c7305b4-5900-4495-b8c7-283b241fdb9e" />

<img width="1846" height="1414" alt="Screenshot from 2026-08-01 21-26-48" src="https://github.com/user-attachments/assets/5cad7384-7b6e-44f5-9a80-62d21c8ce893" />

## Current Scope

- Merchant-facing Lightning checkout flow
- Bitcoin Core explorer utilities for regtest demos
- Supabase-backed checkout persistence (setup scaffolded in this branch)
- ETB pricing with Coinbase `BTC -> ETB` lookup and manual fallback

## Tech Stack

- Next.js 15
- TypeScript
- LND gRPC
- Bitcoin Core RPC
- Supabase
- Polar (for local Lightning network)

## Local Setup

1. Clone the repository:

```bash
git clone git@github.com:amlaksil/lightning-merchant-checkout.git
cd lightning-merchant-checkout
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

4. Fill in the required values in `.env.local`:
   - LND connection values
   - Bitcoin Core RPC values
   - Supabase project URL and keys
   - optional manual ETB fallback rate

5. Start the development server:

```bash
npm run dev
```

## Supabase Setup

Create a new Supabase project and collect these values from the project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

This branch only scaffolds the client and environment contract. The `checkouts` schema and repository layer will be added in the next implementation step.

## Environment Variables

See `.env.example` for the full list. The important groups are:

- **Lightning**: `LND_RPC_SERVER`, `LND_CERT_PATH`, `LND_MACAROON_PATH`
- **Bitcoin Core**: `NETWORK`, `RPC_HOST`, `RPC_PORT`, `RPC_USER`, `RPC_PASSWORD`, `RPC_WALLET`
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **FX**: `COINBASE_EXCHANGE_RATE_URL`, `MANUAL_ETB_PER_BTC`, `FX_CACHE_TTL_SECONDS`

## Roadmap

- Replace direct invoice endpoints with merchant checkout endpoints
- Persist checkout records in Supabase
- Add ETB pricing and receipt views
- Add recent sales and expiry tracking
- Add an on-chain vs Lightning comparison panel

## Notes

- Lightning settlement is still driven by the existing invoice APIs in this branch.
- Supabase is configured server-side only. Do not expose the service role key to the client.
