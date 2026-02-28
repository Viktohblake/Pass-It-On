# Pass It On 🔥

**The viral hot potato NFT game on Base L2.**

Mint it. Pass it. Don't let it die.

---

## How It Works

1. **Mint** a hot potato NFT — a 24-hour countdown starts
2. **Pass** it to another wallet before the timer runs out
3. **Compete** for the longest chain on the leaderboard
4. If the timer expires, the NFT is **burned** forever

Every pass resets the 24-hour timer and extends the chain. The longer the chain, the higher you climb on the leaderboard.

---

## Architecture

```
├── contracts/          # Solidity smart contract (ERC-721)
│   └── PassItOn.sol
├── scripts/            # Hardhat deploy script
│   └── deploy.ts
├── test/               # Smart contract tests
│   └── PassItOn.test.ts
├── backend/            # Node.js API server (Express + SQLite)
│   └── server.ts
├── frontend/           # Next.js React app
│   ├── pages/          # App pages
│   ├── components/     # UI components
│   ├── lib/            # Contract config & hooks
│   └── styles/         # Global CSS
└── hardhat.config.ts   # Hardhat configuration
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A wallet with ETH on Base (or Base Sepolia for testing)

### 1. Install Dependencies

```bash
# Root (Hardhat + contracts)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Root — for contract deployment
cp .env.example .env
# Edit .env with your deployer private key and RPC URLs

# Backend
cp backend/.env.example backend/.env
# Edit with your contract address after deployment

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit with your contract address after deployment
```

### 3. Compile & Test the Contract

```bash
# Compile
npm run compile

# Run tests
npm run test
```

### 4. Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:sepolia
```

Copy the deployed contract address and update:
- `backend/.env` → `CONTRACT_ADDRESS`
- `frontend/.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 5. Verify on BaseScan (Optional)

```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS>
```

### 6. Run the Backend

```bash
cd backend
npm run dev
```

The API server starts at `http://localhost:4000`.

### 7. Run the Frontend

```bash
cd frontend
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Deploy to Base Mainnet

```bash
# Make sure .env has your mainnet deployer key and sufficient ETH
npm run deploy:base

# Verify
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

---

## Smart Contract API

| Function | Description |
|----------|-------------|
| `mintNFT(address to)` | Mint a new hot potato NFT |
| `passNFT(address to, uint256 tokenId)` | Pass NFT to another wallet (resets 24h timer) |
| `claimLost(uint256 tokenId)` | Burn an expired NFT |
| `getNFTStatus(uint256 tokenId)` | Get full status: owner, deadline, passes, alive |
| `getLeaderboard()` | Get global records: longest chain, most passes, most participants |
| `totalMinted()` | Total NFTs ever minted |

### Events

| Event | Emitted When |
|-------|-------------|
| `NFTMinted` | New NFT is created |
| `NFTPassed` | NFT is passed to a new holder |
| `NFTLost` | NFT timer expires and is burned |
| `TimerReset` | 24h countdown is reset |

---

## Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/registerUser` | POST | Register wallet + optional email |
| `/leaderboard` | GET | Top chains + recent passes |
| `/nftStatus/:id` | GET | Live NFT status from chain |
| `/notifyPass` | POST | Record a pass + create notifications |
| `/notifications/:wallet` | GET | Get notifications for a wallet |

---

## Viral Mechanics

- **Forced social loop** — You _must_ pass the NFT to keep it alive
- **FOMO countdown** — Pulsing red timer creates urgency
- **Leaderboard** — Compete for longest chain bragging rights
- **Social sharing** — One-click share to X, Telegram, and copy link
- **On-chain proof** — Every pass is permanently recorded

---

## Tech Stack

- **Smart Contract:** Solidity 0.8.20 + OpenZeppelin + Hardhat
- **Backend:** TypeScript + Express + SQLite (better-sqlite3)
- **Frontend:** Next.js + React + ethers.js
- **Chain:** Base L2 (Ethereum Layer 2 by Coinbase)

---

## Security

- ReentrancyGuard on all state-changing functions
- Direct transfers blocked — must use `passNFT()` for proper tracking
- Cannot pass to self or zero address
- Timer checked on every pass attempt
- Address validation on all inputs

---

## License

MIT
