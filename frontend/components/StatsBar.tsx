'use client';

import { useEffect, useState } from 'react';
import { fetchStats, BatchStats } from '@/lib/api';
import { Users, TrendingUp, Trophy, ShieldCheck, AlertCircle } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';

interface StatsBarProps {
  initialStats?: BatchStats;
}

export default function StatsBar({ initialStats }: StatsBarProps) {
  const [stats, setStats] = useState<BatchStats | null>(initialStats || null);
  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStats) return;
    fetchStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load stats');
        setLoading(false);
      });
  }, [initialStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-6 h-28 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-full glass-panel border-accent-danger/20 bg-accent-danger/5 rounded-xl p-4 flex items-center justify-center gap-2 text-accent-danger text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load live batch statistics. Please check backend connection.</span>
      </div>
    );
  }

  const submissionPercentage = stats.total_students > 0
    ? ((stats.total_submitted / stats.total_students) * 100).toFixed(1)
    : '0';

  // top_sgpa and clean_records may not be in the API yet — gracefully fallback
  const topSgpa = (stats as any).top_sgpa ?? null;
  const cleanRecords = (stats as any).clean_records ?? null;

  const cards = [
    {
      title: 'Students Submitted',
      value: stats.total_submitted,
      subtext: `of ${stats.total_students} (${submissionPercentage}%)`,
      icon: Users,
      color: 'text-accent-primary',
      borderColor: 'border-accent-primary/20',
      isInteger: true,
    },
    {
      title: 'Batch Avg SGPA',
      value: stats.average_sgpa > 0 ? stats.average_sgpa : 0,
      subtext: 'cumulative average',
      icon: TrendingUp,
      color: 'text-accent-gold',
      borderColor: 'border-accent-gold/20',
      isInteger: false,
    },
    {
      title: 'Top SGPA',
      value: topSgpa ?? 0,
      subtext: topSgpa ? 'highest in batch' : 'data unavailable',
      icon: Trophy,
      color: 'text-accent-violet',
      borderColor: 'border-accent-violet/20',
      isInteger: false,
    },
    {
      title: 'Clean Records',
      value: cleanRecords ?? 0,
      subtext: cleanRecords !== null ? 'students with 0 backs' : 'data unavailable',
      icon: ShieldCheck,
      color: 'text-accent-success',
      borderColor: 'border-accent-success/20',
      isInteger: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`glass-panel rounded-xl p-5 flex flex-col justify-between border ${card.borderColor} hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {card.title}
              </span>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <div className={`text-2xl md:text-3xl font-mono font-bold tracking-tight ${card.color}`}>
                {card.value > 0 ? (
                  <AnimatedNumber
                    value={card.value}
                    decimals={card.isInteger ? 0 : 2}
                    enabled={true}
                  />
                ) : (
                  <span className="text-text-tertiary text-lg">N/A</span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 font-medium">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
