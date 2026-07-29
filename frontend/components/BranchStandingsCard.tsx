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

  const barColors = [
    { bar: 'bg-accent-gold', text: 'text-accent-gold', border: 'border-accent-gold/30' },
    { bar: 'bg-accent-primary', text: 'text-accent-primary', border: 'border-accent-primary/20' },
    { bar: 'bg-accent-cyan', text: 'text-accent-cyan', border: 'border-accent-cyan/20' },
  ];

  return (
    <div className="glass-panel rounded-[1.75rem] p-6 relative overflow-hidden border border-border-subtle hover:border-accent-primary/20 transition-all duration-300 group">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-2xl transition-all duration-500 group-hover:w-44 group-hover:h-44" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-accent-primary/20 to-transparent" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent-primary/10 flex items-center justify-center">
            <BarChart2 className="h-3.5 w-3.5 text-accent-primary" />
          </div>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">
            Branch Standings
          </p>
        </div>

        {/* Bars */}
        <div className="space-y-3">
          {standings.map((stat, i) => {
            const pct = maxAvg > 0 ? (stat.avg / maxAvg) * 100 : 0;
            const colors = barColors[i] || barColors[2];
            return (
              <div key={stat.branch} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-[10px]">🥇</span>}
                    <span className={`font-bold ${colors.text}`}>{stat.label}</span>
                    <span className="text-text-tertiary text-[10px]">({stat.count} students)</span>
                  </div>
                  <span className={`font-mono font-bold ${colors.text}`}>{stat.avg.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-bg-secondary/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: animate ? `${pct}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-text-tertiary">Average cumulative SGPA per branch</p>
      </div>
    </div>
  );
}
