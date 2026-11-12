# Roadmap and delivery status

## Phase 1 — playable MVP foundation

- [x] Web app shell and responsive game layout
- [x] Isometric map rendering, tile inspection and camera zoom
- [x] Starter kingdom creation and server-owned kingdom state
- [x] Resource balances and server-timed production collection
- [x] Building placement API, upgrade costs and resource ledger
- [x] Starter mission tracking
- [x] PostgreSQL schema and starter mission seed data
- [x] API input validation, transactions, rate limiting and idempotency checks
- [x] Solidity contracts and contract unit tests added
- [x] GitHub Actions CI workflow added

## Phase 1 — remaining before calling the MVP complete

- [ ] Wallet signature authentication and player/kingdom ownership authorization
- [ ] Connect selected Phaser tiles to persistent building placement
- [ ] Construction and upgrade timers
- [ ] Resource production display derived from live building levels
- [ ] API integration tests with PostgreSQL and adversarial/idempotency cases
- [ ] End-to-end browser tests on desktop and mobile
- [ ] Admin moderation and audit review UI
- [ ] Deploy API/database and configure the web app environment
- [ ] Confirm CI run is green and resolve any build/test errors

## Phase 2 — multiplayer and economy hardening

- [ ] Server-authoritative combat and army training
- [ ] Leaderboards and seasonal scoring
- [ ] Anti-abuse, bot/sybil detection and reward eligibility controls
- [ ] Alliances, multiplayer events and admin operations

## Phase 3 — Robinhood Chain testnet

- [x] Document current testnet chain configuration
- [x] Add NFT, KING and funded reward contracts
- [x] Add a test-only mUSDT mock for testnet experimentation
- [ ] Compile and execute contract tests in CI
- [ ] Deploy and verify contracts using a dedicated test wallet
- [ ] Wallet connection and on-chain NFT ownership gating
- [ ] Test funded reward claims with test assets only

## Phase 4 — launch readiness

- [ ] Confirm OpenSea support for Robinhood Chain at launch time
- [ ] Finalize tokenomics, vesting and legal review
- [ ] Verify the intended mainnet stablecoin and contract address
- [ ] Independent smart-contract and application security review
- [ ] Multisig ownership, funded reward policy and incident procedures
- [ ] Explicit approval before any mainnet deployment, paid mint or real-token payout

## Release policy

No real-money mint, guaranteed yield, or unfunded reward promise. Testnet assets have no real-world value. Mainnet is out of scope until every launch blocker is reviewed and explicitly approved.
