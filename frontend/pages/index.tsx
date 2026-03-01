/**
 * Pass It On — Arena Experience
 *
 * Immersive single-page arena flow:
 *   1. Connect Wallet (immersive landing)
 *   2. Arena: Mint or view your NFT with energy orb
 *   3. Leaderboard: Slide-in glassmorphism panel
 *
 * All state is driven by on-chain data with live countdown timers.
 */

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useContract, NFTStatus } from "../lib/hooks";
import { API_URL } from "../lib/contract";
import ArenaBackground from "../components/ArenaBackground";
import WalletConnect from "../components/WalletConnect";
import NFTStatusComponent from "../components/NFTStatus";
import PassModal from "../components/PassModal";
import Leaderboard from "../components/Leaderboard";

export default function Home() {
  const {
    account,
    isBase,
    signer,
    connecting,
    error: walletError,
    connect,
    disconnect,
  } = useWallet();

  const { mint, pass, getStatus, getTotalMinted, claimLost } =
    useContract(signer);

  // ── State ──
  const [nftStatus, setNftStatus] = useState<NFTStatus | null>(null);
  const [myTokenId, setMyTokenId] = useState<number | null>(null);
  const [totalMinted, setTotalMinted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Find user's active NFT ──
  const findMyNFT = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const total = await getTotalMinted();
      setTotalMinted(total);

      for (let i = total - 1; i >= 0; i--) {
        const status = await getStatus(i);
        if (
          status &&
          status.alive &&
          status.owner.toLowerCase() === account.toLowerCase()
        ) {
          setNftStatus(status);
          setMyTokenId(i);
          setLoading(false);
          return;
        }
      }

      setNftStatus(null);
      setMyTokenId(null);
    } catch {
      // Contract may not be deployed yet
    } finally {
      setLoading(false);
    }
  }, [account, getStatus, getTotalMinted]);

  useEffect(() => {
    if (account) findMyNFT();
  }, [account, findMyNFT]);

  // ── Refresh NFT status every 30s ──
  useEffect(() => {
    if (myTokenId === null) return;
    const interval = setInterval(async () => {
      const status = await getStatus(myTokenId);
      if (status) setNftStatus(status);
    }, 30000);
    return () => clearInterval(interval);
  }, [myTokenId, getStatus]);

  // ── Mint handler ──
  const handleMint = async () => {
    if (!account) return;
    setMinting(true);
    setError(null);
    try {
      const tokenId = await mint(account);
      showToast(`Chain #${tokenId} ignited! You have 24 hours.`);
      setMyTokenId(tokenId);
      const status = await getStatus(tokenId);
      if (status) setNftStatus(status);
    } catch (err: any) {
      setError(err?.reason || err?.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  };

  // ── Pass handler ──
  const handlePass = async (to: string, tokenId: number) => {
    await pass(to, tokenId);

    try {
      await fetch(`${API_URL}/notifyPass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          from: account,
          to,
          passCount: (nftStatus?.passCount || 0) + 1,
          chainLength: (nftStatus?.chainLength || 0) + 1,
          deadline: Math.floor(Date.now() / 1000) + 86400,
        }),
      });
    } catch {
      // Backend notification is best-effort
    }

    showToast("Chain passed! You survived.");
    setNftStatus(null);
    setMyTokenId(null);
  };

  // ── Claim lost handler ──
  const handleClaimLost = async () => {
    if (myTokenId === null) return;
    try {
      await claimLost(myTokenId);
      showToast("Chain burned. Ignite a new one!");
      setNftStatus(null);
      setMyTokenId(null);
    } catch (err: any) {
      setError(err?.reason || err?.message || "Claim failed");
    }
  };

  // ── Render ──
  return (
    <>
      <Head>
        <title>Pass It On | Hot Potato NFT Arena on Base</title>
        <meta
          name="description"
          content="The viral hot potato NFT arena on Base. Mint it. Pass it. Don't let it die."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Pass It On | Hot Potato NFT Arena" />
        <meta
          property="og:description"
          content="Mint a hot potato NFT and pass it before the 24h timer runs out!"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Arena background — always visible */}
      <ArenaBackground />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="arena-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-surface rounded-xl px-5 py-3 text-sm font-semibold text-slate-200">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          {/* Not connected — show landing */}
          {!account && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WalletConnect
                onConnect={connect}
                connecting={connecting}
                error={walletError}
              />
            </motion.div>
          )}

          {/* Connected — show arena */}
          {account && (
            <motion.div
              key="arena"
              className="px-4 py-6 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Arena Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1
                    className="text-xl font-black tracking-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6, #06b6d4)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Pass It On
                  </h1>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    {account.slice(0, 6)}...{account.slice(-4)}
                    {!isBase && (
                      <span className="text-amber-500 ml-2">
                        (Switch to Base)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Leaderboard toggle */}
                  <motion.button
                    className="glass-light rounded-xl w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 border-0 transition-colors"
                    onClick={() => setShowLeaderboard(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Leaderboard"
                  >
                    <span className="text-lg">{"🏆"}</span>
                  </motion.button>

                  {/* Disconnect */}
                  <motion.button
                    className="glass-light rounded-xl px-3 h-10 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-300 border-0 transition-colors"
                    onClick={disconnect}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Disconnect
                  </motion.button>
                </div>
              </div>

              {/* Arena Content */}
              <AnimatePresence mode="wait">
                {/* Loading state */}
                {loading && (
                  <motion.div
                    key="loading"
                    className="flex flex-col items-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Scanning orb animation */}
                    <motion.div
                      className="w-40 h-40 rounded-full mb-6"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                        border: "1px solid rgba(59,130,246,0.15)",
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        borderColor: [
                          "rgba(59,130,246,0.15)",
                          "rgba(59,130,246,0.35)",
                          "rgba(59,130,246,0.15)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <p className="text-slate-500 text-sm font-semibold">
                      Scanning the chain...
                    </p>
                  </motion.div>
                )}

                {/* Has NFT — show arena view */}
                {!loading && nftStatus && (
                  <motion.div
                    key="nft-status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <NFTStatusComponent
                      status={nftStatus}
                      isOwner={
                        nftStatus.owner.toLowerCase() ===
                        account.toLowerCase()
                      }
                      onPassClick={() => setShowPassModal(true)}
                      onClaimLost={handleClaimLost}
                    />
                  </motion.div>
                )}

                {/* No NFT — show mint */}
                {!loading && !nftStatus && (
                  <motion.div
                    key="mint"
                    className="flex flex-col items-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Empty orb */}
                    <motion.div
                      className="relative w-48 h-48 mb-8"
                      animate={{
                        scale: [1, 1.03, 1],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle at 35% 35%, rgba(59,130,246,0.08) 0%, rgba(6,182,212,0.04) 50%, transparent 80%)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
                          filter: "blur(40px)",
                        }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                          No Active
                        </span>
                        <span className="text-2xl font-black text-slate-500">
                          Chain
                        </span>
                      </div>
                    </motion.div>

                    <p className="text-slate-500 text-sm text-center mb-8 max-w-xs leading-relaxed">
                      Ignite a new chain and start the 24-hour countdown.
                      <br />
                      <span className="text-slate-600">
                        Pass it before time runs out.
                      </span>
                    </p>

                    <motion.button
                      className="mint-btn-glow w-full max-w-xs py-4 px-8 rounded-2xl text-lg font-black text-white border-0 uppercase tracking-wider"
                      onClick={handleMint}
                      disabled={minting}
                      whileHover={{ scale: minting ? 1 : 1.05 }}
                      whileTap={{ scale: minting ? 1 : 0.95 }}
                      data-audio-trigger="mint"
                    >
                      {minting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="arena-spinner" /> Igniting...
                        </span>
                      ) : (
                        "🔥 Ignite the Chain"
                      )}
                    </motion.button>

                    {totalMinted > 0 && (
                      <p className="text-slate-600 text-xs mt-4 tabular-nums">
                        {totalMinted} chains ignited
                      </p>
                    )}

                    {error && (
                      <motion.p
                        className="text-red-400 text-sm mt-3"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error (global) */}
              {error && nftStatus && (
                <motion.p
                  className="text-red-400 text-sm text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard panel */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Pass Modal */}
      <AnimatePresence>
        {showPassModal && myTokenId !== null && (
          <PassModal
            tokenId={myTokenId}
            onPass={handlePass}
            onClose={() => setShowPassModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
