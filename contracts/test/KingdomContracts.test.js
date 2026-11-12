const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Kingdoms of Eternity contracts", function () {
  async function deployAll() {
    const [owner, player, other] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("KingdomAccessNFT");
    const nft = await NFT.deploy(owner.address, "ipfs://test/");
    const Token = await ethers.getContractFactory("KingToken");
    const token = await Token.deploy(owner.address);
    const Distributor = await ethers.getContractFactory("FundedRewardDistributor");
    const distributor = await Distributor.deploy(owner.address, await token.getAddress());
    return { owner, player, other, nft, token, distributor };
  }

  it("mints access passes only through owner and enforces the cap", async function () {
    const { owner, player, nft } = await deployAll();
    await expect(nft.connect(player).mintAccessPass(player.address)).to.be.reverted;
    await nft.mintAccessPass(player.address);
    expect(await nft.ownerOf(1)).to.equal(player.address);
    expect(await nft.totalMinted()).to.equal(1n);
    await nft.pause();
    await expect(nft.mintAccessPass(player.address)).to.be.reverted;
  });

  it("caps KING token supply and restricts minting to owner", async function () {
    const { player, token } = await deployAll();
    await expect(token.connect(player).mint(player.address, 1n)).to.be.reverted;
    await token.mint(player.address, ethers.parseEther("1000"));
    expect(await token.balanceOf(player.address)).to.equal(ethers.parseEther("1000"));
    await token.pause();
    await expect(token.connect(player).transfer(await token.getAddress(), 1n)).to.be.reverted;
  });

  it("pays a valid funded Merkle claim once", async function () {
    const { owner, player, token, distributor } = await deployAll();
    const season = 1n;
    const amount = ethers.parseEther("25");
    const leaf = Buffer.from(ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"], [season, player.address, amount]
    ).slice(2), "hex");
    const tree = new MerkleTree([leaf], keccak256, { sortPairs: true });
    const root = "0x" + tree.getRoot().toString("hex");
    await token.mint(owner.address, ethers.parseEther("100"));
    await token.transfer(await distributor.getAddress(), ethers.parseEther("100"));
    await distributor.setSeasonRoot(season, root);
    const proof = tree.getHexProof(leaf);
    await distributor.connect(player).claim(season, amount, proof);
    expect(await token.balanceOf(player.address)).to.equal(amount);
    await expect(distributor.connect(player).claim(season, amount, proof)).to.be.reverted;
  });

  it("rejects a claim that is not in the published Merkle root", async function () {
    const { owner, player, other, token, distributor } = await deployAll();
    const season = 2n;
    const amount = ethers.parseEther("5");
    const leaf = Buffer.from(ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"], [season, player.address, amount]
    ).slice(2), "hex");
    const tree = new MerkleTree([leaf], keccak256, { sortPairs: true });
    await token.mint(owner.address, ethers.parseEther("10"));
    await token.transfer(await distributor.getAddress(), ethers.parseEther("10"));
    await distributor.setSeasonRoot(season, "0x" + tree.getRoot().toString("hex"));
    await expect(distributor.connect(other).claim(season, amount, tree.getHexProof(leaf))).to.be.reverted;
  });
});
