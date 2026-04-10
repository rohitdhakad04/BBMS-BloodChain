const { spawn } = require("child_process");
const path = require("path");

console.log("Starting Hardhat Node 1 on port 8545...");
const node1 = spawn("npx", ["hardhat", "node", "--port", "8545"], { stdio: "inherit", shell: true });

console.log("Starting Hardhat Node 2 on port 8546...");
const node2 = spawn("npx", ["hardhat", "node", "--port", "8546"], { stdio: "inherit", shell: true });

console.log("Starting Hardhat Node 3 on port 8547...");
const node3 = spawn("npx", ["hardhat", "node", "--port", "8547"], { stdio: "inherit", shell: true });

process.on("SIGINT", () => {
  node1.kill();
  node2.kill();
  node3.kill();
  process.exit(0);
});
