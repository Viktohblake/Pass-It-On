/**
 * WalletConnect — Immersive arena landing screen.
 *
 * Full-viewport dark arena experience with animated gradient title,
 * dramatic step cards, and pulsing connect button.
 */

import React from "react";
import { motion } from "framer-motion";

interface WalletConnectProps {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}

const steps = [
  {
    icon: "01",
    title: "Ignite",
    desc: "Mint a chain. The 24-hour countdown begins.",
  },
  {
    icon: "02",
    title: "Pass",
    desc: "Send it before time runs out. The timer resets.",
  },
  {
    icon: "03",
    title: "Compete",
    desc: "Build the longest chain. Dominate the leaderboard.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function WalletConnect({
  onConnect,
  connecting,
  error,
}: WalletConnectProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[85vh] px-4 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated orb preview */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        variants={itemVariants}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, rgba(59,130,246,0.3) 0%, rgba(6,182,212,0.15) 50%, transparent 80%)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🔥</span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-5xl sm:text-6xl font-black tracking-tight mb-3"
        variants={itemVariants}
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Pass It On
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-slate-400 text-lg sm:text-xl max-w-sm mb-10 leading-relaxed"
        variants={itemVariants}
      >
        The hot potato NFT arena on Base.
        <br />
        <span className="text-slate-500">
          Mint it. Pass it. Don&apos;t let it die.
        </span>
      </motion.p>

      {/* Steps */}
      <motion.div
        className="w-full max-w-md mb-10 space-y-3"
        variants={itemVariants}
      >
        {steps.map((step) => (
          <motion.div
            key={step.icon}
            className="glass-light rounded-xl px-5 py-4 flex items-start gap-4 text-left"
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(255,255,255,0.12)",
            }}
            transition={{ duration: 0.2 }}
          >
            <span
              className="text-sm font-bold tabular-nums mt-0.5 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {step.icon}
            </span>
            <div>
              <div className="text-sm font-bold text-slate-200">
                {step.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Connect Button */}
      <motion.button
        className="mint-btn-glow w-full max-w-sm py-4 px-8 rounded-2xl text-lg font-bold text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onConnect}
        disabled={connecting}
        variants={itemVariants}
        whileHover={{ scale: connecting ? 1 : 1.03 }}
        whileTap={{ scale: connecting ? 1 : 0.97 }}
      >
        {connecting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="arena-spinner" /> Connecting...
          </span>
        ) : (
          "Enter the Arena"
        )}
      </motion.button>

      <motion.p
        className="text-slate-600 text-xs mt-4"
        variants={itemVariants}
      >
        Sign in with email or connect any wallet
      </motion.p>

      {error && (
        <motion.p
          className="text-red-400 text-sm mt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Base branding */}
      <motion.div
        className="mt-12 text-slate-700 text-xs tracking-wider uppercase"
        variants={itemVariants}
      >
        Built on Base L2
      </motion.div>
    </motion.div>
  );
}
