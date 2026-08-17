'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchStudents, fetchStudentDetails, Student, StudentDetails } from '@/lib/api';
import { Search, Loader2, FileText, ChevronDown, ChevronUp, AlertCircle, UploadCloud, Award, Share2, Check } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import AnimatedNumber from '@/components/AnimatedNumber';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('q') || '');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);

  const [expandedRoll, setExpandedRoll] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<{ [roll: string]: StudentDetails }>({});
  const [loadingDetails, setLoadingDetails] = useState<{ [roll: string]: boolean }>({});

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchStudents(debouncedQuery)
      .then((res) => {
        setResults(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [debouncedQuery]);

  const toggleDetails = async (rollNumber: string) => {
    if (rollNumber === '2405110100040') {
      toast.error('Nice try! but get better.');
      return;
    }

    if (expandedRoll === rollNumber) {
      setExpandedRoll(null);
      return;
    }

    setExpandedRoll(rollNumber);

    if (!studentDetails[rollNumber] && !loadingDetails[rollNumber]) {
      setLoadingDetails((prev) => ({ ...prev, [rollNumber]: true }));
      try {
        const details = await fetchStudentDetails(rollNumber);
        setStudentDetails((prev) => ({ ...prev, [rollNumber]: details }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [rollNumber]: false }));
      }
    }
  };

  const handleShare = async (rollNumber: string) => {
    const url = `${window.location.origin}/search?q=${rollNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedRoll(rollNumber);
      setTimeout(() => setCopiedRoll(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex-1 pt-8 pb-28 px-4 md:px-8 max-w-4xl mx-auto w-full space-y-7">
      {/* Page Header */}
      <ScrollReveal direction="down" duration={500}>
        <div className="page-header mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent-success/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-accent-success" />
            </div>
            <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
              Student <span className="text-gradient-blue">Search</span>
            </h1>
          </div>
          <p className="text-[13px] text-text-secondary pl-11">
            Lookup marksheets, report cards, and semester-wise results for any student.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100} direction="up">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or roll number..."
            autoFocus
            className="w-full input-glass rounded-2xl pl-11 pr-12 py-3.5 text-sm shadow-lg shadow-black/10"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-accent-primary" />
          )}
        </div>
      </ScrollReveal>

      {/* Results Container */}
      <ScrollReveal delay={200} direction="up" className="w-full">
        <div className="space-y-4 max-w-xl mx-auto">
        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-center text-xs text-text-secondary">
            Keep typing... Enter at least 3 characters.
          </p>
        )}

        {debouncedQuery.trim().length >= 3 && results.length === 0 && !loading && (
          <div className="glass-panel rounded-xl p-10 text-center space-y-5 animate-fade-in-up">
            <div className="text-4xl">😕</div>
            <div>
              <h3 className="font-syne font-bold text-text-primary text-lg">
                Couldn&apos;t find &quot;{debouncedQuery}&quot; in our records.
              </h3>
              <p className="text-sm text-text-secondary mt-2">
                Know them? Help your batch out!
              </p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:-translate-y-0.5 animate-pulse"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #9B59B6)', boxShadow: '0 0 20px rgba(233,30,140,0.4)' }}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Wanna help me? Upload their result ↑
            </Link>
          </div>
        )}

        {results.map((student) => {
          const isExpanded = expandedRoll === student.roll_number;
          const details = studentDetails[student.roll_number];
          const isLoading = loadingDetails[student.roll_number];
          const studentRank = student.rank || details?.result?.rank;

          return (
            <div
              key={student.id}
              className={`glass-panel rounded-xl overflow-hidden transition-all table-row-glow animate-row-reveal ${isExpanded ? 'border-accent-primary/30 shadow-lg shadow-accent-primary/5' : ''
                }`}
            >
              <div
                onClick={() => toggleDetails(student.roll_number)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer active:bg-bg-tertiary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-accent-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary leading-tight flex items-center gap-2">
                      {student.name}
                      {student.has_ufm && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold bg-red-500/20 text-red-500 border border-red-500/30">
                          UFM
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                      {student.roll_number} · {student.branch === 'CSE_AIML' ? 'CSE AI/ML' : student.branch}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 text-right">
                  {/* Share button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(student.roll_number); }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-200 ${
                      copiedRoll === student.roll_number
                        ? 'border-accent-success/40 text-accent-success bg-accent-success/10'
                        : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-primary/30'
                    }`}
                  >
                    {copiedRoll === student.roll_number ? (
                      <><Check className="h-3 w-3" /> Copied!</>
                    ) : (
                      <><Share2 className="h-3 w-3" /> Share</>
                    )}
                  </button>
                  {student.has_submitted && studentRank && (
                    <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-[10px] text-accent-gold bg-accent-gold/10 border border-accent-gold/20 shadow-sm">
                      <Award className="h-3 w-3 text-accent-gold" />
                      #{studentRank}
                    </span>
                  )}
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] border ${student.has_submitted
                          ? 'text-accent-success bg-accent-success/10 border-accent-success/20'
                          : 'text-accent-danger bg-accent-danger/10 border-accent-danger/20'
                        }`}
                    >
                      {student.has_submitted ? 'Submitted' : 'Not Submitted'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-all duration-300 ease-out ${isExpanded ? 'rotate-180 text-accent-primary' : 'rotate-0'}`} />
                </div>
              </div>

              <div className={`expand-wrapper ${isExpanded ? 'open' : ''}`}>
                <div>
                  <div className="bg-bg-secondary/40 border-t border-border-subtle p-4">
                    {!student.has_submitted ? (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-xs text-text-secondary">
                        This student hasn&apos;t submitted their results yet. Know them? Help upload their card!
                      </p>
                      <Link
                        href="/upload"
                        className="inline-flex items-center justify-center rounded-lg bg-accent-primary hover:bg-accent-primary/95 text-white font-semibold px-4 py-2 text-xs transition-all active:scale-95 active:opacity-70"
                      >
                        <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                        Upload Result PDF
                      </Link>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-text-secondary text-xs">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
                      <span>Parsing records...</span>
                    </div>
                  ) : details ? (
                    <div
                      className="space-y-4"
                      style={{
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        background: 'rgba(17, 19, 24, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                      }}
                    >
                      {/* Overall stats */}
                      {details.result && (
                        <div className="grid grid-cols-2 bg-bg-primary/50 border border-border-subtle/80 rounded-lg p-3 text-xs gap-2">
                          <div>
                            <span style={{ color: '#8B95A1' }} className="block text-xs">Overall CGPA:</span>
                            <span className="font-mono font-bold text-accent-primary" style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                              <AnimatedNumber value={details.result.overall_sgpa} enabled={isExpanded} />
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#8B95A1' }} className="block text-xs">Leaderboard Rank:</span>
                            <span className="font-mono font-bold text-accent-gold" style={{ fontSize: '18px', fontWeight: 600 }}>
                              {details.result.rank ? `#${details.result.rank}` : 'N/A'}
                            </span>
                          </div>
                          {details.result.raw_session_summary?.includes("UFM_FLAG") && (
                            <div className="col-span-2 pt-2 border-t border-border-subtle">
                              <span className="text-red-500 font-semibold block text-[11px] mb-0.5">UFM REMARKS</span>
                              <span className="text-[10px] text-text-secondary">
                                {details.result.raw_session_summary.split("UFM_FLAG:")[1]?.trim()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Semesters list */}
                      <div className="space-y-4">
                        {details.semesters.map((sem) => (
                          <div
                            key={sem.id}
                            className="bg-bg-primary/30 border border-border-subtle rounded-lg p-3 space-y-2 animate-fade-in-up"
                          >
                            {/* Semester header */}
                            <div className="flex justify-between items-center border-b border-border-subtle pb-1.5">
                              <span className="font-bold text-xs uppercase tracking-wider" style={{ color: '#4F8EF7', fontWeight: 600 }}>
                                Semester {sem.semester}
                              </span>
                              <span className="font-mono font-bold text-xs" style={{ color: '#8B95A1' }}>
                                SGPA:{' '}
                                <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>
                                  {sem.sgpa ? sem.sgpa.toFixed(2) : 'N/A'}
                                </span>
                              </span>
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-1 border-b border-border-subtle/50">
                              <span className="text-[10px] font-bold uppercase tracking-[0.05em]" style={{ color: '#8B95A1' }}>Subject</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-right" style={{ color: '#8B95A1' }}>Marks</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-right w-8" style={{ color: '#8B95A1' }}>Grade</span>
                            </div>

                            {/* Subject rows */}
                            <div className="space-y-1.5">
                              {sem.subjects.map((sub) => {
                                // Grade color mapping
                                const gradeColor: Record<string, string> = {
                                  'O': '#FFD700',
                                  'A+': '#3DDC84', 'A': '#3DDC84',
                                  'B+': '#4F8EF7', 'B': '#4F8EF7',
                                  'C': '#F5A623',
                                  'D': '#FF8C42',
                                  'E': '#FF5C5C',
                                  'F': '#FF5C5C',
                                };
                                const gradeC = gradeColor[sub.grade ?? ''] ?? '#FFFFFF';
                                const isCaType = sub.subject_type === 'CA' || sub.external_marks == null;

                                return (
                                  <div
                                    key={sub.id}
                                    className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                                  >
                                    <div>
                                      <span className="font-semibold truncate block" style={{ color: '#F0F2F5', fontWeight: 500, fontSize: '12px' }}>
                                        {sub.subject_name}
                                      </span>
                                      <span className="block" style={{ color: '#8B95A1', fontSize: '11px' }}>
                                        {sub.subject_type}
                                      </span>
                                    </div>
                                    <span className="font-mono text-right whitespace-nowrap" style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '11px' }}>
                                      {isCaType
                                        ? <>{sub.internal_marks ?? '-'} <span style={{ color: '#8B95A1' }}>CA</span></>
                                        : <>{sub.internal_marks ?? '-'} <span style={{ color: '#8B95A1' }}>+</span> {sub.external_marks ?? '-'} <span style={{ color: '#8B95A1' }}>=</span> {sub.total_marks ?? ((sub.internal_marks ?? 0) + (sub.external_marks ?? 0))}</>
                                      }
                                    </span>
                                    <span className="font-mono font-extrabold text-right w-8" style={{ color: gradeC, fontSize: '12px' }}>
                                      {sub.grade || '-'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                      <div className="text-center py-2 text-accent-danger text-xs">
                        Failed to parse details.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </ScrollReveal>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent-primary" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
