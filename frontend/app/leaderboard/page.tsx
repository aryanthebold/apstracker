'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/api';
import FilterBar, { FilterState } from '@/components/FilterBar';
import LeaderboardTable from '@/components/LeaderboardTable';
import Podium from '@/components/Podium';
import ScrollReveal from '@/components/ScrollReveal';
import { Loader2, Award, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

export default function LeaderboardPage() {
  // All-time top 3 — never changes when paginating or filtering list
  const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
  const [top3Loading, setTop3Loading] = useState(true);

  // Paginated list entries (rank 4+)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0); // 0-based page index for the list (rank 4+)

  const [filters, setFilters] = useState<FilterState>({
    branch: '',
    sort: 'sgpa',
    order: 'desc',
    has_backs: null,
  });

  // ── Load fixed top-3 once ──────────────────────────────────────────────────
  useEffect(() => {
    setTop3Loading(true);
    fetchLeaderboard({ sort: 'sgpa', order: 'desc', limit: 3, offset: 0 })
      .then((res) => {
        setTop3(res.data);
        setTop3Loading(false);
      })
      .catch(() => setTop3Loading(false));
  }, []);

  // ── Load paginated list (rank 4+) ─────────────────────────────────────────
  const loadPage = useCallback(
    (currentPage: number, activeFilters: FilterState) => {
      setLoading(true);
      setError(null);

      // We fetch from offset 3 (skipping top 3) + current page offset
      const offset = 3 + currentPage * PAGE_SIZE;

      fetchLeaderboard({
        branch: activeFilters.branch || undefined,
        sort: activeFilters.sort,
        order: activeFilters.order,
        has_backs: activeFilters.has_backs !== null ? activeFilters.has_backs : undefined,
        limit: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
        offset,
      })
        .then((res) => {
          setEntries(res.data.slice(0, PAGE_SIZE));
          // If we got PAGE_SIZE+1 results, there's a next page
          setTotalCount(res.data.length > PAGE_SIZE ? (currentPage + 2) * PAGE_SIZE : (currentPage + 1) * PAGE_SIZE - (PAGE_SIZE - res.data.slice(0, PAGE_SIZE).length));
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch leaderboard');
          setLoading(false);
        });
    },
    []
  );

  // Re-fetch when filters change → reset to page 0
  useEffect(() => {
    setPage(0);
    loadPage(0, filters);
  }, [filters, loadPage]);

  // Re-fetch when page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadPage(newPage, filters);
    // Scroll to table smoothly
    document.getElementById('leaderboard-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Local name/roll filter applied on top of paginated entries
  const filteredEntries = entries.filter((entry) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      entry.roll_number.toLowerCase().includes(q) ||
      entry.students.name.toLowerCase().includes(q)
    );
  });

  const hasNextPage = entries.length === PAGE_SIZE;
  const hasPrevPage = page > 0;
  // Rank of first list entry = 4 (after podium) + page offset
  const listStartRank = 4 + page * PAGE_SIZE;

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

      {/* ── Podium — always shows global top 3 ── */}
      {top3Loading ? (
        <div className="glass-panel rounded-xl p-16 flex flex-col items-center justify-center gap-4 mt-8 animate-fade-in-up">
          <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
          <span className="font-mono text-sm tracking-wider uppercase text-text-secondary animate-pulse">
            Loading podium...
          </span>
        </div>
      ) : (
        <ScrollReveal delay={200} direction="scale" className="w-full">
          <Podium topEntries={top3} />
        </ScrollReveal>
      )}

      {/* ── Paginated list (rank 4+) ── */}
      <div id="leaderboard-list">
        {loading ? (
          <div className="glass-panel rounded-xl p-24 flex flex-col items-center justify-center gap-4 mt-8 animate-fade-in-up">
            <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
            <span className="font-mono text-sm tracking-wider uppercase text-text-secondary animate-pulse">
              Loading rankings...
            </span>
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
              onClick={() => loadPage(page, filters)}
              className="inline-flex items-center justify-center rounded-full bg-accent-danger/20 hover:bg-accent-danger/30 border border-accent-danger/50 px-6 py-2.5 text-xs font-mono tracking-wider uppercase font-bold text-accent-danger transition-colors mt-4 active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <ScrollReveal delay={300} direction="up" className="w-full">
            <LeaderboardTable entries={filteredEntries} startIndex={listStartRank} />

            {/* ── Pagination Controls ── */}
            {(hasPrevPage || hasNextPage) && (
              <div className="flex items-center justify-between mt-6 px-2">
                {/* Page info */}
                <p className="text-xs text-text-secondary font-mono">
                  Showing ranks{' '}
                  <span className="text-text-primary font-bold">{listStartRank}</span>
                  {' '}–{' '}
                  <span className="text-text-primary font-bold">
                    {listStartRank + filteredEntries.length - 1}
                  </span>
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPrevPage}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                      hasPrevPage
                        ? 'border-border-subtle bg-bg-secondary hover:bg-bg-tertiary text-text-primary hover:-translate-y-0.5 shadow-sm'
                        : 'border-border-subtle/30 bg-bg-secondary/30 text-text-secondary cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>

                  <span className="text-xs font-mono text-text-secondary px-1">
                    Page {page + 1}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                      hasNextPage
                        ? 'border-accent-primary/40 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary hover:-translate-y-0.5 shadow-sm shadow-accent-primary/10'
                        : 'border-border-subtle/30 bg-bg-secondary/30 text-text-secondary cursor-not-allowed'
                    }`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </ScrollReveal>
        )}
      </div>
    </main>
  );
}
