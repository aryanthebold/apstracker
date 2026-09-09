'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api';
import { BarChart2 } from 'lucide-react';

interface BranchStat {
  branch: string;
  label: string;
  avg: number;
  count: number;
}

export default function BranchStandingsCard() {
  const [standings, setStandings] = useState<BranchStat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const branches = [
      { key: 'CSE', label: 'CSE' },
      { key: 'CSE_AIML', label: 'CSE AI/ML' },
      { key: 'CST', label: 'CST' },
    ];

    Promise.allSettled(
      branches.map((b) =>
        fetchLeaderboard({ branch: b.key, limit: 200 }).then((res) => {
          const valid = res.data.filter((e) => e.overall_sgpa != null && e.overall_sgpa > 0);
          const avg = valid.length > 0
            ? valid.reduce((sum, e) => sum + (e.overall_sgpa ?? 0), 0) / valid.length
            : 0;
          return { branch: b.key, label: b.label, avg: parseFloat(avg.toFixed(2)), count: valid.length };
        })
      )
    ).then((results) => {
      const stats = results
        .filter((r): r is PromiseFulfilledResult<BranchStat> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((s) => s.count > 0)
        .sort((a, b) => b.avg - a.avg);
      setStandings(stats);
      setLoaded(true);
      setTimeout(() => setAnimate(true), 100);
    });
  }, []);

  if (!loaded || standings.length === 0) return null;

  const maxAvg = Math.max(...standings.map((s) => s.avg));

  const barTheme = [
    { bar: 'bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]', text: 'text-emerald-300' },
    { bar: 'bg-gradient-to-t from-teal-600 to-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.5)]', text: 'text-teal-300' },
    { bar: 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]', text: 'text-cyan-300' },
  ];

  return (
    <div className="glass-pill rounded-2xl p-4 relative overflow-hidden border border-white/10 hover:border-teal-400/30 transition-all duration-300 group shadow-[0_0_20px_rgba(45,212,191,0.05)] hover:shadow-[0_0_30px_rgba(45,212,191,0.15)] bg-[#041414]/60">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl transition-all duration-500 group-hover:w-32 group-hover:h-32" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-teal-400/20 via-transparent to-transparent" />

      <div className="relative z-10 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-400/20">
            <BarChart2 className="h-3 w-3 text-teal-300" />
          </div>
          <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
            Branch Standings
          </p>
        </div>

        {/* Bars Container */}
        <div className="flex items-end justify-between h-28 px-4 pt-2 pb-1">
          {standings.map((stat, i) => {
            const pct = maxAvg > 0 ? (stat.avg / maxAvg) * 100 : 0;
            const theme = barTheme[i] || barTheme[2];
            return (
              <div key={stat.branch} className="flex flex-col items-center justify-end h-full w-1/3">
                {/* SGPA Score */}
                <div className="flex flex-col items-center mb-1.5">
                  {i === 0 && <span className="text-[9px] mb-0.5 animate-bounce">🥇</span>}
                  <span className={`font-mono font-bold text-[10px] ${theme.text}`}>
                    {stat.avg.toFixed(2)}
                  </span>
                </div>
                
                {/* Vertical Bar */}
                <div className="w-2.5 h-16 bg-white/5 rounded-full overflow-hidden border border-white/[0.02] flex items-end justify-center shrink-0">
                  <div
                    className={`w-full ${theme.bar} rounded-full transition-all duration-700 ease-out`}
                    style={{ height: animate ? `${pct}%` : '0%' }}
                  />
                </div>
                
                {/* Branch Name & Count */}
                <div className="flex flex-col items-center mt-2 h-6">
                  <span className={`font-bold tracking-wide text-[9px] ${theme.text}`}>{stat.label}</span>
                  <span className="text-zinc-500 text-[8px] font-mono leading-none mt-0.5">{stat.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
