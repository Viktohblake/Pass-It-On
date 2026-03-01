/**
 * PassModal — Dramatic modal for passing the NFT chain.
 *
 * Features:
 *  - Smooth fade + slide-up entrance (framer-motion)
 *  - Glowing input field
 *  - Success flow: orb flies right -> confetti burst -> "You Survived." -> share panel
 *  - Audio-ready data attributes
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import Confetti from "./Confetti";

interface PassModalProps {
  tokenId: number;
  onPass: (to: string, tokenId: number) => Promise<void>;
  onClose: () => void;
}

type Phase = "input" | "sending" | "orb-exit" | "celebration" | "share";

export default function PassModal({ tokenId, onPass, onClose }: PassModalProps) {
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("input");

  const handlePass = async () => {
    setError(null);

    if (!to.trim()) {
      setError("Enter a wallet address");
      return;
    }

    if (!ethers.isAddress(to)) {
      setError("Invalid Ethereum address");
      return;
    }

    setPhase("sending");
    try {
      await onPass(to, tokenId);
      setPhase("orb-exit");
      setTimeout(() => setPhase("celebration"), 800);
      setTimeout(() => setPhase("share"), 2500);
    } catch (err: any) {
      const msg = err?.reason || err?.message || "Transaction failed";
      setError(msg);
      setPhase("input");
    }
  };

  const shareText = `I just passed the chain on Pass It On! NFT #${tokenId} lives on. Can you keep it going? #PassItOn #Base`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const canClose = phase === "input" || phase === "share" || phase === "celebration";

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={canClose ? onClose : undefined}
    >
      <motion.div
        className="glass-surface rounded-2xl w-full max-w-md overflow-hidden"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* INPUT PHASE */}
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-black text-slate-100 mb-2">
                  {"🔥 Pass the Chain"}
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Send NFT #{tokenId} to another wallet. The 24-hour timer resets.
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Recipient Address
                  </label>
                  <input
                    className="arena-input"
                    placeholder="0x..."
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    className="text-red-400 text-sm mb-4"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  className="pass-btn-glow w-full py-4 rounded-xl text-base font-bold text-white border-0 uppercase tracking-wider"
                  onClick={handlePass}
                  disabled={!to.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {"🔥 Pass It On"}
                </motion.button>

                <button
                  className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-300 bg-transparent border border-slate-700/50 hover:border-slate-600 transition-all"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* SENDING PHASE */}
            {phase === "sending" && (
              <motion.div
                key="sending"
                className="flex flex-col items-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-24 h-24 rounded-full mb-6"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(245,158,11,0.4) 0%, rgba(239,68,68,0.2) 50%, transparent 80%)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    boxShadow: "0 0 30px rgba(245,158,11,0.2)",
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 30px rgba(245,158,11,0.2)",
                      "0 0 50px rgba(245,158,11,0.4)",
                      "0 0 30px rgba(245,158,11,0.2)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-slate-400 text-sm font-semibold">
                  Confirming transaction...
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Approve in your wallet
                </p>
              </motion.div>
            )}

            {/* ORB EXIT PHASE */}
            {phase === "orb-exit" && (
              <motion.div
                key="orb-exit"
                className="flex items-center justify-center py-12"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0.2) 50%, transparent 80%)",
                    boxShadow: "0 0 40px rgba(16,185,129,0.3)",
                  }}
                  initial={{ x: 0, scale: 1, opacity: 1 }}
                  animate={{ x: 300, scale: 0.3, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeIn" }}
                />
              </motion.div>
            )}

            {/* CELEBRATION + SHARE PHASE */}
            {(phase === "celebration" || phase === "share") && (
              <motion.div
                key="celebration"
                className="flex flex-col items-center py-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                data-audio-trigger="pass-success"
              >
                <Confetti />

                <motion.div
                  className="text-5xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                >
                  {"⚡"}
                </motion.div>

                <motion.h2
                  className="text-2xl font-black text-slate-100 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  You Survived.
                </motion.h2>

                <motion.p
                  className="text-sm text-slate-500 text-center mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  NFT #{tokenId} sent to {to.slice(0, 6)}...{to.slice(-4)}
                  <br />
                  The chain continues.
                </motion.p>

                {/* Share Panel */}
                <motion.div
                  className="w-full space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 text-center mb-3">
                    Spread the word
                  </p>

                  <a
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-slate-200 glass-light hover:bg-white/5 transition-all"
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {"Share on 𝕏"}
                  </a>

                  <div className="flex gap-2">
                    <a
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 text-center glass-light hover:bg-white/5 transition-all"
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Telegram
                    </a>
                    <button
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 glass-light hover:bg-white/5 transition-all border-0"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                    >
                      Copy Link
                    </button>
                  </div>

                  <button
                    className="w-full mt-2 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-300 bg-transparent border border-slate-700/50 hover:border-slate-600 transition-all"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
