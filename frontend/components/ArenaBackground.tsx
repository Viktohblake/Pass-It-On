/**
 * ArenaBackground — Immersive animated dark arena backdrop.
 *
 * Features:
 *  - Slowly drifting gradient blobs (deep blue, purple, teal)
 *  - Floating particle dots that rise upward
 *  - GPU-accelerated CSS animations only
 */

import React, { useMemo } from "react";

const PARTICLE_COUNT = 25;

// Deterministic particle config from index
function makeParticle(i: number) {
  const seed = (i * 7 + 13) % 100;
  return {
    left: `${(seed * 3.7) % 100}%`,
    size: `${2 + (seed % 4)}px`,
    duration: `${12 + (seed % 15)}s`,
    delay: `${-(seed % 12)}s`,
    opacity: 0.15 + (seed % 30) / 100,
    driftX: `${-20 + (seed % 40)}px`,
  };
}

export default function ArenaBackground() {
  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => makeParticle(i)),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Gradient blob 1 — deep blue */}
      <div
        className="arena-blob animate-drift-1"
        style={{
          width: "600px",
          height: "600px",
          top: "-10%",
          left: "-5%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Gradient blob 2 — purple */}
      <div
        className="arena-blob animate-drift-2"
        style={{
          width: "500px",
          height: "500px",
          top: "40%",
          right: "-10%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Gradient blob 3 — teal/cyan */}
      <div
        className="arena-blob animate-drift-3"
        style={{
          width: "450px",
          height: "450px",
          bottom: "-5%",
          left: "20%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="arena-particle"
          style={
            {
              left: p.left,
              "--size": p.size,
              "--duration": p.duration,
              "--delay": p.delay,
              "--particle-opacity": p.opacity,
              "--drift-x": p.driftX,
              animationDelay: p.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(3,7,18,0.8) 100%)",
        }}
      />
    </div>
  );
}
