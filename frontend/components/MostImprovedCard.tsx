'use client';

import { useEffect, useState } from 'react';
import { fetchSemesterLeaderboard, SemesterResult, Student } from '@/lib/api';
import { TrendingUp, Zap } from 'lucide-react';

type SemEntry = SemesterResult & { students: Student };

export default function TopPerformerCard() {
  const [topStudent, setTopStudent] = useState<SemEntry | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Try the highest-available semester: 3 → 2 → 1
    const tryFetch = async () => {
      for (const sem of [3, 2, 1]) {
        try {
          const res = await fetchSemesterLeaderboard(sem, undefined, 1);
          if (res.data.length > 0) {
            setTopStudent(res.data[0]);
            setSemester(sem);
            break;
          }
        } catch {
          // try next sem
        }
      }
      setLoaded(true);
    };
    tryFetch();
  }, []);

  if (!loaded || !topStudent) return null;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="glass-panel rounded-[1.75rem] p-6 relative overflow-hidden border border-accent-violet/15 hover:border-accent-violet/30 transition-all duration-300 group">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent-violet/6 rounded-full blur-2xl transition-all duration-500 group-hover:w-52 group-hover:h-52" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-accent-violet/30 to-transparent" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent-violet/10 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-accent-violet" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">
              Top of Semester {semester}
            </p>
          </div>
        </div>

        {/* Student info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-violet/10 border border-accent-violet/30 flex items-center justify-center text-accent-violet font-bold text-sm shrink-0">
            {getInitials(topStudent.students.name)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm truncate">
              {topStudent.students.name}
            </p>
            <p className="text-[11px] text-text-secondary font-mono">{topStudent.roll_number}</p>
            <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider mt-0.5">
              {topStudent.students.branch === 'CSE_AIML' ? 'CSE AI/ML' : topStudent.students.branch}
            </p>
          </div>
          <div className="ml-auto text-right shrink-0">
            <p className="font-mono text-2xl font-black text-accent-violet">
              {topStudent.sgpa?.toFixed(2) ?? 'N/A'}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-text-tertiary font-bold">SGPA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
