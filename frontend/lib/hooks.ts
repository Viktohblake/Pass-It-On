/**
 * Custom React hooks for wallet connection and contract interaction.
 */

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BASE_CHAIN_ID,
  BASE_NETWORK,
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
//  useWallet — connects to MetaMask / Coinbase / injected
// ──────────────────────────────────────────────
export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] =
    useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);

      // Listen for account / chain changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      // Check existing connection
      p.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          p.getSigner().then(setSigner);
        }
      });

      p.getNetwork().then((net) => setChainId(Number(net.chainId)));
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Install MetaMask or Coinbase Wallet.");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const net = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(Number(net.chainId));

      // Switch to Base if not already on it
      if (Number(net.chainId) !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_NETWORK.chainId }],
          });
        } catch (switchErr: any) {
          // Chain not added — add it
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [BASE_NETWORK],
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
  }, []);

  const isBase = chainId === BASE_CHAIN_ID;

  return {
    account,
    chainId,
    isBase,
    provider,
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
// ──────────────────────────────────────────────
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

  const urgency: "safe" | "warning" | "danger" =
    timeLeft > 6 * 3600 ? "safe" : timeLeft > 1 * 3600 ? "warning" : "danger";

  return { timeLeft, hours, minutes, seconds, formatted, urgency };
}
