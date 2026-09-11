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
    { bar: 'bg-gradient-to-r from-emerald-600 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]', text: 'text-emerald-300' },
    { bar: 'bg-gradient-to-r from-teal-600 to-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.5)]', text: 'text-teal-300' },
    { bar: 'bg-gradient-to-r from-cyan-600 to-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]', text: 'text-cyan-300' },
  ];

  return (
    <div className="glass-pill rounded-2xl p-5 sm:px-7 relative overflow-hidden transition-all duration-300 group shadow-[0_0_25px_rgba(45,212,191,0.06)] hover:shadow-[0_0_35px_rgba(45,212,191,0.18)] bg-[#041414]/30 backdrop-blur-md">
      {/* Animated Edge Glow Border */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none p-[1px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, rgba(45,212,191,0.4) 0%, rgba(6,182,212,0.15) 33%, rgba(52,211,153,0.4) 66%, rgba(45,212,191,0.4) 100%)',
          backgroundSize: '200% 100%',
          animation: 'edgeGlowRun 8s linear infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/10 rounded-full blur-xl transition-all duration-500 group-hover:w-36 group-hover:h-36 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded border border-teal-400/30 bg-teal-500/15 flex items-center justify-center shadow-[0_0_10px_rgba(45,212,191,0.2)]">
            <BarChart2 className="h-3.5 w-3.5 text-teal-300" />
          </div>
          <p className="text-xs font-extrabold text-zinc-200 uppercase tracking-widest">
            Branch Standings
          </p>
        </div>

        {/* Branches Container */}
        <div className="flex flex-row items-center justify-between gap-4 sm:gap-8">
          {standings.map((stat, i) => {
            const pct = maxAvg > 0 ? (stat.avg / maxAvg) * 100 : 0;
            const theme = barTheme[i] || barTheme[2];
            return (
              <div key={stat.branch} className="flex flex-col w-1/3">
                {/* SGPA Score */}
                <div className="flex items-end justify-end mb-1.5">
                  <span className={`font-mono font-bold text-sm sm:text-base ${theme.text}`}>
                    {stat.avg.toFixed(2)}
                  </span>
                </div>
                
                {/* Horizontal Bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className={`h-full ${theme.bar} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: animate ? `${pct}%` : '0%' }}
                  />
                </div>
                
                {/* Branch Name & Count */}
                <div className="flex flex-col items-center mt-2 text-center">
                  <span className={`font-bold tracking-wide text-xs sm:text-sm ${theme.text}`}>{stat.label}</span>
                  <span className="text-zinc-400 text-[10px] sm:text-xs font-mono mt-0.5">{stat.count} students</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
