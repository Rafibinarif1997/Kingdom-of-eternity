# Gameplay MVP Specification

## First session

1. A player creates a profile and receives one starter kingdom.
2. The kingdom starts with a level-one Castle, Farm, Lumber Mill and Stone Mine.
3. The player sees Wood, Stone, Food and Iron balances and production rates.
4. The player collects accrued production.
5. The player spends resources to upgrade a building.
6. The server validates affordability, grid placement, upgrade limits and timing, then commits the resource ledger and building update in one database transaction.
7. A starter mission tracks the first upgrade and grants in-game progression.

## Initial buildings

| Building | Primary function |
| --- | --- |
| Castle | Kingdom level and progression gate |
| Farm | Food production |
| Lumber Mill | Wood production |
| Stone Mine | Stone production |
| Iron Mine | Iron production |
| Storage | Resource capacity |
| Barracks | Future army training |

## Production model

Production is calculated from server timestamps and building levels. Clients never submit a claimed resource total. The server computes elapsed production, applies storage caps, and writes an idempotent ledger entry. Collection endpoints must use an idempotency key and a transaction/row lock to prevent double collection.

## Prototype boundary

The current web screen is a UI prototype with local-only state. It is not yet connected to the SQL schema or authoritative API. Do not treat its balances, upgrades, or displayed power as persistent or reward-eligible.
