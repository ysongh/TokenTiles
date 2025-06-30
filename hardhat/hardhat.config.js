require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    baseSepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_APIKEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    },
  },
  paths: {
    artifacts: '../react/src/artifacts',
    cache: '../react/src/cache',
  }
};
