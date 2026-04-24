# BloodChain Hospital
## Blockchain-Based Blood Donation System
### Proof of Stake Consensus (Stake-Weighted Validator Agreement)

## Tech Stack
- Frontend: React.js + Vite + Tailwind CSS
- Backend: Node.js + Express.js + MongoDB
- Blockchain: Ethereum + Solidity + Hardhat
- Consensus: Proof of Stake (51/100 stake threshold)
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
Proof of Stake: Each validator has a stake weight (Node 1: 40, Node 2: 35, Node 3: 25 — total: 100).
The highest-stake online validator is selected as the block proposer.
A transaction is finalized when agreeing validators hold ≥ 51/100 stake.
If Node 3 is offline, Nodes 1 and 2 hold 75 stake — consensus still reached.
If Node 1 is offline, Nodes 2 and 3 hold 60 stake — consensus still reached.
If 2 of the top validators are offline, remaining stake falls below 51 — consensus fails.
