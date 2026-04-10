const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "contractConfig.json")));
const { address, abi } = config;

const provider1 = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const provider2 = new ethers.JsonRpcProvider("http://127.0.0.1:8546");
const provider3 = new ethers.JsonRpcProvider("http://127.0.0.1:8547");

const primaryContract = async () => {
  const signer = await provider1.getSigner(0);
  return new ethers.Contract(address, abi, signer);
};

const getContract2 = async () => {
  const signer = await provider2.getSigner(0);
  return new ethers.Contract(address, abi, signer);
};

const getContract3 = async () => {
  const signer = await provider3.getSigner(0);
  return new ethers.Contract(address, abi, signer);
};

const getAllContracts = async () => {
  const [c1, c2, c3] = await Promise.all([primaryContract(), getContract2(), getContract3()]);
  return [c1, c2, c3];
};

const checkMajorityConsensus = async () => {
  const primaryContractInstance = await primaryContract();

  const [c2, c3] = await Promise.all([getContract2(), getContract3()]);
  const results = await Promise.allSettled([
    primaryContractInstance.getDonationCount(),
    c2.getDonationCount(),
    c3.getDonationCount()
  ]);

  let counts = results.map((r, i) => ({
    node: i + 1,
    url: ["http://127.0.0.1:8545", "http://127.0.0.1:8546", "http://127.0.0.1:8547"][i],
    count: r.status === "fulfilled" ? Number(r.value) : -1,
    status: r.status === "fulfilled" ? "online" : "offline"
  }));

  const onlineCounts = counts.filter(c => c.count >= 0).map(c => c.count);

  let majorityCount = -1;
  let consensusReached = false;

  const frequency = {};
  for (const val of onlineCounts) {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] >= 2) {
      majorityCount = val;
      consensusReached = true;
      break;
    }
  }

  counts = counts.map(c => ({ ...c, agrees: c.count === majorityCount }));

  return {
    counts,
    majorityCount,
    consensusReached,
    agreeingNodes: counts.filter(c => c.agrees).map(c => c.node),
    failedNodes: counts.filter(c => !c.agrees || c.status === "offline").map(c => c.node)
  };
};

const getHealthyContract = async () => {
  const result = await checkMajorityConsensus();
  if (!result.consensusReached) {
    throw new Error("No majority consensus reached between nodes");
  }
  const nodeIndex = result.agreeingNodes[0] - 1;
  const contracts = await getAllContracts();
  return contracts[nodeIndex];
};

const checkAllNodes = async () => {
  const result = await checkMajorityConsensus();
  return result;
};

module.exports = { getAllContracts, checkMajorityConsensus, getHealthyContract, checkAllNodes };
