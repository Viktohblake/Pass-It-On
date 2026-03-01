/**
 * Leaderboard — Glassmorphism slide-in panel.
 *
 * Compact, semi-transparent panel showing:
 *  - Longest Chain Ever
 *  - Most Passes
 *  - Most Participants
 *  - Recent pass activity feed
 *
 * Slides in from the right with framer-motion.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContract, LeaderboardData } from "../lib/hooks";
import { API_URL } from "../lib/contract";

interface RecentPass {
  id: number;
  token_id: number;
  from_wallet: string;
  to_wallet: string;
  pass_count: number;
  chain_length: number;
  timestamp: string;
}

function truncAddr(addr: string): string {
  if (!addr) return "\u2014";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const recordsMeta = [
  { key: "longestChain", label: "Longest Chain", icon: "🔗", field: "length" },
  { key: "mostPasses", label: "Most Passes", icon: "🔄", field: "count" },
  { key: "mostParticipants", label: "Most Players", icon: "👥", field: "count" },
] as const;

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const { getLeaderboard } = useContract(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [recent, setRecent] = useState<RecentPass[]>([]);
  const [tab, setTab] = useState<"records" | "recent">("records");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      setLoading(true);
      try {
        const lb = await getLeaderboard();
        if (lb) setData(lb);

        const res = await fetch(`${API_URL}/leaderboard`);
        if (res.ok) {
          const json = await res.json();
          setRecent(json.recentPasses || []);
          if (json.onChain && !lb) {
            setData(json.onChain);
          }
        }
      } catch {
        // Leaderboard is non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen, getLeaderboard]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 lg:top-4 lg:right-4 lg:h-auto lg:max-h-[calc(100vh-32px)] lg:rounded-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="glass-surface h-full lg:h-auto lg:rounded-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-base font-bold text-slate-200">
                  {"🏆 Leaderboard"}
                </h2>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all border-0 bg-transparent text-lg"
                  onClick={onClose}
                >
                  {"×"}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-3 pb-2">
                <button
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border-0 transition-all ${
                    tab === "records"
                      ? "bg-white/10 text-slate-200"
                      : "bg-transparent text-slate-500 hover:text-slate-400"
                  }`}
                  onClick={() => setTab("records")}
                >
                  Records
                </button>
                <button
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border-0 transition-all ${
                    tab === "recent"
                      ? "bg-white/10 text-slate-200"
                      : "bg-transparent text-slate-500 hover:text-slate-400"
                  }`}
                  onClick={() => setTab("recent")}
                >
                  Live Feed
                </button>
              </div>

              {/* Content */}
              <div className="leaderboard-scroll px-4 pb-4 flex-1">
                {loading ? (
                  <div className="flex flex-col items-center py-10">
                    <div className="arena-spinner" />
                    <p className="text-slate-600 text-xs mt-3">Loading...</p>
                  </div>
                ) : tab === "records" ? (
                  <div className="space-y-2 mt-2">
                    {recordsMeta.map((rec, idx) => {
                      const recordData = data?.[rec.key as keyof LeaderboardData] as
                        | { tokenId: number; length?: number; count?: number }
                        | undefined;
                      const value = recordData
                        ? (recordData as any)[rec.field] || 0
                        : 0;
                      const tid = recordData?.tokenId;

                      return (
                        <motion.div
                          key={rec.key}
                          className="glass-light rounded-xl px-4 py-3 flex items-center gap-3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <span className="text-lg">{rec.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-500">
                              {rec.label}
                            </div>
                            <div className="text-sm font-semibold text-slate-300">
                              {value > 0
                                ? `NFT #${tid}`
                                : "No data yet"}
                            </div>
                          </div>
                          <div
                            className="text-xl font-black tabular-nums"
                            style={{ color: "#10b981" }}
                          >
                            {value}
                          </div>
                        </motion.div>
                      );
                    })}

                    <p className="text-center text-xs text-slate-600 mt-4 pb-2">
                      Start a chain to claim your spot
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {recent.length === 0 ? (
                      <p className="text-center text-xs text-slate-600 py-8">
                        No passes yet. Be the first!
                      </p>
                    ) : (
                      recent.map((pass, idx) => (
                        <motion.div
                          key={pass.id}
                          className="glass-light rounded-xl px-4 py-3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-400">
                              #{pass.token_id}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              Chain: {pass.chain_length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-slate-400">
                              {truncAddr(pass.from_wallet)}
                            </span>
                            <span style={{ color: "#10b981" }}>{"→"}</span>
                            <span className="font-mono text-slate-400">
                              {truncAddr(pass.to_wallet)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-700 mt-1">
                            {new Date(pass.timestamp).toLocaleString()}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
