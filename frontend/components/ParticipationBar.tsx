'use client';

import { useEffect, useState } from 'react';
import { fetchStats } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ParticipationBar() {
  const [submitted, setSubmitted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        setSubmitted(data.total_submitted);
        setTotal(data.total_students);
        setLoaded(true);
      })
      .catch(() => {
        // Silently fail — this is supplemental UI
        setLoaded(true);
      });
  }, []);

  if (!loaded || total === 0) return null;

  const pct = Math.min(100, (submitted / total) * 100);
  const pctDisplay = pct.toFixed(1);

  // Color based on participation level
  let barColor = 'bg-accent-danger';
  if (pct >= 80) barColor = 'bg-accent-success';
  else if (pct >= 50) barColor = 'bg-accent-primary';
  else if (pct >= 10) barColor = 'bg-amber-400';

  let textColor = 'text-accent-danger';
  if (pct >= 80) textColor = 'text-accent-success';
  else if (pct >= 50) textColor = 'text-accent-primary';
  else if (pct >= 10) textColor = 'text-amber-400';

  return (
    <div className="w-full max-w-lg mx-auto space-y-2 animate-fade-in-up">
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">
          <span className={`font-bold ${textColor}`}>{submitted}</span>
          <span className="text-text-tertiary"> of {total} students submitted</span>
        </span>
        <span className={`font-mono font-bold text-xs ${textColor}`}>{pctDisplay}%</span>
      </div>

      {/* Bar track */}
      <div className="w-full h-2 bg-bg-secondary/60 rounded-full overflow-hidden border border-border-subtle/40">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* CTA */}
      <Link
        href="/upload"
        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${textColor} hover:opacity-80 transition-opacity`}
      >
        Upload yours and join the leaderboard <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
