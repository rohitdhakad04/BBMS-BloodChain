require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    node1: { url: "http://127.0.0.1:8545", chainId: 31337, accounts: { mnemonic: "test test test test test test test test test test test junk" } },
    node2: { url: "http://127.0.0.1:8546", chainId: 31337, accounts: { mnemonic: "test test test test test test test test test test test junk" } },
    node3: { url: "http://127.0.0.1:8547", chainId: 31337, accounts: { mnemonic: "test test test test test test test test test test test junk" } }
  }
}
