/**
 * ChainVisualization — Animated horizontal chain graph.
 *
 * Shows the chain length as connected glowing nodes with animated lines.
 * The current node (last) pulses to indicate the active holder.
 */

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ChainVisualizationProps {
  chainLength: number;
  urgencyColor: string;
  alive: boolean;
}

const MAX_VISIBLE_NODES = 15;

export default function ChainVisualization({
  chainLength,
  urgencyColor,
  alive,
}: ChainVisualizationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayCount = Math.min(chainLength, MAX_VISIBLE_NODES);
  const hasOverflow = chainLength > MAX_VISIBLE_NODES;

  // Auto-scroll to the end (current holder)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [chainLength]);

  if (chainLength === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Chain History
        </span>
        <span className="text-xs text-slate-600">
          {chainLength} {chainLength === 1 ? "link" : "links"}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="chain-scroll glass-light rounded-xl py-4 px-4"
      >
        <div className="flex items-center gap-0 min-w-max">
          {/* Overflow indicator */}
          {hasOverflow && (
            <div className="flex items-center mr-1">
              <span className="text-xs text-slate-600 mr-2">
                +{chainLength - MAX_VISIBLE_NODES}
              </span>
              <div className="w-6 h-px bg-slate-700" />
            </div>
          )}

          {Array.from({ length: displayCount }).map((_, i) => {
            const isLast = i === displayCount - 1;
            const isFirst = i === 0 && !hasOverflow;
            const nodeIndex = hasOverflow
              ? chainLength - displayCount + i
              : i;

            return (
              <React.Fragment key={nodeIndex}>
                {/* Connecting line (before each node except first) */}
                {i > 0 && (
                  <motion.div
                    className="h-px flex-shrink-0"
                    style={{
                      width: 24,
                      background: `linear-gradient(90deg, ${urgencyColor}40, ${urgencyColor}60)`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  />
                )}

                {/* Chain node */}
                <motion.div
                  className="chain-node relative flex-shrink-0 rounded-full flex items-center justify-center cursor-default"
                  style={{
                    width: isLast ? 36 : isFirst ? 30 : 24,
                    height: isLast ? 36 : isFirst ? 30 : 24,
                    background: isLast
                      ? `radial-gradient(circle, ${urgencyColor}50, ${urgencyColor}20)`
                      : isFirst
                        ? `radial-gradient(circle, ${urgencyColor}30, transparent)`
                        : `radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.03))`,
                    border: `1px solid ${isLast ? urgencyColor + "80" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: isLast
                      ? `0 0 12px ${urgencyColor}40, 0 0 24px ${urgencyColor}20`
                      : "none",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isLast && alive ? [1, 1.15, 1] : 1,
                    opacity: 1,
                  }}
                  transition={
                    isLast && alive
                      ? {
                          scale: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          opacity: { delay: i * 0.05, duration: 0.3 },
                        }
                      : { delay: i * 0.05, duration: 0.3 }
                  }
                  title={isFirst ? "Origin" : isLast ? "Current Holder" : `Pass #${nodeIndex}`}
                >
                  {/* Node number */}
                  <span
                    className="text-[8px] font-bold tabular-nums"
                    style={{
                      color: isLast ? urgencyColor : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {nodeIndex + 1}
                  </span>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
