# Robinhood Chain Testnet

Use testnet only during MVP development.

| Setting | Value |
| --- | --- |
| Chain name | Robinhood Chain Testnet |
| Chain ID | 46630 |
| Currency | ETH |
| RPC | https://rpc.testnet.chain.robinhood.com |
| Explorer | https://explorer.testnet.chain.robinhood.com |

The public RPC is rate limited. Use a dedicated provider if the project needs reliable CI or production traffic. Never place a deployer private key in source control. Use a dedicated test wallet and protected GitHub Actions secrets.

The MVP must not deploy to mainnet or enable paid minting/reward payouts. Verify marketplace network support before promising OpenSea listing availability.
