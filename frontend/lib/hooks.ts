/**
 * Custom React hooks for wallet connection and contract interaction.
 */

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BASE_CHAIN_ID,
} from "./contract";

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────
export interface NFTStatus {
  tokenId: number;
  owner: string;
  deadline: number;
  passCount: number;
  chainLength: number;
  alive: boolean;
  timeRemaining: number;
}

export interface LeaderboardData {
  longestChain: { tokenId: number; length: number };
  mostPasses: { tokenId: number; count: number };
  mostParticipants: { tokenId: number; count: number };
}

// ──────────────────────────────────────────────
//  useWallet — Privy-powered wallet hook
//  Supports email sign-in (embedded wallet) + external wallets.
//  No auto-popup on mount.
// ──────────────────────────────────────────────
export function useWallet() {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive signer from the active Privy wallet
  useEffect(() => {
    if (!authenticated || wallets.length === 0) {
      setAccount(null);
      setSigner(null);
      setChainId(null);
      return;
    }

    const activeWallet = wallets[0];
    setAccount(activeWallet.address);

    async function setupSigner() {
      try {
        const activeWallet = wallets[0];
        // Switch to Base if needed
        await activeWallet.switchChain(BASE_CHAIN_ID);

        const ethereumProvider = await activeWallet.getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const s = await provider.getSigner();
        const net = await provider.getNetwork();

        setSigner(s);
        setChainId(Number(net.chainId));
      } catch (err: any) {
        setError(err?.message || "Failed to get wallet signer");
      }
    }

    setupSigner();
  }, [authenticated, wallets]);

  const connect = useCallback(() => {
    setError(null);
    login();
  }, [login]);

  const disconnect = useCallback(async () => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
    await logout();
  }, [logout]);

  const connecting = !ready;
  const isBase = chainId === BASE_CHAIN_ID;

  return {
    account,
    chainId,
    isBase,
    signer,
    connecting,
    error,
    connect,
    disconnect,
  };
}

// ──────────────────────────────────────────────
//  useContract — read/write helpers
// ──────────────────────────────────────────────
export function useContract(signer: ethers.Signer | null) {
  const getReadContract = useCallback(() => {
    if (!CONTRACT_ADDRESS) return null;
    const rpcProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rpcProvider);
  }, []);

  const getWriteContract = useCallback(() => {
    if (!signer || !CONTRACT_ADDRESS) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [signer]);

  // Mint a new NFT
  const mint = useCallback(
    async (to: string) => {
      const c = getWriteContract();
      if (!c) throw new Error("Contract not available");
      const tx = await c.mintNFT(to);
      const receipt = await tx.wait();
      // Parse the NFTMinted event to get tokenId
      const iface = new ethers.Interface(CONTRACT_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === "NFTMinted") {
            return Number(parsed.args[0]);
          }
        } catch {
          // skip non-matching logs
        }
      }
      return 0;
    },
    [getWriteContract]
  );

  // Pass NFT to another address
  const pass = useCallback(
    async (to: string, tokenId: number) => {
      const c = getWriteContract();
      if (!c) throw new Error("Contract not available");
      const tx = await c.passNFT(to, tokenId);
      await tx.wait();
    },
    [getWriteContract]
  );

  // Get NFT status
  const getStatus = useCallback(
    async (tokenId: number): Promise<NFTStatus | null> => {
      const c = getReadContract();
      if (!c) return null;
      try {
        const [owner, deadline, passCount, chainLength, alive, timeRemaining] =
          await c.getNFTStatus(tokenId);
        return {
          tokenId,
          owner,
          deadline: Number(deadline),
          passCount: Number(passCount),
          chainLength: Number(chainLength),
          alive,
          timeRemaining: Number(timeRemaining),
        };
      } catch {
        return null;
      }
    },
    [getReadContract]
  );

  // Get leaderboard
  const getLeaderboard = useCallback(async (): Promise<LeaderboardData | null> => {
    const c = getReadContract();
    if (!c) return null;
    try {
      const [lt, ll, mt, mc, pt, pc] = await c.getLeaderboard();
      return {
        longestChain: { tokenId: Number(lt), length: Number(ll) },
        mostPasses: { tokenId: Number(mt), count: Number(mc) },
        mostParticipants: { tokenId: Number(pt), count: Number(pc) },
      };
    } catch {
      return null;
    }
  }, [getReadContract]);

  // Get total minted
  const getTotalMinted = useCallback(async (): Promise<number> => {
    const c = getReadContract();
    if (!c) return 0;
    try {
      return Number(await c.totalMinted());
    } catch {
      return 0;
    }
  }, [getReadContract]);

  // Claim lost (burn expired NFT)
  const claimLost = useCallback(
    async (tokenId: number) => {
      const c = getWriteContract();
      if (!c) throw new Error("Contract not available");
      const tx = await c.claimLost(tokenId);
      await tx.wait();
    },
    [getWriteContract]
  );

  return { mint, pass, getStatus, getLeaderboard, getTotalMinted, claimLost, getReadContract };
}

// ──────────────────────────────────────────────
//  useCountdown — live countdown from a deadline
//  Enhanced with critical state and urgency messages
// ──────────────────────────────────────────────
export type Urgency = "safe" | "warning" | "danger" | "critical";

export function useCountdown(deadline: number | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!deadline) return;

    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, deadline - now));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatted = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const urgency: Urgency =
    timeLeft > 6 * 3600
      ? "safe"
      : timeLeft > 3600
        ? "warning"
        : timeLeft > 600
          ? "danger"
          : "critical";

  const urgencyMessage =
    urgency === "safe"
      ? "The Chain is Stable"
      : urgency === "warning"
        ? "The Chain is Unstable"
        : "The Chain is About to Break";

  const urgencyColor =
    urgency === "safe"
      ? "#10b981"
      : urgency === "warning"
        ? "#f59e0b"
        : "#ef4444";

  const progress = Math.min(1, timeLeft / 86400);

  return {
    timeLeft,
    hours,
    minutes,
    seconds,
    formatted,
    urgency,
    urgencyMessage,
    urgencyColor,
    progress,
  };
}
