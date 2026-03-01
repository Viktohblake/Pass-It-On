/**
 * NFTStatus — Arena view showing the energy orb, countdown, stats, and actions.
 *
 * This is the main arena experience when a user holds an active NFT.
 * Features:
 *  - Energy orb with circular countdown
 *  - Dynamic urgency message and color
 *  - Animated stats row
 *  - Dramatic PASS THE CHAIN button with glow
 *  - Chain visualization
 *  - Screen shake on critical urgency
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCountdown, NFTStatus as NFTStatusType } from "../lib/hooks";
import EnergyOrb from "./EnergyOrb";
import ChainVisualization from "./ChainVisualization";

interface NFTStatusProps {
  status: NFTStatusType;
  isOwner: boolean;
  onPassClick: () => void;
  onClaimLost: () => void;
}

function truncAddr(addr: string): string {
  if (!addr) return "\u2014";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function NFTStatusComponent({
  status,
  isOwner,
  onPassClick,
  onClaimLost,
}: NFTStatusProps) {
  const {
    formatted,
    urgency,
    urgencyMessage,
    urgencyColor,
    progress,
    timeLeft,
  } = useCountdown(status.alive ? status.deadline : null);

  const isExpired = status.alive && timeLeft === 0;
  const isCritical = urgency === "critical";

  const textGlowClass =
    urgency === "safe"
      ? "text-glow-green"
      : urgency === "warning"
        ? "text-glow-amber"
        : "text-glow-red";

  const shareText = `I'm holding a ${status.chainLength}-link chain on Pass It On! Can you keep it going? #PassItOn #Base`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <motion.div
      className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Energy Orb */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <EnergyOrb
          urgency={urgency}
          progress={progress}
          alive={status.alive}
          tokenId={status.tokenId}
          urgencyColor={urgencyColor}
        />
      </motion.div>

      {/* Urgency Message */}
      {status.alive && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className={`text-sm font-bold uppercase tracking-widest ${textGlowClass}`}
            style={{ color: urgencyColor }}
            animate={
              isCritical
                ? { opacity: [1, 0.3, 1] }
                : {}
            }
            transition={
              isCritical
                ? { duration: 0.5, repeat: Infinity }
                : {}
            }
          >
            {isExpired ? "TIME\u2019S UP" : urgencyMessage}
          </motion.p>
        </motion.div>
      )}

      {!status.alive && (
        <motion.p
          className="text-sm font-bold uppercase tracking-widest text-glow-red"
          style={{ color: "#ef4444" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-audio-trigger="chain-break"
        >
          The Chain is Broken
        </motion.p>
      )}

      {/* Countdown Timer */}
      {status.alive && (
        <motion.div
          className={`text-5xl sm:text-6xl font-black tabular-nums font-mono tracking-wider ${textGlowClass}`}
          style={{ color: urgencyColor }}
          animate={
            isCritical
              ? { opacity: [1, 0.2, 1], scale: [1, 1.02, 1] }
              : {}
          }
          transition={
            isCritical
              ? { duration: 0.5, repeat: Infinity }
              : {}
          }
          data-urgency={urgency}
        >
          {formatted}
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div
        className="flex gap-3 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex-1 glass-light rounded-xl py-3 px-4 text-center">
          <div className="text-2xl font-black text-slate-100">
            {status.passCount}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Passes
          </div>
        </div>
        <div className="flex-1 glass-light rounded-xl py-3 px-4 text-center">
          <div className="text-2xl font-black text-slate-100">
            {status.chainLength}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Chain
          </div>
        </div>
        <div className="flex-1 glass-light rounded-xl py-3 px-4 text-center">
          <div className="text-2xl font-black text-slate-100">
            {status.alive ? `${Math.floor(timeLeft / 3600)}h` : "\u2014"}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Left
          </div>
        </div>
      </motion.div>

      {/* Current Holder */}
      <motion.div
        className="glass-light rounded-xl py-3 px-5 text-center w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
          Current Holder
        </div>
        <div className="text-sm font-mono text-slate-300">
          {truncAddr(status.owner)}
        </div>
      </motion.div>

      {/* Pass Button */}
      <AnimatePresence mode="wait">
        {isOwner && status.alive && !isExpired && (
          <motion.button
            className="pass-btn-glow w-full max-w-xs py-4 px-8 rounded-2xl text-lg font-black text-white border-0 uppercase tracking-wider"
            onClick={onPassClick}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {"🔥 Pass the Chain"}
          </motion.button>
        )}

        {isExpired && (
          <motion.button
            className="w-full max-w-xs py-4 px-8 rounded-2xl text-lg font-bold text-white border-0 bg-red-600 hover:bg-red-500 transition-colors"
            onClick={onClaimLost}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {"💀 Claim Remains"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chain Visualization */}
      <motion.div
        className="w-full mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ChainVisualization
          chainLength={status.chainLength}
          urgencyColor={urgencyColor}
          alive={status.alive}
        />
      </motion.div>

      {/* Share Row */}
      <motion.div
        className="flex gap-2 w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <a
          className="flex-1 glass-light rounded-xl py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {"Share on 𝕏"}
        </a>
        <a
          className="flex-1 glass-light rounded-xl py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        <button
          className="flex-1 glass-light rounded-xl py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all border-0"
          onClick={() => navigator.clipboard.writeText(shareUrl)}
        >
          Copy Link
        </button>
      </motion.div>
    </motion.div>
  );
}
