'use client';

import React, { useState } from 'react';
import { LeaderboardEntry, fetchStudentDetails, StudentDetails } from '@/lib/api';
import { ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  startIndex?: number;
}

export default function LeaderboardTable({ entries, startIndex = 4 }: LeaderboardTableProps) {
  const [expandedRoll, setExpandedRoll] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<{ [roll: string]: StudentDetails }>({});
  const [loadingDetails, setLoadingDetails] = useState<{ [roll: string]: boolean }>({});
  const [openedRolls, setOpenedRolls] = useState<Set<string>>(new Set());

  const toggleRow = async (rollNumber: string) => {
    if (rollNumber === '2405110100040') {
      toast.error('Nice try! but get better.');
      return;
    }

    setOpenedRolls((prev) => {
      const next = new Set(prev);
      next.add(rollNumber);
      return next;
    });

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
        console.error('Failed to fetch student details', err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [rollNumber]: false }));
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (entries.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center mt-8">
        <p className="text-text-secondary">No records found matching filters.</p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-border-subtle bg-bg-glass overflow-hidden mt-8 w-full">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
          <thead className="sticky top-0 bg-bg-secondary/90 backdrop-blur-md z-20">
            <tr>
              <th className="pl-4 pr-1 py-6 font-sans text-[11px] font-bold text-text-secondary uppercase tracking-[0.12em] w-[8%]">Rank</th>
              <th className="px-2 py-6 font-sans text-[11px] font-bold text-text-secondary uppercase tracking-[0.12em] w-[42%]">Name</th>
              <th className="px-6 py-6 font-sans text-[11px] font-bold text-text-secondary uppercase tracking-[0.12em] w-[20%]">Branch</th>
              <th className="px-6 py-6 font-sans text-[11px] font-bold text-text-secondary uppercase tracking-[0.12em] text-center w-[15%]">Semesters</th>
              <th className="px-6 py-6 font-sans text-[11px] font-bold text-text-secondary uppercase tracking-[0.12em] text-center w-[10%]">SGPA</th>
              <th className="px-6 py-6 w-[5%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {entries.map((entry, index) => {
              const rank = index + startIndex;
              const isExpanded = expandedRoll === entry.roll_number;
              const hasBacks = entry.has_backs || entry.total_backs > 0;
              const details = studentDetails[entry.roll_number];
              const isLoading = loadingDetails[entry.roll_number];
 
              // Styling based on rank
              let rowClass = "transition-all duration-300 ease-out cursor-pointer animate-tr-fade ";
              let rankColor = "text-text-primary";
              let badgeColor = "border-border-subtle";

              if (rank === 1) {
                rowClass += "bg-accent-gold/5 hover:bg-accent-gold/10 group";
                rankColor = "text-accent-gold";
                badgeColor = "border-accent-gold";
              } else if (rank === 2) {
                rowClass += "bg-accent-primary/5 hover:bg-accent-primary/10 group";
                rankColor = "text-accent-primary";
                badgeColor = "border-accent-primary";
              } else if (rank === 3) {
                rowClass += "bg-accent-bronze/5 hover:bg-accent-bronze/10 group";
                rankColor = "text-accent-bronze";
                badgeColor = "border-accent-bronze";
              } else {
                rowClass += "hover:bg-bg-tertiary group";
              }

              return (
                <React.Fragment key={entry.id}>
                  {/* Main Row */}
                  <tr
                    onClick={() => toggleRow(entry.roll_number)}
                    className={rowClass}
                    style={{ animationDelay: `${Math.min(index, 20) * 45}ms`, animationFillMode: 'both' }}
                  >
                    <td className="relative pl-4 pr-1 py-6">
                      {/* Left hover indicator line */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent-primary to-accent-violet rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <span className={`font-sans text-lg font-extrabold tracking-tight ${rankColor}`}>
                        {rank.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-2 py-6">
                      <div className="flex items-center gap-4">
                        {rank === 1 ? (
                          <div className={`w-10 h-10 rounded-full border ${badgeColor} flex items-center justify-center font-bold bg-bg-secondary ${rankColor} transition-transform duration-300 group-hover:scale-105 avatar-float avatar-gold-pulse`}>
                            {getInitials(entry.students.name)}
                          </div>
                        ) : rank <= 3 ? (
                          <div className={`w-10 h-10 rounded-full border ${badgeColor} flex items-center justify-center font-bold bg-bg-secondary ${rankColor} transition-transform duration-300 group-hover:scale-105`}>
                            {getInitials(entry.students.name)}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-subtle transition-transform duration-300 group-hover:scale-105">
                            <span className="font-sans text-[11px] font-bold text-text-secondary">{getInitials(entry.students.name)}</span>
                          </div>
                        )}
                        <div>
                          <p className={`font-sans text-[14px] font-bold tracking-tight mb-0.5 ${rank <= 3 ? rankColor : 'text-text-primary'}`}>
                            {entry.students.name}
                          </p>
                          <p className="font-mono text-xs text-text-secondary">{entry.roll_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-text-primary font-sans text-[13px] font-medium truncate">
                      {entry.students.branch === 'CSE_AIML' ? 'CSE AI/ML' : entry.students.branch}
                    </td>
                    <td className="px-6 py-6 font-sans text-[13px] font-medium text-center">
                      {entry.total_semesters_submitted}
                    </td>
                    <td className="px-6 py-6 font-sans text-base font-extrabold text-center">
                      <span className={rank <= 3 ? rankColor : 'text-text-primary'}>
                        {entry.overall_sgpa ? entry.overall_sgpa.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center text-text-secondary">
                      <ChevronDown
                        className={`w-5 h-5 transition-all duration-300 ease-out
                          ${isExpanded
                            ? 'rotate-180 opacity-100 text-accent-primary'
                            : 'rotate-0 opacity-0 group-hover:opacity-100'
                          }`}
                      />
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {openedRolls.has(entry.roll_number) && (
                    <tr className={`${isExpanded ? (rank === 1 ? 'bg-accent-gold/5' : rank === 2 ? 'bg-accent-primary/5' : rank === 3 ? 'bg-accent-bronze/5' : '') : 'pointer-events-none h-0 overflow-hidden'}`}>
                      <td colSpan={6} className="p-0">
                        <div className={`expand-wrapper ${isExpanded ? 'open' : ''}`}>
                          <div>
                            <div className="px-8 pb-8 pt-2">
                              <div className="glass-podium border border-border-subtle/50 rounded-2xl p-8 shadow-2xl">
                                <div className="flex justify-between items-start mb-8">
                                <h3 className={`font-sans text-lg font-bold tracking-tight ${rank <= 3 ? rankColor : 'text-text-primary'}`}>
                                  {entry.students.name} — {entry.students.branch} — <span className="font-mono text-xs text-text-secondary">Roll: {entry.roll_number}</span>
                                </h3>
                                <button
                                  onClick={() => toggleRow(entry.roll_number)}
                                  className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all duration-200 active:scale-95 active:opacity-75 underline decoration-dotted underline-offset-4"
                                >
                                  <X className="w-4 h-4" />
                                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider">Close Details</span>
                                </button>
                              </div>

                              {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-bg-primary/50 border border-white/5 rounded-xl p-5 space-y-4">
                                      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <div className="skeleton-shimmer h-4 w-24 rounded" />
                                        <div className="skeleton-shimmer h-4 w-12 rounded" />
                                      </div>
                                      <div className="space-y-3">
                                        {[...Array(4)].map((_, j) => (
                                          <div key={j} className="space-y-1.5">
                                            <div className="flex justify-between">
                                              <div className="skeleton-shimmer h-3 w-32 rounded" />
                                              <div className="skeleton-shimmer h-3 w-16 rounded" />
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                              <div className="skeleton-shimmer h-full w-full" />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : details ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {details.semesters.map((sem, semIndex) => (
                                    <div
                                      key={sem.id}
                                      className="bg-bg-primary/50 border border-white/5 rounded-xl p-5 animate-fade-in-up"
                                      style={{
                                        animationDelay: `${semIndex * 100}ms`,
                                        animationFillMode: 'both'
                                      }}
                                    >
                                      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <h4 className="font-sans text-[11px] font-bold text-text-primary uppercase tracking-wider">Semester {sem.semester}</h4>
                                        <span className="font-sans text-xs text-accent-primary font-extrabold">SGPA: {sem.sgpa ? sem.sgpa.toFixed(2) : 'N/A'}</span>
                                      </div>
                                      <ul className="space-y-4">
                                        {sem.subjects.map((sub, subIndex) => {
                                          const maxMarks = sub.total_marks || 100;
                                          const obtained = (sub.internal_marks || 0) + (sub.external_marks || 0);
                                          const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;

                                          return (
                                            <li key={sub.id} className="flex flex-col gap-1.5">
                                              <div className="flex justify-between text-[12px] font-sans">
                                                <span className="text-text-secondary font-medium truncate pr-2 max-w-[180px]">{sub.subject_name}</span>
                                                <span className="text-accent-primary font-bold whitespace-nowrap">
                                                  {sub.grade || '-'} | {obtained}/{maxMarks}
                                                </span>
                                              </div>
                                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-accent-primary animate-bar-fill"
                                                  style={{
                                                    '--bar-target': `${Math.min(100, percentage)}%`,
                                                    animationDelay: `${subIndex * 50}ms`,
                                                    animationFillMode: 'both'
                                                  } as React.CSSProperties}
                                                />
                                              </div>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                  <div className="text-center py-8 text-accent-danger font-sans text-xs font-bold uppercase tracking-wider">Failed to load detailed records.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
