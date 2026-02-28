/**
 * Leaderboard — Displays the top chains, most passes, and most participants.
 *
 * Shows both on-chain global records and recent pass activity.
 * Designed to drive competition and social sharing.
 */

import React, { useEffect, useState } from "react";
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

// Truncate address for display
function truncAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Leaderboard() {
  const { getLeaderboard } = useContract(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [recent, setRecent] = useState<RecentPass[]>([]);
  const [tab, setTab] = useState<"records" | "recent">("records");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch on-chain leaderboard
        const lb = await getLeaderboard();
        if (lb) setData(lb);

        // Fetch off-chain recent passes from backend
        const res = await fetch(`${API_URL}/leaderboard`);
        if (res.ok) {
          const json = await res.json();
          setRecent(json.recentPasses || []);
          // If we got on-chain data from API too, use it
          if (json.onChain && !lb) {
            setData(json.onChain);
          }
        }
      } catch {
        // Silently fail — leaderboard is non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getLeaderboard]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", marginTop: 12 }}>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="tabs">
        <button
          className={`tab ${tab === "records" ? "active" : ""}`}
          onClick={() => setTab("records")}
        >
          Records
        </button>
        <button
          className={`tab ${tab === "recent" ? "active" : ""}`}
          onClick={() => setTab("recent")}
        >
          Recent Passes
        </button>
      </div>

      {/* Records Tab */}
      {tab === "records" && (
        <div className="card">
          <ul className="leaderboard-list">
            {/* Longest Chain */}
            <li className="leaderboard-item">
              <span className="leaderboard-rank">1</span>
              <div className="leaderboard-info">
                <div className="label">Longest Chain</div>
                <div className="value">
                  {data && data.longestChain.length > 0
                    ? `NFT #${data.longestChain.tokenId}`
                    : "No chains yet"}
                </div>
              </div>
              <span className="leaderboard-stat">
                {data?.longestChain.length || 0}
              </span>
            </li>

            {/* Most Passes */}
            <li className="leaderboard-item">
              <span className="leaderboard-rank">2</span>
              <div className="leaderboard-info">
                <div className="label">Most Passes</div>
                <div className="value">
                  {data && data.mostPasses.count > 0
                    ? `NFT #${data.mostPasses.tokenId}`
                    : "No passes yet"}
                </div>
              </div>
              <span className="leaderboard-stat">
                {data?.mostPasses.count || 0}
              </span>
            </li>

            {/* Most Participants */}
            <li className="leaderboard-item">
              <span className="leaderboard-rank">3</span>
              <div className="leaderboard-info">
                <div className="label">Most Participants</div>
                <div className="value">
                  {data && data.mostParticipants.count > 0
                    ? `NFT #${data.mostParticipants.tokenId}`
                    : "None yet"}
                </div>
              </div>
              <span className="leaderboard-stat">
                {data?.mostParticipants.count || 0}
              </span>
            </li>
          </ul>

          {/* Call to action */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Mint an NFT and start a chain to get on the leaderboard!
            </p>
          </div>
        </div>
      )}

      {/* Recent Passes Tab */}
      {tab === "recent" && (
        <div className="card">
          {recent.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
              No passes recorded yet. Be the first!
            </p>
          ) : (
            <ul className="leaderboard-list">
              {recent.map((pass) => (
                <li key={pass.id} className="leaderboard-item">
                  <span className="leaderboard-rank">#{pass.token_id}</span>
                  <div className="leaderboard-info">
                    <div className="value">
                      {truncAddr(pass.from_wallet)} → {truncAddr(pass.to_wallet)}
                    </div>
                    <div className="label">
                      Chain: {pass.chain_length} | {new Date(pass.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
