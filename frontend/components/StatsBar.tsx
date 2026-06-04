'use client';

import { useEffect, useState } from 'react';
import { fetchStats, BatchStats } from '@/lib/api';
import { Users, FileSpreadsheet, Percent, AlertCircle } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-6 animate-pulse h-28" />
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

  const cards = [
    {
      title: 'Submitted Results',
      value: `${stats.total_submitted}`,
      subtext: `of ${stats.total_students} students (${submissionPercentage}%)`,
      icon: FileSpreadsheet,
      color: 'text-accent-primary',
    },
    {
      title: 'Batch Average SGPA',
      value: stats.average_sgpa > 0 ? stats.average_sgpa.toFixed(2) : 'N/A',
      subtext: 'cumulative average',
      icon: Percent,
      color: 'text-accent-gold',
    },
    {
      title: 'Total Batch Size',
      value: `${stats.total_students}`,
      subtext: 'registered students',
      icon: Users,
      color: 'text-accent-muted',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="glass-panel glass-panel-hover rounded-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                {card.title}
              </span>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-text-primary tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-text-secondary mt-1 font-medium">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
