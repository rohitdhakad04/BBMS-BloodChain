const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "contractConfig.json")));
const { address, abi } = config;

const MNEMONIC = "test test test test test test test test test test test junk";
const baseWallet = ethers.Wallet.fromPhrase(MNEMONIC);

// PoS validator configuration — each node is a validator with a stake weight
const VALIDATORS = [
  { node: 1, url: "http://127.0.0.1:8545", stake: 40 },
  { node: 2, url: "http://127.0.0.1:8546", stake: 35 },
  { node: 3, url: "http://127.0.0.1:8547", stake: 25 },
];
const TOTAL_STAKE = VALIDATORS.reduce((sum, v) => sum + v.stake, 0); // 100
const CONSENSUS_THRESHOLD = Math.floor(TOTAL_STAKE / 2) + 1; // 51 — strict stake majority

const provider1 = new ethers.JsonRpcProvider(VALIDATORS[0].url);
const provider2 = new ethers.JsonRpcProvider(VALIDATORS[1].url);
const provider3 = new ethers.JsonRpcProvider(VALIDATORS[2].url);

const primaryContract = () => {
  const signer = baseWallet.connect(provider1);
  return new ethers.Contract(address, abi, signer);
};

const getContract2 = () => {
  const signer = baseWallet.connect(provider2);
  return new ethers.Contract(address, abi, signer);
};

const getContract3 = () => {
  const signer = baseWallet.connect(provider3);
  return new ethers.Contract(address, abi, signer);
};

const getAllContracts = () => {
  return [primaryContract(), getContract2(), getContract3()];
};

// PoS consensus: the "correct" count is the one backed by the most stake.
// Consensus is reached only when agreeing stake >= CONSENSUS_THRESHOLD.
const checkPoSConsensus = async () => {
  const contracts = getAllContracts();

  const results = await Promise.allSettled(
    contracts.map(c => c.getDonationCount())
  );

  let validatorStates = VALIDATORS.map((v, i) => ({
    ...v,
    count: results[i].status === "fulfilled" ? Number(results[i].value) : -1,
    status: results[i].status === "fulfilled" ? "online" : "offline",
  }));

  const onlineValidators = validatorStates.filter(v => v.count >= 0);

  // Determine the count value with the highest total stake behind it
  const stakeByCount = {};
  for (const v of onlineValidators) {
    stakeByCount[v.count] = (stakeByCount[v.count] || 0) + v.stake;
  }

  let majorityCount = -1;
  let maxStake = 0;
  for (const [count, stake] of Object.entries(stakeByCount)) {
    if (stake > maxStake) {
      maxStake = stake;
      majorityCount = Number(count);
    }
  }

  const agreeingValidators = validatorStates.filter(
    v => v.count === majorityCount && v.status === "online"
  );
  const agreeingStake = agreeingValidators.reduce((sum, v) => sum + v.stake, 0);
  const consensusReached = agreeingStake >= CONSENSUS_THRESHOLD;

  // Proposer = highest-stake agreeing validator (deterministic selection)
  const proposer =
    agreeingValidators.length > 0
      ? agreeingValidators.reduce((best, v) => (v.stake > best.stake ? v : best))
      : null;

  validatorStates = validatorStates.map(v => ({
    ...v,
    agrees: v.count === majorityCount && v.status === "online",
  }));

  return {
    counts: validatorStates,
    majorityCount,
    consensusReached,
    agreeingStake,
    totalStake: TOTAL_STAKE,
    consensusThreshold: CONSENSUS_THRESHOLD,
    agreeingNodes: agreeingValidators.map(v => v.node),
    failedNodes: validatorStates.filter(v => !v.agrees).map(v => v.node),
    proposer: proposer ? proposer.node : null,
  };
};

// Alias kept so other modules that import checkMajorityConsensus keep working
const checkMajorityConsensus = checkPoSConsensus;

const getHealthyContract = async () => {
  const result = await checkPoSConsensus();
  if (!result.consensusReached) {
    throw new Error("No PoS consensus reached between validators");
  }
  const nodeIndex = result.agreeingNodes[0] - 1;
  const contracts = getAllContracts();
  return contracts[nodeIndex];
};

const checkAllNodes = async () => {
  return await checkPoSConsensus();
};

module.exports = {
  getAllContracts,
  checkMajorityConsensus,
  checkPoSConsensus,
  getHealthyContract,
  checkAllNodes,
  VALIDATORS,
  TOTAL_STAKE,
  CONSENSUS_THRESHOLD,
};
