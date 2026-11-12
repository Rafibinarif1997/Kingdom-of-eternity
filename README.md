# Kingdoms of Eternity

A server-authoritative 2D isometric strategy-and-build game with optional on-chain ownership and rewards.

## Product decisions

- Game: strategy & build, 2D isometric presentation
- Chain: Robinhood Chain (EVM)
- Initial network: Robinhood Chain Testnet
- NFT collection target: 5,000 game-access NFTs
- Planned mint price: USD 10 equivalent (not enabled in this MVP)
- Token: KING (tokenomics and deployment require separate approval)
- NFT marketplace target: OpenSea, subject to its support for Robinhood Chain at launch
- Release sequence: playable MVP first, NFT launch later

## MVP principles

1. Gameplay and progression work without requiring a wallet.
2. The backend is authoritative for resources, timers, battles, missions and rewards.
3. NFT ownership gates game access only after a verified contract is configured.
4. Rewards are paid only from a funded, disclosed pool. No guaranteed yield or reward from future mint proceeds.
5. No mainnet deployment, paid mint, or real-token payout is enabled by default.

## Planned stack

- Web client: Next.js, TypeScript, Phaser
- API: Node.js / TypeScript
- Database: PostgreSQL
- Cache and jobs: Redis
- Contracts: Solidity, OpenZeppelin, Foundry
- Wallet integration: wagmi / viem

## Repository status

This repository is being initialized on the `main` branch. The first milestone is a playable local MVP, followed by testnet integration and security review.

## Development

The repository will receive app, API, contract, schema, and deployment work in staged commits. See [Architecture](docs/architecture.md) and [Roadmap](docs/roadmap.md).

## Security

Never commit private keys, seed phrases, production credentials, or real user secrets. Use environment variables and GitHub Actions secrets. Use a dedicated test wallet on testnet. All contracts and reward flows require review before mainnet use.
