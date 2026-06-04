'use client';

import { useState, useEffect } from 'react';
import { searchStudents, fetchStudentDetails, Student, StudentDetails } from '@/lib/api';
import { Search, Loader2, FileText, ChevronDown, ChevronUp, AlertCircle, UploadCloud } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

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
            placeholder="Search by name or roll number (min 3 chars)..."
            className="w-full input-glass rounded-2xl pl-11 pr-12 py-3.5 text-sm shadow-lg shadow-black/10"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-accent-primary" />
          )}
        </div>
      </ScrollReveal>

      {/* Results Container */}
      <div className="space-y-4 max-w-xl mx-auto">
        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-center text-xs text-text-secondary">
            Keep typing... Enter at least 3 characters.
          </p>
        )}

        {debouncedQuery.trim().length >= 3 && results.length === 0 && !loading && (
          <div className="glass-panel border-accent-gold/20 bg-accent-gold/5 rounded-xl p-8 text-center space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto text-accent-gold animate-glow-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-text-primary">No Record Found</h3>
              <p className="text-xs text-text-secondary mt-1">
                We couldn't find any student matching &quot;{debouncedQuery}&quot;.
              </p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center rounded-lg bg-accent-primary hover:bg-accent-primary/95 text-white font-semibold px-4 py-2 text-xs transition-all active:scale-95 active:opacity-70 hover:-translate-y-0.5"
            >
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
              Upload Their Result
            </Link>
          </div>
        )}

        {results.map((student) => {
          const isExpanded = expandedRoll === student.roll_number;
          const details = studentDetails[student.roll_number];
          const isLoading = loadingDetails[student.roll_number];

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
                    <h3 className="font-semibold text-sm text-text-primary leading-tight">
                      {student.name}
                    </h3>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                      {student.roll_number} · {student.branch === 'CSE_AIML' ? 'CSE AI/ML' : student.branch}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
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
                    <div className="space-y-4">
                      {/* Overall stats */}
                      {details.result && (
                        <div className="grid grid-cols-1 bg-bg-primary/50 border border-border-subtle/80 rounded-lg p-3 text-xs">
                          <div>
                            <span className="text-text-secondary block">Overall SGPA:</span>
                            <span className="font-mono font-bold text-accent-primary text-base">
                              {details.result.overall_sgpa ? details.result.overall_sgpa.toFixed(2) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Semesters list */}
                      <div className="space-y-4">
                        {details.semesters.map((sem) => (
                          <div
                            key={sem.id}
                            className="bg-bg-primary/30 border border-border-subtle rounded-lg p-3 space-y-2 animate-fade-in-up"
                          >
                            <div className="flex justify-between items-center border-b border-border-subtle pb-1.5">
                              <span className="font-bold text-xs text-text-primary">
                                Semester {sem.semester}
                              </span>
                              <span className="font-mono font-bold text-accent-primary text-xs">
                                SGPA: {sem.sgpa ? sem.sgpa.toFixed(2) : 'N/A'}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {sem.subjects.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex justify-between items-center text-[11px] text-text-secondary"
                                >
                                  <span className="truncate max-w-[240px] font-medium text-text-primary">
                                    {sub.subject_name}
                                  </span>
                                  <div className="flex gap-2">
                                    <span className="font-mono text-[9px]">
                                      {sub.internal_marks ?? '-'}+{sub.external_marks ?? '-'}
                                    </span>
                                    <span className="font-mono font-bold w-4 text-center text-text-primary">
                                      {sub.grade || '-'}
                                    </span>
                                  </div>
                                </div>
                              ))}
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
    </div>
  );
}
