require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 300 }, viaIR: true }
  },
  networks: {
    hardhat: { chainId: 31337 },
    robinhoodTestnet: {
      url: process.env.RH_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com",
      chainId: 46630,
      accounts
    }
  },
  paths: { sources: "./src", tests: "./test", cache: "./cache", artifacts: "./artifacts" }
};
