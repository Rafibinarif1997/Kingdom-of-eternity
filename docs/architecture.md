# Architecture

## Trust boundaries

The browser renders the game and submits player intent. It is not trusted to calculate authoritative resource balances, build completion, combat outcomes, leaderboard scores, or reward eligibility.

The API validates every action, applies game rules transactionally, persists state in PostgreSQL, and emits events for background processing. Redis is used for short-lived cache, rate limiting, and job coordination; it is not the source of truth.

## Planned components

- `apps/web`: Next.js shell, wallet connection, game UI and Phaser scene
- `services/api`: authenticated game API and server-side game rules
- `packages/game-rules`: deterministic shared types and rules where safe
- `packages/db`: schema and database access
- `contracts`: KING ERC-20, game-access NFT and funded reward distributor
- `docs`: specifications, threat model and operations

## Core data domains

Players and linked wallets; NFT ownership snapshots; kingdoms; buildings and upgrades; resource ledgers; missions; armies and battles; reward seasons and funded allocations; claims; moderation and audit events.

## On-chain boundaries

The game must remain playable in local development without deployed contracts. Chain reads are verified against configured contract addresses and chain ID. No contract address is assumed. Testnet configuration is explicit and separate from production.

Reward claims must be backed by a funded pool, signed claims must include chain/domain separation and replay protection, and admin actions must be role-gated and auditable.
