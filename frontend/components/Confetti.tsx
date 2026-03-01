/**
 * Confetti — Burst of colorful particles from center of screen.
 *
 * Pure framer-motion animation. Renders once and auto-cleans.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const PIECE_COUNT = 50;

interface ConfettiProps {
  onComplete?: () => void;
}

export default function Confetti({ onComplete }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => {
        const angle = (i / PIECE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const velocity = 150 + Math.random() * 300;
        return {
          id: i,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - 150, // bias upward
          rotate: Math.random() * 720 - 360,
          scale: 0.5 + Math.random() * 0.8,
          color: COLORS[i % COLORS.length],
          width: 6 + Math.random() * 6,
          height: 4 + Math.random() * 8,
          delay: Math.random() * 0.15,
        };
      }),
    []
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      data-audio-trigger="pass-success"
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: p.width,
            height: p.height,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: p.scale,
            rotate: p.rotate,
            opacity: 0,
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: "easeOut",
          }}
          onAnimationComplete={p.id === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}
