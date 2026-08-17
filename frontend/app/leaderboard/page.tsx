'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/api';
import FilterBar, { FilterState } from '@/components/FilterBar';
import LeaderboardTable from '@/components/LeaderboardTable';
import Podium from '@/components/Podium';
import ScrollReveal from '@/components/ScrollReveal';
import { Loader2, Award, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const PAGE_SIZE = 10;

/** 8 skeleton rows while leaderboard data loads */
function LeaderboardSkeleton() {
  return (
    <section className="rounded-3xl border border-border-subtle bg-bg-glass overflow-hidden mt-8 w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
          <thead className="sticky top-0 bg-bg-secondary/90 backdrop-blur-md z-20">
            <tr>
              {['8%', '42%', '20%', '15%', '10%', '5%'].map((w, i) => (
                <th key={i} style={{ width: w }} className="px-6 py-6">
                  <div className="skeleton-shimmer h-3 rounded-full w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="animate-tr-fade" style={{ animationDelay: `${i * 60}ms` }}>
                <td className="px-6 py-5"><div className="skeleton-shimmer h-9 w-9 rounded-full" /></td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="skeleton-shimmer h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="skeleton-shimmer h-3 rounded-full w-3/4" />
                      <div className="skeleton-shimmer h-2 rounded-full w-1/2" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5"><div className="skeleton-shimmer h-3 rounded-full w-20" /></td>
                <td className="px-6 py-5"><div className="skeleton-shimmer h-3 rounded-full w-8 mx-auto" /></td>
                <td className="px-6 py-5"><div className="skeleton-shimmer h-4 rounded-full w-12 mx-auto" /></td>
                <td className="px-6 py-5"><div className="skeleton-shimmer h-4 w-4 rounded mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function LeaderboardPage() {
  // Top 3 for podium — derived from the filtered dataset, not a separate API call
  const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
  const [top3Loading, setTop3Loading] = useState(true);

  // Paginated list entries (rank 4+)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Local name search (client-side)
  const [localSearch, setLocalSearch] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    branch: '',
    sort: 'sgpa',
    order: 'desc',
  });

  // ── Load top 3 + paginated list from same filtered fetch ──────────────────
  const loadPage = useCallback(
    (currentPage: number, activeFilters: FilterState) => {
      setLoading(true);
      if (currentPage === 0) {
        setTop3Loading(true);
      }
      setError(null);

      if (currentPage === 0) {
        // First page: fetch top 3 + list rows together from offset 0
        fetchLeaderboard({
          branch: activeFilters.branch || undefined,
          sort: activeFilters.sort,
          order: activeFilters.order,
          limit: PAGE_SIZE + 3 + 1, // top3 + page rows + peek-ahead
          offset: 0,
        })
          .then((res) => {
            const all = res.data;
            setTop3(all.slice(0, 3));
            setTop3Loading(false);
            setEntries(all.slice(3, 3 + PAGE_SIZE));
            setTotalCount(all.length > PAGE_SIZE + 3 ? (1 + 1) * PAGE_SIZE : Math.max(0, all.length - 3));
            setLoading(false);
          })
          .catch((err) => {
            setTop3Loading(false);
            setError(err.message || 'Failed to fetch leaderboard');
            setLoading(false);
          });
      } else {
        // Subsequent pages: fetch paginated list only (podium stays from page 0 fetch)
        const offset = 3 + currentPage * PAGE_SIZE;
        fetchLeaderboard({
          branch: activeFilters.branch || undefined,
          sort: activeFilters.sort,
          order: activeFilters.order,
          limit: PAGE_SIZE + 1,
          offset,
        })
          .then((res) => {
            setEntries(res.data.slice(0, PAGE_SIZE));
            setTotalCount(res.data.length > PAGE_SIZE ? (currentPage + 2) * PAGE_SIZE : (currentPage + 1) * PAGE_SIZE - (PAGE_SIZE - res.data.slice(0, PAGE_SIZE).length));
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message || 'Failed to fetch leaderboard');
            setLoading(false);
          });
      }
    },
    []
  );

  useEffect(() => {
    setPage(0);
    loadPage(0, filters);
  }, [filters, loadPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadPage(newPage, filters);
    document.getElementById('leaderboard-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Local client-side filter by name/roll
  const filteredEntries = entries.filter((entry) => {
    if (!localSearch.trim()) return true;
    const q = localSearch.toLowerCase();
    return (
      entry.roll_number.toLowerCase().includes(q) ||
      entry.students.name.toLowerCase().includes(q)
    );
  });

  const hasNextPage = entries.length === PAGE_SIZE;
  const hasPrevPage = page > 0;
  const listStartRank = 4 + page * PAGE_SIZE;

  return (
    <div className="flex-1 pt-8 pb-28 max-w-7xl mx-auto px-4 md:px-8 w-full">
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

      {/* Local search — fast client-side filter */}
      <ScrollReveal delay={80} direction="up">
        <div className="relative max-w-md mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Quick search by name or roll number…"
            className="w-full input-glass rounded-2xl pl-11 pr-4 py-3 text-sm"
          />
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
          <LeaderboardSkeleton />
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
                <p className="text-xs text-text-secondary font-mono">
                  Showing ranks{' '}
                  <span className="text-text-primary font-bold">{listStartRank}</span>
                  {' '}–{' '}
                  <span className="text-text-primary font-bold">
                    {listStartRank + filteredEntries.length - 1}
                  </span>
                </p>

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
    </div>
  );
}
