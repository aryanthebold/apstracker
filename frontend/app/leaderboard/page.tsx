'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/api';
import FilterBar, { FilterState } from '@/components/FilterBar';
import LeaderboardTable from '@/components/LeaderboardTable';
import Podium from '@/components/Podium';
import ScrollReveal from '@/components/ScrollReveal';
import { Loader2, Award, AlertCircle } from 'lucide-react';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    branch: '',
    sort: 'sgpa',
    order: 'desc',
    has_backs: null,
  });

  const loadLeaderboard = (activeFilters: FilterState) => {
    setLoading(true);
    setError(null);

    fetchLeaderboard({
      branch: activeFilters.branch || undefined,
      sort: activeFilters.sort,
      order: activeFilters.order,
      has_backs: activeFilters.has_backs !== null ? activeFilters.has_backs : undefined,
      limit: 100, // retrieve up to 100 on leaderboard at once
    })
      .then((res) => {
        setEntries(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch leaderboard');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLeaderboard(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const filteredEntries = entries.filter((entry) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return entry.roll_number.toLowerCase().includes(q) || entry.students.name.toLowerCase().includes(q);
  });

  return (
    <main className="flex-1 pt-8 pb-28 max-w-7xl mx-auto px-4 md:px-8 overflow-hidden w-full">
      {/* Page Header */}
      <ScrollReveal direction="down" duration={500}>
        <div className="page-header mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-accent-primary" />
            </div>
            <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
              <span className="text-gradient-blue">Leaderboard</span>
            </h1>
          </div>
          <p className="text-[13px] text-text-secondary pl-11">Ranked by cumulative SGPA · </p>
        </div>
      </ScrollReveal>

      {/* Filters */}
      <ScrollReveal delay={100} direction="up">
        <FilterBar onFilterChange={handleFilterChange} />
      </ScrollReveal>

      {/* Leaderboard Content */}
      {loading ? (
        <div className="glass-panel rounded-xl p-24 flex flex-col items-center justify-center gap-4 mt-8 animate-fade-in-up">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
          <span className="font-mono text-sm tracking-wider uppercase text-text-secondary animate-pulse">Loading rankings...</span>
        </div>
      ) : error ? (
        <div className="glass-panel border-accent-danger/20 bg-accent-danger/5 rounded-xl p-12 text-center max-w-md mx-auto space-y-4 mt-8 animate-fade-in-up">
          <div className="w-12 h-12 bg-accent-danger/15 rounded-full flex items-center justify-center mx-auto text-accent-danger animate-glow-pulse">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-text-primary text-xl">Failed to Load Rankings</h3>
            <p className="text-sm text-text-secondary mt-2">{error}</p>
          </div>
          <button
            onClick={() => loadLeaderboard(filters)}
            className="inline-flex items-center justify-center rounded-full bg-accent-danger/20 hover:bg-accent-danger/30 border border-accent-danger/50 px-6 py-2.5 text-xs font-mono tracking-wider uppercase font-bold text-accent-danger transition-colors mt-4 active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          <ScrollReveal delay={200} direction="scale" className="w-full">
            <Podium topEntries={filteredEntries.slice(0, 3)} />
          </ScrollReveal>
          <ScrollReveal delay={300} direction="up" className="w-full">
            <LeaderboardTable entries={filteredEntries.slice(3)} />
          </ScrollReveal>
        </>
      )}
    </main>
  );
}
