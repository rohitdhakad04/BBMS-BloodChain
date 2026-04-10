# BloodChain Hospital
## Blockchain-Based Blood Donation System
### Simple Majority Voting Consensus (2/3 Byzantine Fault Tolerance)

## Tech Stack
- Frontend: React.js + Vite + Tailwind CSS
- Backend: Node.js + Express.js + MongoDB
- Blockchain: Ethereum + Solidity + Hardhat
- Consensus: Simple Majority Vote (2 of 3 nodes)
- Library: ethers.js v6

## Prerequisites
- Node.js v18 or higher
- MongoDB running on localhost:27017
- 5 terminal windows

## Setup

### Terminal 1 — Blockchain Node 1 (Primary)
cd blockchain
npm install
npx hardhat node --port 8545

### Terminal 2 — Blockchain Node 2 (Replica)
cd blockchain
npx hardhat node --port 8546

### Terminal 3 — Blockchain Node 3 (Replica)
cd blockchain
npx hardhat node --port 8547

Wait until all 3 show: "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:PORT"

### Terminal 4 — Deploy Smart Contract to All 3 Nodes
cd blockchain
npx hardhat run scripts/deploy.js --network node1
npx hardhat run scripts/deploy.js --network node2
npx hardhat run scripts/deploy.js --network node3

You should see "Contract deployed to: 0x..." three times.

### Terminal 4 — Start Backend
cd backend
npm install
npm run dev

### Terminal 5 — Start Frontend
cd frontend
npm install
npm run dev

### Open App
http://localhost:5173

## How to Use
1. Register — create your hospital account
2. Login — enter your credentials
3. Donate Blood tab — fill form → submit → see tx hash + consensus result
4. Check Availability tab — select blood group → search donors
5. Donor List tab — view all blockchain records
6. Node Status tab — monitor all 3 nodes + consensus live

## Consensus Algorithm
Simple Majority Vote: 2 out of 3 nodes must accept a transaction.
If Node 3 is offline, Nodes 1 and 2 still reach majority (2/3).
If 2 nodes are offline, consensus fails and transaction is rejected.
