# Kingdoms of Eternity

**A 2D isometric strategy-and-build game prototype.** The repository contains a Next.js/Phaser game client, PostgreSQL-backed Fastify API, initial database schema, Solidity contracts, and CI checks.

## Current implementation

- Interactive Phaser isometric map with tile inspection
- Kingdom resource HUD, buildings, upgrades and local preview mode
- API synchronization for starter kingdom, resource collection, upgrades and starter missions when `NEXT_PUBLIC_API_URL` is configured
- PostgreSQL schema for players, wallets, kingdoms, resources, buildings, missions, ledgers and audit events
- Fastify API with validation, transactional updates, idempotency checks, server-timed production and storage caps
- Solidity contracts: capped access NFT, capped KING token, funded Merkle reward distributor and test-only mUSDT mock
- GitHub Actions CI for web lint/build, API compilation and contract tests

## Start locally

Requirements: Node.js 22, pnpm 9.15+, Docker Compose.

```bash
pnpm install
docker compose up --build
```

Then in another terminal:

```bash
pnpm --filter @koe/web dev
```

Create `apps/web/.env.local` from `apps/web/.env.example` so the browser can reach the API at `http://localhost:4000`.

See [Local development](docs/development.md), [Architecture](docs/architecture.md), [Gameplay MVP](docs/gameplay-mvp.md), and [Roadmap](docs/roadmap.md).

## Blockchain

Target network: Robinhood Chain Testnet (chain ID `46630`), gas token ETH. Contract deployment is explicitly testnet-only. See [testnet setup](docs/robinhood-testnet.md) and [contract instructions](contracts/README.md).

## Important launch blockers

This repository is an MVP foundation, **not a production-ready or fully launched game**. Wallet signature authentication and authorization, full gameplay systems (placement, timers, combat, multiplayer), admin tooling, anti-cheat review, full integration testing, deployment infrastructure, independent security audit, final tokenomics and legal review remain outstanding.

The NFT public sale and $10 mint are disabled. The reward contract pays only from tokens already funded into it. The default `mUSDT` is a test mock, not USDT and has no real-world value. No mainnet deployment or real-money payout is enabled.

Never commit private keys, seed phrases, wallet exports, or production secrets. Never use a real wallet key in local development; use a dedicated test wallet and protected CI secrets.
