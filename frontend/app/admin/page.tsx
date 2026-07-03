'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminFetchAllStudents,
  adminFetchNotSubmitted,
  adminFetchBacks,
  adminDeleteStudentResult,
  searchStudents,
  fetchStudentDetails,
  Student,
  AdminBacks,
  StudentDetails
} from '@/lib/api';
import { Shield, Eye, Trash2, Loader2, AlertCircle, FileSpreadsheet, Layers, UserX, AlertOctagon, Search, Download, X, Filter } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'backs' | 'pending' | 'search'>('overview');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [backsData, setBacksData] = useState<AdminBacks | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please enter the admin secret key');
      return;
    }
    
    setLoading(true);
    // Simple test call to verify token
    adminFetchAllStudents(token)
      .then((res) => {
        setStudents(res.data);
        setIsAuthorized(true);
        setLoading(false);
        toast.success('Access authorized');
      })
      .catch((err) => {
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
    ])
      .then(([allRes, notSubRes, backsRes]) => {
        setStudents(allRes.data);
        setPendingStudents(notSubRes.data);
        setBacksData(backsRes);
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
    if (!window.confirm(`Are you sure you want to delete results for student ${rollNumber}?`)) {
      return;
    }

    const deletePromise = adminDeleteStudentResult(rollNumber, token).then(() => {
      loadData(); // reload
    });

    toast.promise(deletePromise, {
      loading: 'Deleting results from DB...',
      success: 'Records wiped successfully',
      error: 'Failed to wipe records',
    });
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to load student details');
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Flatten nested objects like 'students.name' if needed, or just export raw properties
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

  const renderStudentModal = () => {
    if (!selectedStudentId) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
          
          <div className="p-6 border-b border-border-subtle bg-bg-secondary/50">
            <h2 className="text-2xl font-bold font-syne text-text-primary flex items-center gap-2">
              <UserX className="h-6 w-6 text-accent-primary" />
              Student Profile
            </h2>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            {loadingDetails ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent-primary" /></div>
            ) : studentDetails ? (
              <>
                {/* Profile Card */}
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
                    </div>
                  </div>
                  
                  <div className="panel-solid p-5 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-success/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                    <h3 className="text-sm uppercase tracking-wider text-text-secondary font-semibold border-b border-border-subtle pb-2 mb-3">Academic Summary</h3>
                    {studentDetails.result ? (
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                        <span className="text-text-secondary">Overall SGPA:</span><span className="font-bold text-lg text-accent-primary">{studentDetails.result.overall_sgpa?.toFixed(2) || 'N/A'}</span>
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
 
                {/* Ongoing Backs section */}
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
                        )
                      })}
                    </div>
                  </div>
                )}
 
                {/* Semester Breakdown */}
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
              <h1 className="font-syne text-xl font-bold text-text-primary uppercase tracking-wider">
                Admin Gateway
              </h1>
              <p className="text-xs text-text-secondary">
                Enter authorization token to manage result tables
              </p>
            </div>

            <form onSubmit={handleAuthorize} className="space-y-4">
              <input
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin secret password"
                className="w-full bg-bg-secondary border border-border-subtle text-text-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent-primary/50 transition-colors"
              />
              {error && (
                <div className="text-accent-danger text-xs flex items-center gap-1.5 justify-center">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-accent-primary hover:bg-accent-primary/95 text-white font-medium px-4 py-2.5 text-sm transition-all active:scale-[0.98]"
              >
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
              onClick={() => {
                setIsAuthorized(false);
                setToken('');
                toast.success('Logged out successfully');
              }}
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
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <Layers className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            All Students ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('backs')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'backs'
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            Backlogs ({filteredBacks.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <UserX className="h-4 w-4" />
            Pending ({filteredPending.length})
          </button>
        </div>

        {/* Global Filter */}
        {['all', 'backs', 'pending'].includes(activeTab) && (
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
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-xl p-6">
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Submission rate</span>
                <span className="text-3xl font-mono font-bold text-accent-success block mt-2">{submissionRate}%</span>
                <p className="text-xs text-text-secondary mt-1">{submittedCount} of {totalStudentsCount} uploads completed.</p>
              </div>
              <div className="glass-panel rounded-xl p-6">
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Active backlogs</span>
                <span className="text-3xl font-mono font-bold text-accent-danger block mt-2">{totalBacksCount}</span>
                <p className="text-xs text-text-secondary mt-1">students have active backlog status flags.</p>
              </div>
              <div className="glass-panel rounded-xl p-6">
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Not submitted</span>
                <span className="text-3xl font-mono font-bold text-accent-primary block mt-2">{pendingStudents.length}</span>
                <p className="text-xs text-text-secondary mt-1">students left to upload marksheets.</p>
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
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
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="inline-flex items-center justify-center rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-white font-medium px-6 py-3 transition-all active:scale-[0.98]"
                  >
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
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                      {searchResults.map((student, index) => (
                        <tr key={student.id} className="hover:bg-bg-tertiary/20 group transition-all animate-tr-fade" style={{ animationDelay: `${index * 30}ms` }}>
                          <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                          <td className="p-4">{student.name}</td>
                          <td className="p-4">{student.branch}</td>
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

          {/* ALL STUDENTS TAB */}
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
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-medium text-xs text-text-primary">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-bg-tertiary/20 transition-all animate-tr-fade" style={{ animationDelay: `${(index % 20) * 30}ms` }}>
                        <td className="p-4 pl-6 font-mono text-text-secondary">{student.roll_number}</td>
                        <td className="p-4 cursor-pointer hover:text-accent-primary" onClick={() => openStudentDetails(student.roll_number)}>{student.name}</td>
                        <td className="p-4">{student.branch}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                              student.has_submitted
                                ? 'bg-accent-success/10 text-accent-success'
                                : 'bg-accent-danger/10 text-accent-danger'
                            }`}
                          >
                            {student.has_submitted ? 'Submitted' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                          <button
                            onClick={() => openStudentDetails(student.roll_number)}
                            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all"
                            title="View student details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {student.has_submitted && (
                            <button
                              onClick={() => handleDelete(student.roll_number)}
                              className="inline-flex items-center gap-1 text-accent-danger hover:bg-accent-danger/10 p-1.5 rounded-lg transition-all"
                              title="Delete submission record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">No students match the current filter.</div>
                )}
              </div>
            </div>
          )}

          {/* BACKLOGS TAB */}
          {activeTab === 'backs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-syne font-bold text-sm text-text-secondary uppercase tracking-wider">
                  Filtered Backlogs ({filteredBacks.length})
                </h2>
                <button
                  onClick={() => exportToCSV(filteredBacks, 'backlogs')}
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
                        <td className="p-4 text-right text-accent-danger font-semibold">{student.total_backs} papers</td>
                        <td className="p-4 text-right text-accent-primary font-bold">{student.overall_sgpa?.toFixed(2)}</td>
                        <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                          <button
                            onClick={() => openStudentDetails(student.roll_number)}
                            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all"
                            title="View student details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.roll_number)}
                            className="inline-flex items-center gap-1 text-accent-danger hover:bg-accent-danger/10 p-1.5 rounded-lg transition-all"
                            title="Delete submission record"
                          >
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

          {/* PENDING TAB */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => exportToCSV(filteredPending, 'pending_students')}
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
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-accent-danger/10 text-accent-danger">
                            Not Submitted
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <button
                            onClick={() => openStudentDetails(student.roll_number)}
                            className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary p-1.5 rounded-lg transition-all"
                            title="View student details"
                          >
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
        </div>
      )}
    </div>
  );
}
