const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenTilesModule", (m) => {
  const token20 = m.contract("TileTokenERC20", []);
  const token1155 = m.contract("TokenTilesERC1155", []);

  const tokenTiles = m.contract("TokenTilesGame", [
    token1155,
    token20
  ]);

  const setGameContract = m.call(
    token20,
    "setGameContract",
    [tokenTiles]
  );

  return {
    token20,
    token1155,
    tokenTiles,
    setGameContract
  };
});