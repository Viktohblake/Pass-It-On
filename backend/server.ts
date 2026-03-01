/**
 * Pass It On — Backend API Server
 *
 * Provides off-chain leaderboard caching, user registration,
 * NFT status proxying, and notification triggers.
 *
 * Stack: Express + SQLite (better-sqlite3) + TypeScript
 */

import express, { Request, Response } from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ──────────────────────────────────────────────
//  Config
// ──────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const DB_PATH = process.env.DB_PATH || "./passitOn.db";

// Minimal ABI — only the functions/events we need
const CONTRACT_ABI = [
  "function getNFTStatus(uint256 tokenId) view returns (address owner, uint64 deadline, uint32 passCount, uint32 chainLength, bool alive, uint256 timeRemaining)",
  "function getLeaderboard() view returns (uint256, uint32, uint256, uint32, uint256, uint32)",
  "function totalMinted() view returns (uint256)",
  "event NFTMinted(uint256 indexed tokenId, address indexed to, uint64 deadline)",
  "event NFTPassed(uint256 indexed tokenId, address indexed from, address indexed to, uint32 passCount, uint32 chainLength, uint64 newDeadline)",
  "event NFTLost(uint256 indexed tokenId, address indexed lastHolder, uint32 finalPassCount, uint32 finalChainLength)",
];

// ──────────────────────────────────────────────
//  Database setup (SQLite)
// ──────────────────────────────────────────────
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    wallet TEXT PRIMARY KEY,
    email  TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS passes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id    INTEGER NOT NULL,
    from_wallet TEXT NOT NULL,
    to_wallet   TEXT NOT NULL,
    pass_count  INTEGER NOT NULL,
    chain_length INTEGER NOT NULL,
    deadline    INTEGER NOT NULL,
    timestamp   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet     TEXT NOT NULL,
    token_id   INTEGER NOT NULL,
    type       TEXT NOT NULL,
    message    TEXT NOT NULL,
    read       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_passes_token ON passes(token_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet);
`);

// Prepared statements for performance
const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (wallet, email) VALUES (?, ?)"
);
const insertPass = db.prepare(
  "INSERT INTO passes (token_id, from_wallet, to_wallet, pass_count, chain_length, deadline) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertNotification = db.prepare(
  "INSERT INTO notifications (wallet, token_id, type, message) VALUES (?, ?, ?, ?)"
);
const getTopChains = db.prepare(
  "SELECT token_id, MAX(chain_length) as chain_length, COUNT(*) as total_passes FROM passes GROUP BY token_id ORDER BY chain_length DESC LIMIT 20"
);
const getRecentPasses = db.prepare(
  "SELECT * FROM passes ORDER BY id DESC LIMIT 20"
);

// ──────────────────────────────────────────────
//  Provider + Contract
// ──────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = CONTRACT_ADDRESS
  ? new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  : null;

// ──────────────────────────────────────────────
//  Express app
// ──────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", contract: CONTRACT_ADDRESS || "not configured" });
});

/**
 * POST /registerUser
 * Associates a wallet address with an optional email for notifications.
 */
app.post("/registerUser", (req: Request, res: Response) => {
  const { wallet, email } = req.body;

  if (!wallet || typeof wallet !== "string") {
    res.status(400).json({ error: "wallet is required" });
    return;
  }

  // Validate wallet address format
  if (!ethers.isAddress(wallet)) {
    res.status(400).json({ error: "Invalid wallet address" });
    return;
  }

  try {
    insertUser.run(wallet.toLowerCase(), email || null);
    res.json({ success: true, wallet: wallet.toLowerCase() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /leaderboard
 * Returns both on-chain global records and off-chain pass history.
 */
app.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    // Off-chain cached data (always available)
    const topChains = getTopChains.all();
    const recentPasses = getRecentPasses.all();

    // On-chain data (if contract configured)
    let onChain = null;
    if (contract) {
      const [
        longestChainTokenId,
        longestChainLength,
        mostPassesTokenId,
        mostPassesCount,
        mostParticipantsTokenId,
        mostParticipantsCount,
      ] = await contract.getLeaderboard();

      onChain = {
        longestChain: {
          tokenId: Number(longestChainTokenId),
          length: Number(longestChainLength),
        },
        mostPasses: {
          tokenId: Number(mostPassesTokenId),
          count: Number(mostPassesCount),
        },
        mostParticipants: {
          tokenId: Number(mostParticipantsTokenId),
          count: Number(mostParticipantsCount),
        },
      };
    }

    res.json({ onChain, topChains, recentPasses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /nftStatus/:id
 * Returns real-time NFT status from the blockchain.
 */
app.get("/nftStatus/:id", async (req: Request, res: Response) => {
  const tokenId = Number(req.params.id);

  if (isNaN(tokenId) || tokenId < 0) {
    res.status(400).json({ error: "Invalid token ID" });
    return;
  }

  if (!contract) {
    res.status(503).json({ error: "Contract not configured" });
    return;
  }

  try {
    const [owner, deadline, passCount, chainLength, alive, timeRemaining] =
      await contract.getNFTStatus(tokenId);

    res.json({
      tokenId,
      owner,
      deadline: Number(deadline),
      passCount: Number(passCount),
      chainLength: Number(chainLength),
      alive,
      timeRemaining: Number(timeRemaining),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /notifyPass
 * Records a pass event and creates notifications for relevant parties.
 */
app.post("/notifyPass", (req: Request, res: Response) => {
  const { tokenId, from, to, passCount, chainLength, deadline } = req.body;

  if (!tokenId && tokenId !== 0) {
    res.status(400).json({ error: "tokenId is required" });
    return;
  }

  try {
    // Store pass record
    insertPass.run(
      tokenId,
      (from || "").toLowerCase(),
      (to || "").toLowerCase(),
      passCount || 0,
      chainLength || 0,
      deadline || 0
    );

    // Create notification for recipient
    if (to) {
      insertNotification.run(
        to.toLowerCase(),
        tokenId,
        "received",
        `You received NFT #${tokenId}! You have 24 hours to pass it on. Chain length: ${chainLength}`
      );
    }

    // Create notification for sender (confirmation)
    if (from) {
      insertNotification.run(
        from.toLowerCase(),
        tokenId,
        "passed",
        `You passed NFT #${tokenId} to ${to}. The chain continues!`
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /notifications/:wallet
 * Returns unread notifications for a wallet.
 */
app.get("/notifications/:wallet", (req: Request, res: Response) => {
  const wallet = (req.params.wallet as string)?.toLowerCase();

  if (!wallet || !ethers.isAddress(wallet)) {
    res.status(400).json({ error: "Invalid wallet address" });
    return;
  }

  try {
    const notifications = db
      .prepare(
        "SELECT * FROM notifications WHERE wallet = ? ORDER BY id DESC LIMIT 50"
      )
      .all(wallet);

    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
//  On-chain event listener (polls blocks instead of using filters)
// ──────────────────────────────────────────────
const POLL_INTERVAL_MS = 15_000; // 15 seconds (≈ Base block time × a few blocks)

function startEventListener() {
  if (!contract) {
    console.log("⚠️  No contract address configured — skipping event listener");
    return;
  }

  console.log("📡 Listening for on-chain events (polling)...");

  let lastBlock = -1;

  async function poll() {
    try {
      const currentBlock = await provider.getBlockNumber();

      if (lastBlock < 0) {
        // On first poll, only look at the current block onward
        lastBlock = currentBlock;
        return;
      }

      if (currentBlock <= lastBlock) return;

      const from = lastBlock + 1;
      const to = currentBlock;
      lastBlock = currentBlock;

      // Query all three event types in parallel
      const [passedEvents, mintedEvents, lostEvents] = await Promise.all([
        contract.queryFilter("NFTPassed", from, to),
        contract.queryFilter("NFTMinted", from, to),
        contract.queryFilter("NFTLost", from, to),
      ]);

      for (const ev of mintedEvents) {
        const { tokenId, to: recipient, deadline } = (ev as ethers.EventLog).args as any;
        console.log(`🆕 NFT #${tokenId} minted to ${recipient}`);
      }

      for (const ev of passedEvents) {
        const { tokenId, from: sender, to: recipient, passCount, chainLength, newDeadline } =
          (ev as ethers.EventLog).args as any;
        console.log(
          `🔄 NFT #${tokenId} passed from ${sender} → ${recipient} (chain: ${chainLength})`
        );

        insertPass.run(
          Number(tokenId),
          sender.toLowerCase(),
          recipient.toLowerCase(),
          Number(passCount),
          Number(chainLength),
          Number(newDeadline)
        );
      }

      for (const ev of lostEvents) {
        const { tokenId, lastHolder, finalPassCount, finalChainLength } =
          (ev as ethers.EventLog).args as any;
        console.log(
          `💀 NFT #${tokenId} lost! Last holder: ${lastHolder}, passes: ${finalPassCount}, chain: ${finalChainLength}`
        );

        insertNotification.run(
          lastHolder.toLowerCase(),
          Number(tokenId),
          "lost",
          `NFT #${tokenId} expired! Final chain length: ${finalChainLength}, total passes: ${finalPassCount}`
        );
      }
    } catch (err) {
      console.error("Event poll error:", err);
    }
  }

  // Initial poll, then repeat on interval
  poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

// ──────────────────────────────────────────────
//  Start server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Pass It On backend running on http://localhost:${PORT}`);
  startEventListener();
});

export default app;
