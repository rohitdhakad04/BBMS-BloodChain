const express = require("express");
const { ethers } = require("ethers");
const { verifyToken } = require("../middleware/auth");
const {
  getAllContracts,
  checkPoSConsensus,
  getHealthyContract,
  checkAllNodes,
  VALIDATORS,
  TOTAL_STAKE,
  CONSENSUS_THRESHOLD,
} = require("../utils/contract");
const contractConfig = require("../utils/contractConfig.json");

const router = express.Router();

router.use(verifyToken);

router.post("/donate", async (req, res) => {
  const { donorName, bloodGroup, dateTime, location, hospitalName } = req.body;
  if (!donorName || !bloodGroup || !dateTime || !location || !hospitalName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check which validators are currently online
  const contracts = getAllContracts();
  const onlineChecks = await Promise.allSettled(
    contracts.map(c => c.getDonationCount())
  );
  const validatorStatus = VALIDATORS.map((v, i) => ({
    ...v,
    online: onlineChecks[i].status === "fulfilled",
    contract: contracts[i],
  }));

  const onlineValidators = validatorStatus.filter(v => v.online);
  if (onlineValidators.length === 0) {
    return res.status(500).json({ error: "All validators offline. Transaction rejected." });
  }

  // PoS: select proposer = highest-stake online validator
  const proposer = onlineValidators.reduce((best, v) => (v.stake > best.stake ? v : best));

  // Submit: proposer first, then attesters, then mark offline nodes as skipped
  const orderedValidators = [
    proposer,
    ...onlineValidators.filter(v => v.node !== proposer.node),
    ...validatorStatus.filter(v => !v.online),
  ];

  const nodeResults = [];
  const receipts = [];

  for (const v of orderedValidators) {
    if (!v.online) {
      nodeResults.push({ node: v.node, status: "offline", stake: v.stake, isProposer: false });
      receipts.push({ node: v.node, receipt: null });
      continue;
    }
    try {
      const tx = await v.contract.addDonation(donorName, bloodGroup, dateTime, location, hospitalName);
      const receipt = await tx.wait();
      nodeResults.push({
        node: v.node,
        status: "success",
        txHash: receipt.hash,
        stake: v.stake,
        isProposer: v.node === proposer.node,
      });
      receipts.push({ node: v.node, receipt });
    } catch (e) {
      nodeResults.push({ node: v.node, status: "failed", error: e.message, stake: v.stake, isProposer: false });
      receipts.push({ node: v.node, receipt: null });
    }
  }

  // Sort results back to natural node order for the response
  nodeResults.sort((a, b) => a.node - b.node);

  const successResults = nodeResults.filter(r => r.status === "success");
  const agreeingStake = successResults.reduce((sum, r) => sum + r.stake, 0);

  if (successResults.length === 0) {
    return res.status(500).json({ error: "All validators failed. Transaction rejected.", nodeResults });
  }

  if (agreeingStake < CONSENSUS_THRESHOLD) {
    return res.status(500).json({
      error: `PoS consensus failed. Only ${agreeingStake}/${TOTAL_STAKE} stake validated. Transaction rejected.`,
      nodeResults,
      consensusReached: false,
      agreeingStake,
      totalStake: TOTAL_STAKE,
      consensusThreshold: CONSENSUS_THRESHOLD,
    });
  }

  // Use the proposer's receipt (or first available) to extract event data
  const proposerEntry = receipts.find(r => r.node === proposer.node && r.receipt);
  const firstSuccessReceipt = (proposerEntry || receipts.find(r => r.receipt)).receipt;

  const iface = new ethers.Interface(contractConfig.abi);
  let donationId = null;
  let blockHash = null;

  for (const log of firstSuccessReceipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "DonationAdded") {
        donationId = parsed.args.id.toString();
        blockHash = ethers.hexlify(parsed.args.blockHash);
        break;
      }
    } catch (e) {
      // not this log
    }
  }

  return res.status(201).json({
    success: true,
    consensusReached: true,
    message: `PoS consensus reached — ${agreeingStake}/${TOTAL_STAKE} stake validated`,
    transactionHash: firstSuccessReceipt.hash,
    blockHash,
    donationId,
    nodeResults,
    approvedBy: successResults.map(r => "Node" + r.node),
    proposer: proposer.node,
    agreeingStake,
    totalStake: TOTAL_STAKE,
  });
});

router.get("/", async (req, res) => {
  try {
    const contract = await getHealthyContract();
    const raw = await contract.getAllDonations();
    const donations = raw.map(d => ({
      id: d.id.toString(),
      donorName: d.donorName,
      bloodGroup: d.bloodGroup,
      dateTime: d.dateTime,
      location: d.location,
      hospitalName: d.hospitalName,
      donatedBy: d.donatedBy,
      timestamp: d.timestamp.toString(),
      blockHash: ethers.hexlify(d.blockHash)
    }));
    const consensus = await checkPoSConsensus();
    return res.status(200).json({
      donations,
      count: donations.length,
      consensus: {
        reached: consensus.consensusReached,
        agreeingNodes: consensus.agreeingNodes,
        agreeingStake: consensus.agreeingStake,
        totalStake: consensus.totalStake,
      }
    });
  } catch (err) {
    return res.status(503).json({ error: "No PoS consensus between validators. Data unreliable." });
  }
});

router.get("/search", async (req, res) => {
  const bloodGroup = decodeURIComponent(req.query.bloodGroup || "");
  if (!bloodGroup) {
    return res.status(400).json({ error: "bloodGroup query param required" });
  }
  try {
    const contract = await getHealthyContract();
    const raw = await contract.getDonationsByBloodGroup(bloodGroup);
    const donations = raw.map(d => ({
      id: d.id.toString(),
      donorName: d.donorName,
      bloodGroup: d.bloodGroup,
      dateTime: d.dateTime,
      location: d.location,
      hospitalName: d.hospitalName,
      donatedBy: d.donatedBy,
      timestamp: d.timestamp.toString(),
      blockHash: ethers.hexlify(d.blockHash)
    }));
    return res.status(200).json({ donations, count: donations.length, bloodGroup });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/nodes", async (req, res) => {
  try {
    const result = await checkAllNodes();
    const { counts, majorityCount, consensusReached, agreeingNodes, failedNodes, agreeingStake, totalStake, consensusThreshold, proposer } = result;
    return res.status(200).json({
      nodes: counts.map(c => ({
        id: c.node,
        url: c.url,
        status: c.status,
        stake: c.stake,
        donationCount: c.count >= 0 ? c.count : "unavailable",
        agrees: c.agrees,
        isProposer: c.node === proposer,
      })),
      consensus: {
        reached: consensusReached,
        majorityCount,
        agreeingNodes,
        failedNodes,
        agreeingStake,
        totalStake,
        consensusThreshold,
        proposer,
        algorithm: "Proof of Stake (Stake-Weighted Consensus)",
        message: consensusReached
          ? `${agreeingStake}/${totalStake} stake in agreement`
          : "Insufficient stake — consensus not reached"
      },
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  try {
    const contract = await getHealthyContract();
    const d = await contract.getDonationById(id);
    const donation = {
      id: d.id.toString(),
      donorName: d.donorName,
      bloodGroup: d.bloodGroup,
      dateTime: d.dateTime,
      location: d.location,
      hospitalName: d.hospitalName,
      donatedBy: d.donatedBy,
      timestamp: d.timestamp.toString(),
      blockHash: ethers.hexlify(d.blockHash)
    };
    return res.status(200).json({ donation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
