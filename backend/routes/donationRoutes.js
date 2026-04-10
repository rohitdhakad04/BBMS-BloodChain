const express = require("express");
const { ethers } = require("ethers");
const { verifyToken } = require("../middleware/auth");
const { getAllContracts, checkMajorityConsensus, getHealthyContract, checkAllNodes } = require("../utils/contract");
const contractConfig = require("../utils/contractConfig.json");

const router = express.Router();

router.use(verifyToken);

router.post("/donate", async (req, res) => {
  const { donorName, bloodGroup, dateTime, location, hospitalName } = req.body;
  if (!donorName || !bloodGroup || !dateTime || !location || !hospitalName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const contracts = await getAllContracts();
  const nodeResults = [];
  const receipts = [];

  for (let i = 0; i < contracts.length; i++) {
    try {
      const tx = await contracts[i].addDonation(donorName, bloodGroup, dateTime, location, hospitalName);
      const receipt = await tx.wait();
      nodeResults.push({ node: i + 1, status: "success", txHash: receipt.hash });
      receipts.push({ node: i + 1, receipt });
    } catch (e) {
      nodeResults.push({ node: i + 1, status: "failed", error: e.message });
      receipts.push({ node: i + 1, receipt: null });
    }
  }

  const successResults = nodeResults.filter(r => r.status === "success");
  const successCount = successResults.length;

  if (successCount === 0) {
    return res.status(500).json({ error: "All nodes failed. Transaction rejected.", nodeResults });
  }

  if (successCount < 2) {
    return res.status(500).json({
      error: "Consensus failed. Only " + successCount + "/3 nodes accepted. Transaction rejected.",
      nodeResults,
      consensusReached: false
    });
  }

  const firstSuccessNode = successResults[0].node;
  const firstReceiptEntry = receipts.find(r => r.node === firstSuccessNode);
  const firstSuccessReceipt = firstReceiptEntry.receipt;

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
    message: successCount + "/3 nodes reached majority consensus",
    transactionHash: firstSuccessReceipt.hash,
    blockHash,
    donationId,
    nodeResults,
    approvedBy: successResults.map(r => "Node" + r.node)
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
    const consensus = await checkMajorityConsensus();
    return res.status(200).json({
      donations,
      count: donations.length,
      consensus: { reached: consensus.consensusReached, agreeingNodes: consensus.agreeingNodes }
    });
  } catch (err) {
    return res.status(503).json({ error: "No consensus between nodes. Data unreliable." });
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
    const { counts, majorityCount, consensusReached, agreeingNodes, failedNodes } = result;
    return res.status(200).json({
      nodes: counts.map(c => ({
        id: c.node,
        url: c.url,
        status: c.status,
        donationCount: c.count >= 0 ? c.count : "unavailable",
        agrees: c.agrees
      })),
      consensus: {
        reached: consensusReached,
        majorityCount,
        agreeingNodes,
        failedNodes,
        algorithm: "Simple Majority Vote (2 of 3)",
        message: consensusReached
          ? agreeingNodes.length + "/3 nodes in agreement"
          : "No majority reached — system in inconsistent state"
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
