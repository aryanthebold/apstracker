'use client';

import { LeaderboardEntry } from '@/lib/api';

interface PodiumProps {
  topEntries: LeaderboardEntry[];
}

export default function Podium({ topEntries }: PodiumProps) {
  if (topEntries.length === 0) return null;

  // topEntries is expected to be sorted by rank (index 0 is Rank 1, etc.)
  const rank1 = topEntries[0];
  const rank2 = topEntries[1];
  const rank3 = topEntries[2];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <section className="mt-8 mb-16 relative">
      <div className="absolute inset-0 bg-accent-primary/5 blur-[120px] rounded-full -z-10 translate-y-[-50%] pointer-events-none"></div>
      <div className="flex flex-col md:flex-row items-end justify-center gap-8 md:gap-0 mt-20">

        {/* Rank 2 */}
        {rank2 && (
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-2xl border-2 border-accent-primary/30 group-hover:border-accent-primary transition-all duration-500 bg-bg-secondary flex items-center justify-center">
                <span className="text-4xl font-bold text-accent-primary">{getInitials(rank2.students.name)}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-bg-tertiary px-3 py-1 rounded-full border border-border-subtle">
                <span className="font-mono text-sm text-accent-primary">#2</span>
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="font-syne text-xl font-bold text-text-primary">{rank2.students.name}</h2>
              <p className="text-xs text-text-secondary uppercase tracking-widest mt-1">
                {rank2.students.branch}
              </p>
            </div>
            <div className="glass-podium blue-glow border-t border-x border-accent-primary/20 h-40 md:h-48 w-full rounded-t-3xl flex flex-col items-center justify-center p-6 bg-accent-primary/5">
              <span className="font-mono text-xl text-accent-primary font-bold">
                {rank2.overall_sgpa ? rank2.overall_sgpa.toFixed(2) : 'N/A'} SGPA
              </span>
            </div>
          </div>
        )}

        {/* Rank 1 */}
        {rank1 && (
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 group">
            <div className="relative mb-8 scale-110">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-accent-gold text-4xl leading-none">🏆</span>
              </div>
              <div className="w-40 h-40 rounded-3xl border-4 border-accent-gold group-hover:border-accent-gold/80 transition-all duration-500 bg-bg-secondary flex items-center justify-center shadow-lg">
                <span className="text-5xl font-bold text-accent-gold">{getInitials(rank1.students.name)}</span>
              </div>
              <div className="absolute -bottom-3 -right-3 bg-accent-gold px-4 py-1.5 rounded-full border border-accent-gold shadow-xl">
                <span className="font-mono text-sm text-bg-primary font-bold">TOPPER</span>
              </div>
            </div>
            <div className="text-center mb-8">
              <h2 className="font-syne text-3xl font-extrabold text-accent-gold">{rank1.students.name}</h2>
              <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest">
                {rank1.students.branch}
              </p>
            </div>
            <div className="glass-podium gold-glow border-t border-x border-accent-gold/20 h-56 md:h-64 w-full rounded-t-[40px] flex flex-col items-center justify-center p-8 bg-accent-gold/5">
              <span className="font-mono text-3xl text-accent-gold font-extrabold">
                {rank1.overall_sgpa ? rank1.overall_sgpa.toFixed(2) : 'N/A'} SGPA
              </span>
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="px-4 py-1 rounded-full border border-accent-gold/30 bg-accent-gold/10">
                  <span className="text-xs uppercase font-bold tracking-wider text-accent-gold">hahaha</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {rank3 && (
          <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-2xl border-2 border-accent-bronze/30 group-hover:border-accent-bronze transition-all duration-500 bg-bg-secondary flex items-center justify-center">
                <span className="text-4xl font-bold text-accent-bronze">{getInitials(rank3.students.name)}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-bg-tertiary px-3 py-1 rounded-full border border-border-subtle">
                <span className="font-mono text-sm text-accent-bronze">#3</span>
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="font-syne text-xl font-bold text-text-primary">{rank3.students.name}</h2>
              <p className="text-xs text-text-secondary uppercase tracking-widest mt-1">
                {rank3.students.branch}
              </p>
            </div>
            <div className="glass-podium bronze-glow border-t border-x border-accent-bronze/20 h-32 md:h-40 w-full rounded-t-3xl flex flex-col items-center justify-center p-6 bg-accent-bronze/5">
              <span className="font-mono text-xl text-accent-bronze font-bold">
                {rank3.overall_sgpa ? rank3.overall_sgpa.toFixed(2) : 'N/A'} SGPA
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
