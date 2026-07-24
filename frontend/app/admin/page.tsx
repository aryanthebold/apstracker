'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminFetchAllStudents,
  adminFetchNotSubmitted,
  adminFetchBacks,
  adminDeleteStudentResult,
  adminFetchUFMStudents,
  adminUpdateStudent,
  searchStudents,
  fetchStudentDetails,
  Student,
  AdminBacks,
  StudentDetails,
  UFMStudent,
} from '@/lib/api';
import {
  Shield, Eye, Trash2, Loader2, AlertCircle, FileSpreadsheet, Layers, UserX,
  AlertOctagon, Search, Download, X, Filter, Award, BarChart2, AlertTriangle,
  CheckCircle, Pencil, Save, XCircle, TrendingUp, Users
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { toast } from 'react-hot-toast';

const BRANCHES = ['CSE', 'CSE_AIML', 'CST', 'CST_IOT'] as const;

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'all' | 'backs' | 'pending' | 'search' | 'ufm'>('overview');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [backsData, setBacksData] = useState<AdminBacks | null>(null);
  const [ufmStudents, setUfmStudents] = useState<UFMStudent[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Inline edit state
  const [editingRoll, setEditingRoll] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please enter the admin secret key');
      return;
    }
    setLoading(true);
    adminFetchAllStudents(token)
      .then((res) => {
        setStudents(res.data);
        setIsAuthorized(true);
        setLoading(false);
        toast.success('Access authorized');
      })
      .catch(() => {
        setError('Invalid admin secret key');
        setLoading(false);
        toast.error('Authorization failed');
      });
  };

  const loadData = () => {
    if (!token || !isAuthorized) return;
    setLoading(true);

    Promise.all([
      adminFetchAllStudents(token),
      adminFetchNotSubmitted(token),
      adminFetchBacks(token),
      adminFetchUFMStudents(token),
    ])
      .then(([allRes, notSubRes, backsRes, ufmRes]) => {
        setStudents(allRes.data);
        setPendingStudents(notSubRes.data);
        setBacksData(backsRes);
        setUfmStudents(ufmRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to reload database listings');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const handleDelete = (rollNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete results for student ${rollNumber}?`)) return;
    const deletePromise = adminDeleteStudentResult(rollNumber, token).then(() => loadData());
    toast.promise(deletePromise, {
      loading: 'Deleting results from DB...',
      success: 'Records wiped successfully',
      error: 'Failed to wipe records',
    });
  };

  const startEdit = (student: Student) => {
    setEditingRoll(student.roll_number);
    setEditName(student.name);
    setEditBranch(student.branch);
  };

  const cancelEdit = () => {
    setEditingRoll(null);
    setEditName('');
    setEditBranch('');
  };

  const handleSaveEdit = async (rollNumber: string) => {
    setIsSaving(true);
    try {
      await adminUpdateStudent(rollNumber, { name: editName, branch: editBranch }, token);
      toast.success('Student updated successfully');
      cancelEdit();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 3) {
      toast.error('Enter at least 3 characters');
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchStudents(searchQuery);
      setSearchResults(res.data);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const openStudentDetails = async (rollNumber: string) => {
    setSelectedStudentId(rollNumber);
    setLoadingDetails(true);
    try {
      const details = await fetchStudentDetails(rollNumber);
      setStudentDetails(details);
    } catch {
      toast.error('Failed to load student details');
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) { toast.error('No data to export'); return; }
    const processRow = (row: any) => {
      let flatRow: any = { ...row };
      if (row.students) {
        flatRow['student_name'] = row.students.name;
        flatRow['student_branch'] = row.students.branch;
        flatRow['student_father'] = row.students.father_name;
        delete flatRow.students;
      }
      return flatRow;
    };
    const processedData = data.map(processRow);
    const headers = Object.keys(processedData[0]).filter(k => typeof processedData[0][k] !== 'object');
    const csvRows = [
      headers.join(','),
      ...processedData.map(row => headers.map(fieldName => {
        let val = row[fieldName];
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Exported to CSV');
  };

  // ─── Analytics computed values ──────────────────────────────────────────
  const analytics = useMemo(() => {
    const submitted = students.filter(s => s.has_submitted);
    const branchStats = BRANCHES.map(br => {
      const total = students.filter(s => s.branch === br).length;
      const sub = submitted.filter(s => s.branch === br);
      const avgSgpa = sub.length > 0
        ? sub.reduce((acc, s) => acc + (s.overall_sgpa ?? 0), 0) / sub.length
        : null;
      return { branch: br, total, submitted: sub.length, avgSgpa };
    });

    // SGPA distribution buckets
    const buckets = [
      { label: '9–10', min: 9, max: 10, count: 0, color: 'bg-accent-success' },
      { label: '8–9', min: 8, max: 9, count: 0, color: 'bg-accent-primary' },
      { label: '7–8', min: 7, max: 8, count: 0, color: 'bg-accent-cyan' },
      { label: '6–7', min: 6, max: 7, count: 0, color: 'bg-accent-gold' },
      { label: '<6', min: 0, max: 6, count: 0, color: 'bg-accent-danger' },
    ];
    submitted.forEach(s => {
      if (s.overall_sgpa == null) return;
      const bucket = buckets.find(b => s.overall_sgpa! >= b.min && s.overall_sgpa! < b.max + (b.max === 10 ? 0.01 : 0));
      if (bucket) bucket.count++;
    });

    // Top 5 by overall_sgpa
    const top5 = [...submitted]
      .filter(s => s.overall_sgpa != null)
      .sort((a, b) => (b.overall_sgpa ?? 0) - (a.overall_sgpa ?? 0))
      .slice(0, 5);

    return { branchStats, buckets, top5 };
  }, [students]);

  // ─── Enhanced overview values ────────────────────────────────────────────
  const overviewStats = useMemo(() => {
    const submitted = students.filter(s => s.has_submitted);
    const cleanSheet = submitted.filter(s => s.overall_sgpa != null).length; // proxy for clean if no backs data
    const cleanSheetCount = backsData
      ? submitted.filter(s => !backsData.students_with_backs.some(b => b.roll_number === s.roll_number)).length
      : 0;
    const avgSgpaAll = submitted.length > 0
      ? submitted.reduce((acc, s) => acc + (s.overall_sgpa ?? 0), 0) / submitted.filter(s => s.overall_sgpa != null).length
      : null;
    return { cleanSheetCount, avgSgpaAll };
  }, [students, backsData]);

  // ─── Student Modal ───────────────────────────────────────────────────────
  const renderStudentModal = () => {
    if (!selectedStudentId) return null;
    const modalRank = studentDetails?.result?.rank || studentDetails?.student?.rank;
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="bg-bg-primary border border-border-subtle rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
        >
          <button onClick={() => { setSelectedStudentId(null); setStudentDetails(null); }} className="absolute top-4 right-4 p-2 bg-bg-secondary hover:bg-bg-tertiary rounded-full transition-colors z-10">
            <X className="h-5 w-5 text-text-secondary" />
          </button>

          <div className="p-6 border-b border-border-subtle bg-bg-secondary/50 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-syne text-text-primary flex items-center gap-2">
              <UserX className="h-6 w-6 text-accent-primary" />
              Student Profile
            </h2>
            {modalRank && (
              <span className="inline-flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-full text-xs text-accent-gold bg-accent-gold/10 border border-accent-gold/20 shadow-sm mr-8">
                <Award className="h-3.5 w-3.5 text-accent-gold" />
                Rank #{modalRank}
              </span>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            {loadingDetails ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent-primary" /></div>
            ) : studentDetails ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="panel-solid p-5 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                    <h3 className="text-sm uppercase tracking-wider text-text-secondary font-semibold border-b border-border-subtle pb-2 mb-3">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                      <span className="text-text-secondary">Name:</span><span className="font-medium text-text-primary">{studentDetails.student.name}</span>
                      <span className="text-text-secondary">Father's Name:</span><span className="font-medium text-text-primary">{studentDetails.student.father_name || 'N/A'}</span>
                      <span className="text-text-secondary">Roll Number:</span><span className="font-mono text-accent-primary font-semibold">{studentDetails.student.roll_number}</span>
                      <span className="text-text-secondary">Enrollment:</span><span className="font-mono">{studentDetails.student.enrollment_number || 'N/A'}</span>
                      <span className="text-text-secondary">Branch:</span><span className="font-semibold text-text-primary">{studentDetails.student.branch}</span>
                      <span className="text-text-secondary">Gender:</span><span>{studentDetails.student.gender || 'N/A'}</span>
                      <span className="text-text-secondary">Leaderboard Rank:</span><span className="font-mono font-bold text-accent-gold">{modalRank ? `#${modalRank}` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="panel-solid p-5 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-success/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                    <h3 className="text-sm uppercase tracking-wider text-text-secondary font-semibold border-b border-border-subtle pb-2 mb-3">Academic Summary</h3>
                    {studentDetails.result ? (
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                        <span className="text-text-secondary">Overall SGPA:</span><span className="font-bold text-lg text-accent-primary">{studentDetails.result.overall_sgpa?.toFixed(2) || 'N/A'}</span>
                        <span className="text-text-secondary">Leaderboard Rank:</span><span className="font-bold text-lg text-accent-gold">{studentDetails.result.rank ? `#${studentDetails.result.rank}` : 'N/A'}</span>
                        <span className="text-text-secondary">Total Backs:</span><span className={`font-bold text-lg ${studentDetails.result.total_backs > 0 ? 'text-accent-danger' : 'text-accent-success'}`}>{studentDetails.result.total_backs}</span>
                        <span className="text-text-secondary">Semesters Data:</span><span className="font-semibold text-text-primary">{studentDetails.result.total_semesters_submitted}</span>
                      </div>
                    ) : (
                      <div className="text-accent-danger text-sm py-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> No result data available (Not submitted)
                      </div>
                    )}
                  </div>
                </div>

                {studentDetails.semesters.some(s => s.subjects.some(sub => sub.is_back || sub.grade === 'F')) && (
                  <div className="panel-solid p-5 rounded-xl border-accent-danger/30 bg-accent-danger/5">
                    <h3 className="text-sm uppercase tracking-wider text-accent-danger font-bold border-b border-accent-danger/20 pb-2 mb-3 flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4" /> Ongoing Backs
                    </h3>
                    <div className="space-y-4">
                      {studentDetails.semesters.map(sem => {
                        const backs = sem.subjects.filter(sub => sub.is_back || sub.grade === 'F');
                        if (backs.length === 0) return null;
                        return (
                          <div key={sem.id} className="text-sm bg-bg-primary/50 p-3 rounded-lg border border-accent-danger/10">
                            <span className="font-semibold text-text-primary block mb-2">Semester {sem.semester}</span>
                            <ul className="space-y-2 text-text-secondary">
                              {backs.map(b => (
                                <li key={b.id} className="flex items-center gap-2 text-accent-danger">
                                  <span className="h-1.5 w-1.5 rounded-full bg-accent-danger"></span>
                                  <span className="font-mono text-xs opacity-75">{b.subject_code}</span>
                                  <span className="font-medium">{b.subject_name}</span>
                                  <span className="text-xs opacity-75">({b.subject_type})</span>
                                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-accent-danger/20 text-accent-danger font-bold border border-accent-danger/20">Grade: {b.grade || 'F'}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {studentDetails.semesters.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-text-secondary font-semibold">Semester-wise Results</h3>
                    {studentDetails.semesters.map(sem => (
                      <div key={sem.id} className="panel-solid p-4 rounded-xl border border-border-subtle overflow-hidden">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-border-subtle">
                          <span className="font-semibold text-text-primary text-base">Semester {sem.semester}</span>
                          <div className="flex gap-4 text-sm font-medium">
                            <span className="text-text-secondary bg-bg-secondary px-3 py-1 rounded-full">SGPA: <span className="text-accent-primary font-bold">{sem.sgpa?.toFixed(2) || 'N/A'}</span></span>
                            <span className="text-text-secondary bg-bg-secondary px-3 py-1 rounded-full">Result: <span className={sem.result_status?.includes('PASS') ? 'text-accent-success font-bold' : 'text-accent-danger font-bold'}>{sem.result_status}</span></span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-text-secondary border-b border-border-subtle/50 bg-bg-secondary/30">
                                <th className="p-2 font-medium rounded-tl-lg">Subject</th>
                                <th className="p-2 font-medium">Type</th>
                                <th className="p-2 font-medium text-right">Int</th>
                                <th className="p-2 font-medium text-right">Ext</th>
                                <th className="p-2 font-medium text-right">Total</th>
                                <th className="p-2 font-medium text-right rounded-tr-lg">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle/30 text-text-primary">
                              {sem.subjects.map(sub => (
                                <tr key={sub.id} className={`hover:bg-bg-tertiary/20 ${sub.is_back || sub.grade === 'F' ? 'bg-accent-danger/5 text-accent-danger-light' : ''}`}>
                                  <td className="p-2"><span className="font-mono text-[10px] text-text-secondary mr-2">{sub.subject_code}</span>{sub.subject_name}</td>
                                  <td className="p-2"><span className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">{sub.subject_type}</span></td>
                                  <td className="p-2 text-right font-mono">{sub.internal_marks ?? '-'}</td>
                                  <td className="p-2 text-right font-mono">{sub.external_marks ?? '-'}</td>
                                  <td className="p-2 text-right font-mono font-medium">{sub.total_marks ?? '-'}</td>
                                  <td className={`p-2 text-right font-bold ${sub.is_back || sub.grade === 'F' ? 'text-accent-danger' : 'text-text-primary'}`}>{sub.grade ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-text-secondary py-12">Failed to load details.</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Auth Screen
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <ScrollReveal direction="scale" duration={600}>
          <div className="max-w-md w-full glass-panel rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto text-accent-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="font-syne text-xl font-bold text-text-primary uppercase tracking-wider">Admin Gateway</h1>
              <p className="text-xs text-text-secondary">Enter authorization token to manage result tables</p>
            </div>
            <form onSubmit={handleAuthorize} className="space-y-4">
              <input
                type="password" required value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin secret password"
                className="w-full bg-bg-secondary border border-border-subtle text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary/50 transition-colors"
              />
              {error && (
                <div className="text-accent-danger text-xs flex items-center gap-1.5 justify-center">
                  <AlertCircle className="h-3.5 w-3.5" /><span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-accent-primary hover:bg-accent-primary/95 text-white font-medium px-4 py-2.5 text-sm transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Access'}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  const filteredStudents = students.filter(s => branchFilter === 'ALL' || s.branch === branchFilter);
  const filteredPending = pendingStudents.filter(s => branchFilter === 'ALL' || s.branch === branchFilter);
  const filteredBacks = backsData?.students_with_backs.filter(s => branchFilter === 'ALL' || s.students?.branch === branchFilter) || [];

  // Statistics summaries
  const totalStudentsCount = students.length;
  const submittedCount = students.filter((s) => s.has_submitted).length;
  const submissionRate = totalStudentsCount > 0 ? ((submittedCount / totalStudentsCount) * 100).toFixed(1) : '0';
  const totalBacksCount = backsData?.students_with_backs.length || 0;

  return (
    <div className="flex-1 pt-8 pb-28 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-7 relative">
      <AnimatePresence>
        {selectedStudentId && renderStudentModal()}
      </AnimatePresence>

      {/* Admin header */}
      <ScrollReveal direction="down" duration={500}>
        <div className="page-header mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-accent-danger/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent-danger" />
                </div>
                <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
                  Admin <span className="text-gradient-blue">Console</span>
                </h1>
              </div>
              <p className="text-[13px] text-text-secondary pl-11">
                Manage academic tables, submissions, search records, and backlogs.
              </p>
            </div>
            <button
              onClick={() => { setIsAuthorized(false); setToken(''); toast.success('Logged out successfully'); }}
              className="inline-flex items-center justify-center rounded-full bg-accent-danger/8 border border-accent-danger/20 hover:bg-accent-danger/15 px-4 py-2 text-xs font-bold text-accent-danger uppercase tracking-wider transition-all duration-200"
            >
              Revoke Access
            </button>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/50 pb-px">
        {/* Tabs list */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full">
          {(
            [
              { id: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
              { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
              { id: 'all', label: `All Students (${filteredStudents.length})`, icon: <FileSpreadsheet className="h-4 w-4" /> },
              { id: 'backs', label: `Backlogs (${filteredBacks.length})`, icon: <AlertOctagon className="h-4 w-4" /> },
              { id: 'pending', label: `Pending (${filteredPending.length})`, icon: <UserX className="h-4 w-4" /> },
              { id: 'ufm', label: `UFM (${ufmStudents.length})`, icon: <AlertTriangle className="h-4 w-4" /> },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Global Branch Filter */}
        {['all', 'backs', 'pending', 'analytics'].includes(activeTab) && (
          <div className="flex items-center gap-2 min-w-max pb-2 md:pb-0">
            <Filter className="h-4 w-4 text-text-secondary" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-bg-secondary border border-border-subtle text-text-primary rounded-lg px-2 py-1.5 text-xs outline-none focus:border-accent-primary/50"
            >
              <option value="ALL">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="CSE_AIML">CSE(AI&ML)</option>
              <option value="CST">CST</option>
              <option value="CST_IOT">CST(IoT)</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab content panel */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl p-5">
                  <span className="text-xs text-text-secondary uppercase tracking-wider block">Submission Rate</span>
                  <span className="text-3xl font-mono font-bold text-accent-success block mt-2">{submissionRate}%</span>
                  <p className="text-xs text-text-secondary mt-1">{submittedCount} of {totalStudentsCount} uploaded.</p>
                </div>
                <div className="glass-panel rounded-xl p-5">
                  <span className="text-xs text-text-secondary uppercase tracking-wider block">Active Backlogs</span>
                  <span className="text-3xl font-mono font-bold text-accent-danger block mt-2">{totalBacksCount}</span>
                  <p className="text-xs text-text-secondary mt-1">students with backlog flags.</p>
                </div>
                <div className="glass-panel rounded-xl p-5">
                  <span className="text-xs text-text-secondary uppercase tracking-wider block">Not Submitted</span>
                  <span className="text-3xl font-mono font-bold text-accent-primary block mt-2">{pendingStudents.length}</span>
                  <p className="text-xs text-text-secondary mt-1">students yet to upload.</p>
                </div>
                <div className="glass-panel rounded-xl p-5">
                  <span className="text-xs text-text-secondary uppercase tracking-wider block">Clean Sheet</span>
                  <span className="text-3xl font-mono font-bold text-accent-success block mt-2">{overviewStats.cleanSheetCount}</span>
                  <p className="text-xs text-text-secondary mt-1">students with zero backs.</p>
                </div>
              </div>

              {/* Per-branch breakdown */}
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent-primary" />
                  Branch Submission Progress
                </h3>
                <div className="space-y-4">
                  {analytics.branchStats.map(bs => {
                    const pct = bs.total > 0 ? Math.round((bs.submitted / bs.total) * 100) : 0;
                    return (
                      <div key={bs.branch}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold text-text-primary">{bs.branch}</span>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            {bs.avgSgpa != null && (
                              <span className="font-mono text-accent-primary">Avg SGPA: <span className="font-bold">{bs.avgSgpa.toFixed(2)}</span></span>
                            )}
                            <span>{bs.submitted}/{bs.total} — <span className={pct >= 70 ? 'text-accent-success font-semibold' : 'text-accent-gold font-semibold'}>{pct}%</span></span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? 'bg-accent-success' : 'bg-accent-gold'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avg SGPA all + UFM alert */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary uppercase tracking-wider block">Batch Avg SGPA</span>
                    <span className="text-2xl font-mono font-bold text-accent-primary">
                      {overviewStats.avgSgpaAll != null ? overviewStats.avgSgpaAll.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className={`glass-panel rounded-xl p-5 flex items-center gap-4 ${ufmStudents.length > 0 ? 'border border-accent-danger/20' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ufmStudents.length > 0 ? 'bg-accent-danger/10' : 'bg-accent-success/10'}`}>
                    {ufmStudents.length > 0 ? <AlertTriangle className="h-5 w-5 text-accent-danger" /> : <CheckCircle className="h-5 w-5 text-accent-success" />}
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary uppercase tracking-wider block">UFM Flags</span>
                    <span className={`text-2xl font-mono font-bold ${ufmStudents.length > 0 ? 'text-accent-danger' : 'text-accent-success'}`}>
                      {ufmStudents.length}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {ufmStudents.length > 0 ? 'students with UFM records' : 'No UFM cases found'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ────────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Branch bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent-primary" /> Branch Breakdown
                  </h3>
                  <div className="space-y-5">
                    {analytics.branchStats.map(bs => {
                      const pct = bs.total > 0 ? Math.round((bs.submitted / bs.total) * 100) : 0;
                      const maxBar = Math.max(...analytics.branchStats.map(b => b.total), 1);
                      const widthPct = Math.round((bs.total / maxBar) * 100);
                      return (
                        <div key={bs.branch} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-text-primary">{bs.branch}</span>
                            <div className="flex items-center gap-3 text-text-secondary">
                              {bs.avgSgpa != null && <span className="font-mono text-accent-cyan">SGPA <span className="text-accent-cyan font-bold">{bs.avgSgpa.toFixed(2)}</span></span>}
                              <span><span className="text-accent-success font-bold">{bs.submitted}</span> / {bs.total}</span>
                            </div>
                          </div>
                          <div className="h-3 rounded-full bg-bg-tertiary overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className="h-full rounded-full bg-accent-primary/40 relative"
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="absolute inset-y-0 left-0 rounded-full bg-accent-primary"
                              />
                            </motion.div>
                          </div>
                          <p className="text-[10px] text-text-secondary">{pct}% submitted</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SGPA Distribution */}
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-accent-violet" /> SGPA Distribution
                  </h3>
                  <div className="space-y-3">
                    {analytics.buckets.map(bucket => {
                      const total = analytics.buckets.reduce((a, b) => a + b.count, 0) || 1;
                      const pct = Math.round((bucket.count / total) * 100);
                      return (
                        <div key={bucket.label} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-text-secondary w-12 text-right">{bucket.label}</span>
                          <div className="flex-1 h-5 rounded-full bg-bg-tertiary overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={`h-full rounded-full ${bucket.color} opacity-80`}
                            />
                          </div>
                          <span className="text-xs font-mono text-text-secondary w-12">{bucket.count} <span className="text-text-tertiary">({pct}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-4">Based on {submittedCount} submitted results.</p>
                </div>
              </div>

              {/* Top 5 students */}
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent-gold" /> Top 5 Students (Overall SGPA)
                </h3>
                <div className="space-y-2">
                  {analytics.top5.length === 0 ? (
                    <div className="text-center text-text-secondary py-6 text-sm">No submitted results yet.</div>
                  ) : analytics.top5.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => openStudentDetails(s.roll_number)}
                      className="flex items-center gap-4 p-3 rounded-xl bg-bg-secondary/40 hover:bg-bg-secondary/80 border border-border-subtle hover:border-accent-primary/30 transition-all cursor-pointer group"
                    >
                      <span className={`text-sm font-mono font-bold w-6 text-center ${
                        i === 0 ? 'text-accent-gold' : i === 1 ? 'text-accent-silver' : i === 2 ? 'text-accent-bronze' : 'text-text-secondary'
                      }`}>#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">{s.name}</p>
                        <p className="text-xs text-text-secondary font-mono">{s.roll_number} · {s.branch}</p>
                      </div>
                      <span className="text-lg font-mono font-bold text-accent-primary">{s.overall_sgpa?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SEARCH TAB ───────────────────────────────────────────────── */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-xl p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search by Roll Number or Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-bg-secondary border border-border-subtle text-text-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-accent-primary transition-colors"
                    />
                  </div>
                  <button type="submit" disabled={isSearching}
                    className="inline-flex items-center justify-center rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-white font-medium px-6 py-3 transition-all active:scale-[0.98]">
                    {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                  </button>
                </form>
              </div>

              {searchResults.length > 0 && (
                <div className="glass-panel rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary/35">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary font-semibold bg-bg-secondary/50">
                        <th className="p-4 pl-6">Roll Number</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Branch</th>
                        <th className="p-4">Rank</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                      {searchResults.map((student, index) => (
                        <tr key={student.id} className="hover:bg-bg-tertiary/20 group transition-all animate-tr-fade" style={{ animationDelay: `${index * 30}ms` }}>
                          <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                          <td className="p-4">{student.name}</td>
                          <td className="p-4">{student.branch}</td>
                          <td className="p-4 font-mono font-bold text-accent-gold">{student.rank ? `#${student.rank}` : '-'}</td>
                          <td className="p-4 text-right pr-6">
                            <button
                              onClick={() => openStudentDetails(student.roll_number)}
                              className="inline-flex items-center gap-1 text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-12 text-text-secondary glass-panel rounded-xl">
                  No students found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* ── ALL STUDENTS TAB ─────────────────────────────────────────── */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => exportToCSV(filteredStudents, 'all_students')}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 text-accent-primary" /> Export CSV
                </button>
              </div>
              <div className="glass-panel rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary/35">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary font-semibold bg-bg-secondary/50">
                      <th className="p-4 pl-6">Roll Number</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                    {filteredStudents.map((student, index) => (
                      editingRoll === student.roll_number ? (
                        // ── Inline edit row ──────────────────────────────
                        <tr key={student.id} className="bg-accent-primary/5 border-l-2 border-accent-primary animate-tr-fade">
                          <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                          <td className="p-3" colSpan={1}>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-bg-primary border border-accent-primary/40 text-text-primary rounded-lg px-2 py-1.5 text-xs outline-none focus:border-accent-primary"
                              placeholder="Student name"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={editBranch}
                              onChange={e => setEditBranch(e.target.value)}
                              className="bg-bg-primary border border-accent-primary/40 text-text-primary rounded-lg px-2 py-1.5 text-xs outline-none focus:border-accent-primary"
                            >
                              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>
                          <td className="p-4 font-mono font-bold text-accent-gold">{student.rank ? `#${student.rank}` : '-'}</td>
                          <td className="p-4"></td>
                          <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(student.roll_number)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 text-accent-success bg-accent-success/10 hover:bg-accent-success/20 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
                              title="Save changes"
                            >
                              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-danger bg-bg-secondary hover:bg-accent-danger/10 px-2 py-1.5 rounded-lg transition-all text-xs"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ) : (
                        // ── Normal row ───────────────────────────────────
                        <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-all animate-tr-fade" style={{ animationDelay: `${(index % 20) * 30}ms` }}>
                          <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                          <td className="p-4 cursor-pointer hover:text-accent-primary" onClick={() => openStudentDetails(student.roll_number)}>{student.name}</td>
                          <td className="p-4">{student.branch}</td>
                          <td className="p-4 font-mono font-bold text-accent-gold">{student.rank ? `#${student.rank}` : '-'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${student.has_submitted ? 'bg-accent-success/10 text-accent-success' : 'bg-accent-danger/10 text-accent-danger'}`}>
                              {student.has_submitted ? 'Submitted' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                            <button onClick={() => openStudentDetails(student.roll_number)}
                              className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all" title="View student details">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => startEdit(student)}
                              className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-cyan p-1.5 rounded-lg transition-all" title="Edit name/branch">
                              <Pencil className="h-4 w-4" />
                            </button>
                            {student.has_submitted && (
                              <button onClick={() => handleDelete(student.roll_number)}
                                className="inline-flex items-center gap-1 text-accent-danger hover:bg-accent-danger/10 p-1.5 rounded-lg transition-all" title="Delete submission record">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">No students match the current filter.</div>
                )}
              </div>
            </div>
          )}

          {/* ── BACKLOGS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'backs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-syne font-bold text-sm text-text-secondary uppercase tracking-wider">
                  Filtered Backlogs ({filteredBacks.length})
                </h2>
                <button onClick={() => exportToCSV(filteredBacks, 'backlogs')}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="h-4 w-4 text-accent-primary" /> Export CSV
                </button>
              </div>
              <div className="glass-panel rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary/35">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary font-semibold bg-bg-secondary/50">
                      <th className="p-4 pl-6">Roll Number</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4 text-right">Rank</th>
                      <th className="p-4 text-right">Back Count</th>
                      <th className="p-4 text-right font-bold text-accent-primary">Overall SGPA</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                    {filteredBacks.map((student, index) => (
                      <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-all animate-tr-fade" style={{ animationDelay: `${(index % 20) * 30}ms` }}>
                        <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                        <td className="p-4 cursor-pointer hover:text-accent-primary" onClick={() => openStudentDetails(student.roll_number)}>{student.students?.name || 'Unknown'}</td>
                        <td className="p-4">{student.students?.branch || 'Unknown'}</td>
                        <td className="p-4 text-right font-mono font-bold text-accent-gold">{student.rank ? `#${student.rank}` : '-'}</td>
                        <td className="p-4 text-right text-accent-danger font-semibold">{student.total_backs} papers</td>
                        <td className="p-4 text-right text-accent-primary font-bold">{student.overall_sgpa?.toFixed(2)}</td>
                        <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                          <button onClick={() => openStudentDetails(student.roll_number)}
                            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all" title="View student details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(student.roll_number)}
                            className="inline-flex items-center gap-1 text-accent-danger hover:bg-accent-danger/10 p-1.5 rounded-lg transition-all" title="Delete submission record">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBacks.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">No backlogs match the current filter.</div>
                )}
              </div>
            </div>
          )}

          {/* ── PENDING TAB ──────────────────────────────────────────────── */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => exportToCSV(filteredPending, 'pending_students')}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="h-4 w-4 text-accent-primary" /> Export CSV
                </button>
              </div>
              <div className="glass-panel rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary/35">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary font-semibold bg-bg-secondary/50">
                      <th className="p-4 pl-6">Roll Number</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                    {filteredPending.map((student, index) => (
                      <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-all animate-tr-fade" style={{ animationDelay: `${(index % 20) * 30}ms` }}>
                        <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                        <td className="p-4 cursor-pointer hover:text-accent-primary" onClick={() => openStudentDetails(student.roll_number)}>{student.name}</td>
                        <td className="p-4">{student.branch}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-accent-danger/10 text-accent-danger">Not Submitted</span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <button onClick={() => openStudentDetails(student.roll_number)}
                            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all" title="View student details">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPending.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">No pending students match the current filter.</div>
                )}
              </div>
            </div>
          )}

          {/* ── UFM TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'ufm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-danger/5 border border-accent-danger/20">
                <AlertTriangle className="h-5 w-5 text-accent-danger shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-accent-danger">Unfair Means (UFM) Records</p>
                  <p className="text-xs text-text-secondary mt-0.5">Students whose result summary contains a UFM flag. Remarks are extracted from the parsed PDF session data.</p>
                </div>
              </div>

              {ufmStudents.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center">
                  <CheckCircle className="h-10 w-10 text-accent-success mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">No UFM-flagged students found in the database.</p>
                </div>
              ) : (
                <div className="glass-panel rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary/35">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary font-semibold bg-bg-secondary/50">
                        <th className="p-4 pl-6">Roll Number</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Branch</th>
                        <th className="p-4">Overall SGPA</th>
                        <th className="p-4">UFM Remark</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                      {ufmStudents.map((student, index) => (
                        <tr key={student.roll_number} className="hover:bg-bg-tertiary/20 transition-all animate-tr-fade bg-accent-danger/3" style={{ animationDelay: `${(index % 20) * 30}ms` }}>
                          <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                          <td className="p-4 cursor-pointer hover:text-accent-primary" onClick={() => openStudentDetails(student.roll_number)}>
                            {student.students?.name || 'Unknown'}
                          </td>
                          <td className="p-4">{student.students?.branch || 'Unknown'}</td>
                          <td className="p-4 font-mono font-bold text-accent-primary">{student.overall_sgpa?.toFixed(2) ?? '—'}</td>
                          <td className="p-4">
                            {student.ufm_remark ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-[10px] font-medium max-w-xs truncate" title={student.ufm_remark}>
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                {student.ufm_remark.length > 50 ? student.ufm_remark.slice(0, 50) + '…' : student.ufm_remark}
                              </span>
                            ) : (
                              <span className="text-text-tertiary text-[10px]">No remark extracted</span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6">
                            <button onClick={() => openStudentDetails(student.roll_number)}
                              className="inline-flex items-center gap-1 text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
