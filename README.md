# Lightning Merchant Checkout

A merchant checkout demo for the Bitcoin + Lightning bootcamp. The project starts from an LND invoice flow and is being refactored into a real checkout experience with persistent sales records, ETB pricing, and Bitcoin Core comparison tooling.

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
