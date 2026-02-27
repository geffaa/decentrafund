# DecentraFund — Decentralized Crowdfunding Platform

> Full-Stack Blockchain Developer Portfolio Project

**DecentraFund** is a decentralized crowdfunding platform built on Ethereum that enables transparent, milestone-based fund management. Campaign creators set milestones, backers vote on progress, and smart contracts handle fund release and refunds automatically.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)
![Vue 3](https://img.shields.io/badge/Vue-3.4-green)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

### Smart Contracts (Solidity)
- **Factory Pattern** — Deploy individual campaign contracts via `CampaignFactory`
- **Milestone-Based Fund Release** — Funds released in stages based on backer voting
- **Weighted Voting** — Vote power proportional to contribution amount
- **Automatic Refunds** — Backers can request refunds if campaign fails or deadline passes
- **Security** — ReentrancyGuard, Pausable, access control (OpenZeppelin)
- **ERC-20 Governance Token** — DFUND token minted per contribution for voting

### Backend (Node.js + Express)
- **REST API** with filtering, sorting, pagination
- **Wallet Authentication** — Sign-In with Ethereum (SIWE)
- **Blockchain Event Listener** — Real-time sync of on-chain events to PostgreSQL
- **IPFS Integration** — Decentralized file storage via Pinata
- **WebSocket** — Real-time updates to connected clients

### Frontend (Vue 3 + Vite)
- **Wallet Integration** — MetaMask connect, network switching, transaction signing
- **6 Pages** — Home, Explore, Campaign Detail, Create, Dashboard, Analytics
- **Premium Dark Theme** — Glassmorphism, gradients, skeleton loading, micro-animations
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Demo Mode** — Works with demo data even without backend connection

---

## 🏗 Architecture

```
decentrafund/
├── packages/
│   ├── contracts/          # Solidity + Hardhat
│   │   ├── contracts/
│   │   │   ├── Campaign.sol           # Core campaign logic
│   │   │   ├── CampaignFactory.sol    # Factory deployer
│   │   │   └── DecentraToken.sol      # ERC-20 governance token
│   │   ├── scripts/deploy.js
│   │   └── test/DecentraFund.test.js
│   ├── backend/            # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── controllers/    # auth, campaigns, users, ipfs, analytics
│   │   │   ├── routes/
│   │   │   └── listeners/      # Blockchain event listener
│   │   └── prisma/schema.prisma
│   └── frontend/           # Vue 3 + Vite + Pinia
│       └── src/
│           ├── components/     # NavBar, CampaignCard, Footer
│           ├── views/          # 6 pages
│           ├── stores/         # web3, campaigns (Pinia)
│           └── assets/main.css # Design system
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MetaMask browser extension
- Alchemy account (free) — [alchemy.com](https://alchemy.com)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/decentrafund.git
cd decentrafund
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your keys (Alchemy, Pinata, MetaMask private key)
```

### 3. Database Setup

```bash
cd packages/backend
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 4. Compile & Test Smart Contracts

```bash
cd packages/contracts
npx hardhat compile
npx hardhat test
cd ../..
```

### 5. Deploy Contracts to Sepolia

```bash
cd packages/contracts
npx hardhat run scripts/deploy.js --network sepolia
# Copy the CampaignFactory address to .env as VITE_CONTRACT_FACTORY_ADDRESS
cd ../..
```

### 6. Run Development Servers

```bash
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run frontend:dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

```bash
# Smart Contract Tests (12 tests)
cd packages/contracts && npx hardhat test

# With gas reporting
REPORT_GAS=true npx hardhat test
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Reentrancy Protection | OpenZeppelin `ReentrancyGuard` |
| Emergency Pause | OpenZeppelin `Pausable` |
| Access Control | Custom modifiers (`onlyCreator`, `onlyBacker`) |
| Weighted Voting | Vote power = contribution amount |
| Fund Safety | Milestone-based release, not lump sum |
| Signature Auth | Sign-In with Ethereum (SIWE) |

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Frontend | Vue 3, Vite, Pinia, ethers.js 6 |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Blockchain | Ethereum Sepolia Testnet |
| Storage | IPFS via Pinata |
| Auth | Sign-In with Ethereum |

---

## 📄 License

MIT License — Built as a portfolio project.
