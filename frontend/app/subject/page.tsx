'use client';

import { useEffect, useState } from 'react';
import { fetchSubjectToppers, SubjectToppers } from '@/lib/api';
import ScrollReveal from '@/components/ScrollReveal';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';

export default function SubjectToppersPage() {
  const [toppersList, setToppersList] = useState<SubjectToppers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available semesters discovered dynamically from data
  const [availableSems, setAvailableSems] = useState<number[]>([]);
  const [semsLoading, setSemsLoading] = useState(true);
  const [semester, setSemester] = useState<number | null>(null);
  const [branch, setBranch] = useState('');

  const branches = [
    { value: '', label: 'All Branches' },
    { value: 'CSE', label: 'CSE' },
    { value: 'CSE_AIML', label: 'CSE AI/ML' },
    { value: 'CST', label: 'CST' },
  ];

  // On mount: probe all 8 semesters in parallel to see which have data
  useEffect(() => {
    const probeAll = async () => {
      setSemsLoading(true);
      const checks = await Promise.allSettled(
        [1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
          fetchSubjectToppers(s).then((res) => ({ sem: s, hasData: res.data.length > 0 }))
        )
      );
      const available = checks
        .filter(
          (r): r is PromiseFulfilledResult<{ sem: number; hasData: boolean }> =>
            r.status === 'fulfilled' && r.value.hasData
        )
        .map((r) => r.value.sem);

      setAvailableSems(available);
      // Default to the highest available semester
      if (available.length > 0) {
        const highest = available[available.length - 1];
        setSemester(highest);
      }
      setSemsLoading(false);
    };

    probeAll();
  }, []);

  const loadSubjectToppers = (sem: number, br: string) => {
    setLoading(true);
    setError(null);

    fetchSubjectToppers(sem, br || undefined)
      .then((res) => {
        setToppersList(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load subject toppers');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (semester !== null) {
      loadSubjectToppers(semester, branch);
    }
  }, [semester, branch]);

  return (
    <div className="flex-1 pt-8 pb-28 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-7">
      {/* Page Header */}
      <ScrollReveal direction="down" duration={500}>
        <div className="page-header mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-accent-gold" />
                </div>
                <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
                  Subject <span className="text-gradient-gold">Toppers</span>
                </h1>
              </div>
              <p className="text-[13px] text-text-secondary pl-11">
                Top-performing students across each subject module.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap pl-11 md:pl-0">
              {/* Branch Selector */}
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="input-glass rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.value} value={b.value} className="bg-bg-secondary normal-case font-normal">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Dynamic Semester Tabs */}
      {semsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-shimmer h-9 w-24 rounded-full" />
          ))}
        </div>
      ) : availableSems.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {availableSems.map((s) => (
            <button
              key={s}
              onClick={() => setSemester(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                semester === s
                  ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                  : 'bg-bg-secondary/50 border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-primary/30'
              }`}
            >
              Sem {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-text-secondary text-sm">No semester data found.</div>
      )}

      {/* Main Grid */}
      {loading || semsLoading ? (
        <div className="glass-panel rounded-xl p-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
          <span className="text-text-secondary text-sm font-medium">Parsing subject scorers...</span>
        </div>
      ) : error ? (
        <div className="glass-panel border-accent-danger/20 bg-accent-danger/5 rounded-xl p-12 text-center max-w-md mx-auto space-y-4 animate-fade-in-up">
          <div className="w-12 h-12 bg-accent-danger/15 rounded-full flex items-center justify-center mx-auto text-accent-danger animate-glow-pulse">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-text-primary">Failed to Load Toppers</h3>
            <p className="text-xs text-text-secondary mt-1">{error}</p>
          </div>
          <button
            onClick={() => semester !== null && loadSubjectToppers(semester, branch)}
            className="inline-flex items-center justify-center rounded-lg bg-bg-tertiary border border-border-subtle hover:bg-bg-tertiary/75 px-4 py-2 text-xs font-semibold text-text-primary active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : toppersList.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center text-text-secondary md:animate-fade-in-up">
          <div className="w-12 h-12 bg-bg-tertiary border border-border-subtle rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <span className="text-xl">∅</span>
          </div>
          No records submitted for Semester {semester} yet. Try uploading results first!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
          {toppersList.map((subject, subjectIndex) => (
            <div
              key={subject.subject_code}
              className="glass-panel glass-panel-hover rounded-[20px] p-5 md:p-6 flex flex-col justify-between relative overflow-hidden md:animate-fade-in-up"
              style={{ animationDelay: `${subjectIndex * 50}ms` }}
            >
              {/* Background watermark of the subject code */}
              <div className="absolute -right-4 -top-4 text-[70px] font-bold text-text-primary/[0.02] font-syne select-none pointer-events-none transform rotate-12">
                {subject.subject_code.split('-')[0]}
              </div>

              {/* Accent gradient top line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary via-accent-violet to-accent-cyan opacity-80" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Subject Header */}
                <div className="mb-6">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-bg-secondary border border-border-subtle font-mono text-[11px] text-accent-primary font-bold tracking-[0.2em] uppercase mb-2">
                    {subject.subject_code}
                  </span>
                  <h3 className="font-syne font-black text-xl md:text-2xl lg:text-3xl text-text-primary leading-[1.2] tracking-tight">
                    {subject.subject_name}
                  </h3>
                </div>

                {/* Toppers List */}
                <div className="space-y-2.5 mt-auto">
                  {subject.top_3.map((mark, i) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const colorMap = [
                      'bg-accent-gold/10 border-accent-gold/30',
                      'bg-accent-silver/5 border-accent-silver/20',
                      'bg-accent-bronze/5 border-accent-bronze/20',
                    ];
                    const glowMap = [
                      'shadow-[0_0_12px_rgba(245,200,66,0.12)]',
                      'shadow-[0_0_12px_rgba(192,192,192,0.08)]',
                      'shadow-[0_0_12px_rgba(205,127,50,0.08)]',
                    ];
                    const textMap = [
                      'text-accent-gold',
                      'text-text-primary',
                      'text-accent-bronze',
                    ];

                    return (
                      <div
                        key={mark.id}
                        className={`flex items-center justify-between p-2.5 md:p-3.5 rounded-xl border ${colorMap[i]} ${glowMap[i]} transition-all table-row-glow animate-row-reveal backdrop-blur-sm group`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-primary/50 border border-white/5 text-lg group-hover:scale-110 transition-transform">
                            {medals[i]}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm md:text-base font-bold font-figtree block truncate ${textMap[i]}`}>
                              {mark.students.name}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-white font-semibold tracking-wider uppercase">
                              {mark.students.branch === 'CSE_AIML' ? 'CSE AI/ML' : mark.students.branch}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <div className="flex items-baseline gap-0.5">
                            <span className={`font-mono text-base md:text-lg font-black ${textMap[i]}`}>
                              {mark.total_marks ?? '-'}
                            </span>
                            <span className="text-text-tertiary font-mono text-[9px]">pts</span>
                          </div>
                          <span className="inline-block px-1 py-0.5 mt-0.5 bg-bg-primary/50 rounded text-[8px] text-text-secondary font-bold border border-white/5">
                            Grade {mark.grade || '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

