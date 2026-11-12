# Kingdoms API

Fastify API with PostgreSQL-backed player creation, kingdom state, resource collection and building upgrades.

## Run locally

From the repository root:

```bash
docker compose up --build
```

Health check: `http://localhost:4000/health`

Create a starter player:

```bash
curl -X POST http://localhost:4000/v1/players \
  -H 'content-type: application/json' \
  -d '{"displayName":"Commander","kingdomName":"Dawnreach"}'
```

Use the returned `kingdomId` for `GET /v1/kingdoms/:kingdomId`, `POST /v1/kingdoms/:kingdomId/collect` and `POST /v1/kingdoms/:kingdomId/upgrade`.

## Important security status

This is a development API, not production-ready. Player creation and UUID-based kingdom routes do not yet have wallet signature authentication or authorization ownership checks. Do not expose it publicly, connect real wallets, or make reward eligibility depend on this API until SIWE-style nonce/signature verification, session management, ownership authorization, abuse controls and integration tests are implemented. The collection endpoint accrues whole hours from server timestamps and caps accrual at 24 hours.
