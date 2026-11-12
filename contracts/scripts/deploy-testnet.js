const hre = require("hardhat");

async function main() {
  if (hre.network.config.chainId !== 46630) {
    throw new Error("Refusing deployment: only Robinhood Chain Testnet (46630) is allowed by this script.");
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in the deployment environment.");
  const owner = await deployer.getAddress();
  const metadataBaseURI = process.env.NFT_METADATA_BASE_URI;
  if (!metadataBaseURI) throw new Error("Set NFT_METADATA_BASE_URI to a reviewed metadata endpoint.");

  const nft = await hre.ethers.deployContract("KingdomAccessNFT", [owner, metadataBaseURI]);
  await nft.waitForDeployment();
  const token = await hre.ethers.deployContract("KingToken", [owner]);
  await token.waitForDeployment();
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;\n  if (!rewardTokenAddress || !hre.ethers.isAddress(rewardTokenAddress)) throw new Error("Set REWARD_TOKEN_ADDRESS to a verified testnet reward token. Do not assume a USDT contract address.");\n  const distributor = await hre.ethers.deployContract("FundedRewardDistributor", [owner, rewardTokenAddress]);
  await distributor.waitForDeployment();

  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: 46630,
    deployer: owner,
    kingdomAccessNFT: await nft.getAddress(),
    kingToken: await token.getAddress(),
    fundedRewardDistributor: await distributor.getAddress()
  }, null, 2));
  console.log("No token supply was minted and no rewards were funded. Review tokenomics and contracts before use.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
