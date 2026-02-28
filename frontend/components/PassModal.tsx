/**
 * PassModal — Bottom sheet / modal for passing an NFT to another wallet.
 *
 * Validates the address, confirms the action, and triggers the
 * on-chain passNFT transaction.
 */

import React, { useState } from "react";
import { ethers } from "ethers";

interface PassModalProps {
  tokenId: number;
  onPass: (to: string, tokenId: number) => Promise<void>;
  onClose: () => void;
}

export default function PassModal({ tokenId, onPass, onClose }: PassModalProps) {
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePass = async () => {
    setError(null);

    // Validate address
    if (!to.trim()) {
      setError("Enter a wallet address");
      return;
    }

    if (!ethers.isAddress(to)) {
      setError("Invalid Ethereum address");
      return;
    }

    setLoading(true);
    try {
      await onPass(to, tokenId);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.reason || err?.message || "Transaction failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
            <h2 style={{ marginBottom: 8 }}>Passed!</h2>
            <p style={{ color: "var(--text-muted)" }}>
              NFT #{tokenId} has been sent to {to.slice(0, 6)}...{to.slice(-4)}.
              <br />
              The 24-hour timer has been reset!
            </p>

            {/* Share the pass */}
            <div className="share-row" style={{ marginTop: 20 }}>
              <a
                className="share-btn"
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `I just passed the hot potato on @PassItOnBase! NFT #${tokenId} is still alive. Can you keep the chain going? 🔥 #PassItOn #Base`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on 𝕏
              </a>
            </div>

            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ marginTop: 16 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">🔥 Pass NFT #{tokenId}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          Send this NFT to another wallet to keep the chain alive. The 24-hour
          timer will reset when they receive it.
        </p>

        <div className="input-group">
          <label>Recipient Wallet Address</label>
          <input
            className="input"
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handlePass}
          disabled={loading || !to.trim()}
          style={{ marginTop: 12 }}
        >
          {loading ? (
            <>
              <span className="spinner" /> Sending...
            </>
          ) : (
            "🔥 Pass It On"
          )}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
