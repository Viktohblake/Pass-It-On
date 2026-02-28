/**
 * NFTStatus — Shows the current state of a PassItOn NFT.
 *
 * Displays:
 *  - NFT visual card
 *  - Live countdown timer
 *  - Pass count & chain length stats
 *  - Current owner
 *  - Status badge (alive / lost)
 *  - Social share buttons
 */

import React, { useState } from "react";
import { useCountdown, NFTStatus as NFTStatusType } from "../lib/hooks";

interface NFTStatusProps {
  status: NFTStatusType;
  isOwner: boolean;
  onPassClick: () => void;
  onClaimLost: () => void;
}

// Truncate address for display: 0x1234...abcd
function truncAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function NFTStatusComponent({
  status,
  isOwner,
  onPassClick,
  onClaimLost,
}: NFTStatusProps) {
  const { formatted, urgency, timeLeft } = useCountdown(
    status.alive ? status.deadline : null
  );
  const [copied, setCopied] = useState(false);

  const isExpired = status.alive && timeLeft === 0;

  // Build share text
  const shareText = `I'm part of a ${status.chainLength}-link chain on Pass It On! Can you keep it going? #PassItOn #Base`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* NFT Visual */}
      <div className="nft-visual">
        <div className="nft-emoji">{status.alive ? "🔥" : "💀"}</div>
        <div className="nft-label">
          {status.alive ? `Pass It On #${status.tokenId}` : "Lost!"}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span className={`badge ${status.alive ? "badge-alive" : "badge-lost"}`}>
          {status.alive ? "Active" : "Expired"}
        </span>
      </div>

      {/* Countdown Timer */}
      {status.alive && (
        <div className="countdown">
          <div className={`countdown-time ${urgency}`}>{formatted}</div>
          <div className="countdown-label">
            {isExpired ? "Timer expired!" : "Time remaining to pass"}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-value">{status.passCount}</div>
          <div className="stat-label">Passes</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{status.chainLength}</div>
          <div className="stat-label">Chain</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {status.alive ? `${Math.floor(timeLeft / 3600)}h` : "—"}
          </div>
          <div className="stat-label">Hours Left</div>
        </div>
      </div>

      {/* Owner */}
      <div className="card" style={{ textAlign: "center" }}>
        <div className="card-title">Current Holder</div>
        <div className="wallet-address">{truncAddr(status.owner)}</div>
      </div>

      {/* Actions */}
      {isOwner && status.alive && !isExpired && (
        <button className="btn btn-primary" onClick={onPassClick}>
          🔥 Pass It On
        </button>
      )}

      {isExpired && (
        <button className="btn btn-danger" onClick={onClaimLost} style={{ marginTop: 8 }}>
          💀 Claim Lost (Burn)
        </button>
      )}

      {/* Social Share */}
      <div className="share-row" style={{ marginTop: 16 }}>
        <a
          className="share-btn"
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          𝕏 Share
        </a>
        <a
          className="share-btn"
          href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        <button className="share-btn" onClick={handleCopyLink}>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
