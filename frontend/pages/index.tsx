/**
 * Pass It On — Main App Page
 *
 * The single-page app flow:
 *   1. Connect Wallet (landing)
 *   2. Dashboard: Mint or view your NFT status
 *   3. Leaderboard: See top chains
 *
 * All state is driven by on-chain data with live countdown timers.
 */

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useWallet, useContract, NFTStatus } from "../lib/hooks";
import { API_URL } from "../lib/contract";
import WalletConnect from "../components/WalletConnect";
import NFTStatusComponent from "../components/NFTStatus";
import PassModal from "../components/PassModal";
import Leaderboard from "../components/Leaderboard";

type Tab = "nft" | "leaderboard";

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
  const [tab, setTab] = useState<Tab>("nft");
  const [nftStatus, setNftStatus] = useState<NFTStatus | null>(null);
  const [myTokenId, setMyTokenId] = useState<number | null>(null);
  const [totalMinted, setTotalMinted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show toast notification
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

      // Scan from most recent to find user's active NFT
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

      // No active NFT found
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
      showToast(`NFT #${tokenId} minted! You have 24 hours.`);
      setMyTokenId(tokenId);
      // Refresh status
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

    // Notify backend
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

    showToast("NFT passed! The chain continues.");
    setNftStatus(null);
    setMyTokenId(null);
  };

  // ── Claim lost handler ──
  const handleClaimLost = async () => {
    if (myTokenId === null) return;
    try {
      await claimLost(myTokenId);
      showToast("NFT burned. Start a new chain!");
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
        <title>Pass It On | Hot Potato NFT on Base</title>
        <meta
          name="description"
          content="The viral hot potato NFT game on Base. Mint it. Pass it. Don't let it die."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="Pass It On | Hot Potato NFT" />
        <meta
          property="og:description"
          content="Mint a hot potato NFT and pass it before the 24h timer runs out!"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="container">
        {/* Toast notification */}
        {toast && <div className="toast">{toast}</div>}

        {/* Not connected — show landing */}
        {!account && (
          <WalletConnect
            onConnect={connect}
            connecting={connecting}
            error={walletError}
          />
        )}

        {/* Connected — show app */}
        {account && (
          <>
            {/* Header */}
            <div className="header">
              <h1>Pass It On</h1>
              <p>
                {account.slice(0, 6)}...{account.slice(-4)}
                {!isBase && (
                  <span style={{ color: "var(--warning)", marginLeft: 8 }}>
                    (Switch to Base)
                  </span>
                )}
              </p>
            </div>

            {/* Tab navigation */}
            <div className="tabs">
              <button
                className={`tab ${tab === "nft" ? "active" : ""}`}
                onClick={() => setTab("nft")}
              >
                My NFT
              </button>
              <button
                className={`tab ${tab === "leaderboard" ? "active" : ""}`}
                onClick={() => setTab("leaderboard")}
              >
                Leaderboard
              </button>
            </div>

            {/* NFT Tab */}
            {tab === "nft" && (
              <>
                {loading ? (
                  <div className="card" style={{ textAlign: "center", padding: 40 }}>
                    <div className="spinner" />
                    <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
                      Scanning for your NFT...
                    </p>
                  </div>
                ) : nftStatus ? (
                  <NFTStatusComponent
                    status={nftStatus}
                    isOwner={
                      nftStatus.owner.toLowerCase() === account.toLowerCase()
                    }
                    onPassClick={() => setShowPassModal(true)}
                    onClaimLost={handleClaimLost}
                  />
                ) : (
                  /* No NFT — show mint option */
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔥</div>
                    <h2 style={{ marginBottom: 8 }}>No active NFT</h2>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: 20,
                        lineHeight: 1.5,
                      }}
                    >
                      Mint a new hot potato and start a chain!
                      <br />
                      You&apos;ll have 24 hours to pass it to someone else.
                    </p>

                    <button
                      className="btn btn-primary"
                      onClick={handleMint}
                      disabled={minting}
                    >
                      {minting ? (
                        <>
                          <span className="spinner" /> Minting...
                        </>
                      ) : (
                        "Mint Hot Potato"
                      )}
                    </button>

                    {totalMinted > 0 && (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          marginTop: 12,
                        }}
                      >
                        {totalMinted} NFTs minted so far
                      </p>
                    )}
                  </div>
                )}

                {error && <p className="error">{error}</p>}
              </>
            )}

            {/* Leaderboard Tab */}
            {tab === "leaderboard" && <Leaderboard />}

            {/* Disconnect button */}
            <div style={{ textAlign: "center", marginTop: 32, paddingBottom: 20 }}>
              <button
                className="btn btn-secondary btn-small"
                onClick={disconnect}
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pass Modal */}
      {showPassModal && myTokenId !== null && (
        <PassModal
          tokenId={myTokenId}
          onPass={handlePass}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </>
  );
}
