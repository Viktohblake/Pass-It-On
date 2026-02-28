/**
 * WalletConnect — Landing screen for connecting a wallet.
 *
 * Supports MetaMask, Coinbase Wallet, and any injected EIP-1193 provider.
 * Shows Base branding and instructions.
 */

import React from "react";

interface WalletConnectProps {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}

export default function WalletConnect({
  onConnect,
  connecting,
  error,
}: WalletConnectProps) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0 40px" }}>
      {/* Hero */}
      <div style={{ fontSize: "4rem", marginBottom: 16 }}>🔥</div>
      <h1
        style={{
          fontSize: "2.4rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #0052ff 0%, #00c853 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 12,
        }}
      >
        Pass It On
      </h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 360, margin: "0 auto 32px", lineHeight: 1.5 }}>
        The viral hot potato NFT game on Base.
        <br />
        Mint it. Pass it. Don&apos;t let it die.
      </p>

      {/* How it works */}
      <div className="card" style={{ textAlign: "left", marginBottom: 24 }}>
        <div className="card-title">How it works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.3rem" }}>1.</span>
            <div>
              <strong>Mint</strong> a hot potato NFT
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Create a new chain or join an existing one
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.3rem" }}>2.</span>
            <div>
              <strong>Pass</strong> it to a friend within 24 hours
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                The timer resets with each pass
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.3rem" }}>3.</span>
            <div>
              <strong>Compete</strong> for the longest chain
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Climb the leaderboard and share your streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect button */}
      <button
        className="btn btn-primary"
        onClick={onConnect}
        disabled={connecting}
        style={{ maxWidth: 360, margin: "0 auto" }}
      >
        {connecting ? (
          <>
            <span className="spinner" /> Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>

      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 12 }}>
        MetaMask, Coinbase Wallet, or any EIP-1193 wallet
      </p>

      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

      {/* Base branding */}
      <div style={{ marginTop: 48, color: "var(--text-muted)", fontSize: "0.8rem" }}>
        Built on Base L2
      </div>
    </div>
  );
}
