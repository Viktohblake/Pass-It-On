/**
 * EnergyOrb — Glowing animated orb with SVG circular countdown ring.
 *
 * The core visual centerpiece of the arena. Changes color and intensity
 * based on urgency level. Features:
 *  - Radial gradient inner glow
 *  - SVG countdown ring with smooth animation
 *  - Pulsing glow effects
 *  - Color transitions for urgency states
 */

import React from "react";
import { motion } from "framer-motion";
import { Urgency } from "../lib/hooks";

interface EnergyOrbProps {
  urgency: Urgency;
  progress: number; // 0-1 (fraction of 24h remaining)
  alive: boolean;
  tokenId: number;
  urgencyColor: string;
}

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEWBOX_SIZE = 280;
const CENTER = VIEWBOX_SIZE / 2;

export default function EnergyOrb({
  urgency,
  progress,
  alive,
  tokenId,
  urgencyColor,
}: EnergyOrbProps) {
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isCritical = urgency === "critical";
  const isDead = !alive;

  const glowColor = isDead ? "#475569" : urgencyColor;

  // Pulse animation intensity based on urgency
  const pulseScale =
    urgency === "safe"
      ? [1, 1.02, 1]
      : urgency === "warning"
        ? [1, 1.04, 1]
        : [1, 1.06, 1];

  const pulseDuration =
    urgency === "safe" ? 3 : urgency === "warning" ? 2 : 1;

  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 280, height: 280 }}
      animate={
        isCritical && alive
          ? { x: [0, -3, 3, -2, 2, 0] }
          : {}
      }
      transition={
        isCritical
          ? { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }
          : {}
      }
      data-urgency={urgency}
    >
      {/* Outer ambient glow */}
      <motion.div
        className="orb-glow"
        style={{ background: glowColor }}
        animate={{ opacity: alive ? [0.3, 0.5, 0.3] : 0.1 }}
        transition={{ duration: pulseDuration, repeat: Infinity }}
      />

      {/* Inner core glow */}
      <div
        className="orb-inner-glow"
        style={{
          background: `radial-gradient(circle, ${glowColor}60 0%, ${glowColor}20 50%, transparent 80%)`,
        }}
      />

      {/* SVG countdown ring */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        style={
          {
            "--ring-color": glowColor,
          } as React.CSSProperties
        }
      >
        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="3"
        />

        {/* Progress arc */}
        {alive && (
          <motion.circle
            className="countdown-ring-glow"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={glowColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{
              strokeDashoffset: dashOffset,
              opacity: isCritical ? [1, 0.3, 1] : 1,
            }}
            transition={{
              strokeDashoffset: { duration: 1, ease: "linear" },
              opacity: isCritical
                ? { duration: 0.5, repeat: Infinity }
                : { duration: 0.3 },
            }}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        )}

        {/* Tick marks every hour (24 ticks) */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = CENTER + (RADIUS - 8) * Math.cos(rad);
          const y1 = CENTER + (RADIUS - 8) * Math.sin(rad);
          const x2 = CENTER + (RADIUS + 2) * Math.cos(rad);
          const y2 = CENTER + (RADIUS + 2) * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Central orb surface */}
      <motion.div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          inset: "28px",
          background: isDead
            ? "radial-gradient(circle at 35% 35%, #1e293b 0%, #0f172a 60%, #030712 100%)"
            : `radial-gradient(circle at 35% 35%, ${glowColor}30 0%, ${glowColor}10 40%, rgba(3,7,18,0.9) 80%)`,
          border: `1px solid ${isDead ? "rgba(255,255,255,0.05)" : `${glowColor}40`}`,
        }}
        animate={{
          scale: alive ? pulseScale : 1,
        }}
        transition={{
          duration: pulseDuration,
          repeat: alive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Token ID */}
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: `${glowColor}90` }}
        >
          {isDead ? "LOST" : "CHAIN"}
        </span>
        <span
          className="text-4xl font-black tabular-nums"
          style={{ color: isDead ? "#475569" : "#f8fafc" }}
        >
          #{tokenId}
        </span>
        {alive && (
          <span
            className="text-xs font-medium mt-1"
            style={{ color: `${glowColor}80` }}
          >
            ACTIVE
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
