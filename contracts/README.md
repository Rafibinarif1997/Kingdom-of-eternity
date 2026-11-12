# Smart contracts

Contracts target Robinhood Chain Testnet only for the initial development cycle.

## Included

- `KingdomAccessNFT`: capped ERC-721 access pass (5,000 max). Public paid mint is intentionally absent; minting is owner-only until marketplace support, pricing, legal review and launch controls are confirmed.
- `KingToken`: capped ERC-20 (1 billion maximum). No supply is minted automatically; allocation and vesting must be finalized before minting.
- `FundedRewardDistributor`: season-based Merkle claims. The contract transfers only its existing token balance; it does not promise returns or mint rewards.
- `MockUSDT`: testnet-only mock stablecoin (mUSDT), never real USDT and never a mainnet asset.

## Test

```bash
pnpm install
pnpm --filter @koe/contracts test
pnpm --filter @koe/contracts build
```

## Testnet deployment

Copy `.env.example` to the local environment or configure protected CI secrets. Use a dedicated test wallet. Set `DEPLOYER_PRIVATE_KEY` and `NFT_METADATA_BASE_URI`, then run. If `REWARD_TOKEN_ADDRESS` is omitted, the script deploys a test-only mUSDT mock. This mock is not real USDT and has no real-world value.

```bash
pnpm --filter @koe/contracts deploy:testnet
```

The script refuses any network other than chain ID 46630. Never commit private keys or seed phrases. No mainnet deployment is provided by this script.

Before mainnet: independent audit, multisig ownership, finalized tokenomics, verified stablecoin selection, funded reward policy, legal review, metadata permanence and marketplace-chain support confirmation are mandatory.
