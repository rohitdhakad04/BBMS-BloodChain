const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const BloodDonation = await hre.ethers.getContractFactory("BloodDonation");
  const contract = await BloodDonation.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const artifact = await hre.artifacts.readArtifact("BloodDonation");
  const abi = artifact.abi;

  const backendPath = path.join(__dirname, "../../backend/utils");
  const frontendPath = path.join(__dirname, "../../frontend/src/contracts");

  fs.mkdirSync(backendPath, { recursive: true });
  fs.mkdirSync(frontendPath, { recursive: true });

  fs.writeFileSync(
    path.join(backendPath, "contractConfig.json"),
    JSON.stringify({ address, abi })
  );

  fs.writeFileSync(
    path.join(frontendPath, "BloodDonation.json"),
    JSON.stringify({ address, abi })
  );

  console.log("Contract deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("Config written to backend and frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
