# Local development

## Requirements

- Node.js 22
- pnpm 9.15+
- Docker Desktop / Docker Engine with Compose

## Start database and API

```bash
docker compose up --build
```

This starts PostgreSQL on 5432, Redis on 6379 and the API on 4000. The SQL schema is mounted into the PostgreSQL initialization directory. If you already have a persistent database volume from an earlier schema version, recreate it only if you are comfortable losing local test data.

## Start the web game

In another terminal:

```bash
pnpm install
pnpm --filter @koe/web dev
```

Create `apps/web/.env.local` from `apps/web/.env.example` if you want the web app to use the API. The API must be reachable from the browser at the configured URL.

## Contracts

```bash
pnpm --filter @koe/contracts test
pnpm --filter @koe/contracts build
```

Testnet deployment is a separate, deliberate action. Use a disposable test wallet and protected secrets. No mainnet deployment command is included.

## Current MVP limitations

- The API has no wallet signature authentication or player ownership authorization yet. Keep it private/local.
- The Phaser map is a first playable map-rendering slice; placement, pathfinding, combat, multiplayer and persistent tile edits are not implemented yet.
- The reward distributor is a generic funded-token distributor. A real stablecoin contract and funded pool must be independently verified; mUSDT is only a test mock.
- NFT public sale, $10 payment flow, OpenSea marketplace availability and mainnet deployment are not enabled.
