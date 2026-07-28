'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVirtualizer } from '@tanstack/react-virtual';
import { uploadResult } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Loader2, Sparkles, Trash2, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface FileStatus {
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  rollNumber?: string;
  errorMsg?: string;
}

type UploadStep = 'idle' | 'uploading' | 'parsing' | 'saving' | 'done';

/** Maps raw API error messages to friendly UX copy */
function friendlyError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('invite') || msg.includes('code') || msg.includes('unauthorized') || msg.includes('403')) {
    return 'Incorrect invite code. Ask your batch rep for the right one.';
  }
  if (msg.includes('roll') && (msg.includes('not found') || msg.includes('404'))) {
    return "This roll number isn't in our batch records.";
  }
  if (msg.includes('already') || msg.includes('duplicate') || msg.includes('409')) {
    return 'Result already uploaded. Re-uploading will update your existing entry.';
  }
  if (msg.includes('size') || msg.includes('large') || msg.includes('413')) {
    return 'PDF too large. Max size is 5MB.';
  }
  return raw || 'Upload failed. Please try again.';
}

/** Animated progress steps shown during upload */
function UploadSteps({ step }: { step: UploadStep }) {
  const steps = [
    { key: 'uploading', label: 'Uploading PDF' },
    { key: 'parsing', label: 'Parsing Result' },
    { key: 'saving', label: 'Saving to DB' },
    { key: 'done', label: 'Done!' },
  ] as const;

  const stepOrder: UploadStep[] = ['idle', 'uploading', 'parsing', 'saving', 'done'];
  const currentIndex = stepOrder.indexOf(step);

  return (
    <div className="flex items-center justify-center gap-1 py-6 flex-wrap">
      {steps.map((s, i) => {
        const stepIdx = i + 1; // steps start at index 1 in stepOrder
        const isDone = currentIndex > stepIdx;
        const isActive = currentIndex === stepIdx;
        const isPending = currentIndex < stepIdx;

        return (
          <div key={s.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ${
                isDone
                  ? 'bg-accent-success/15 text-accent-success border border-accent-success/30'
                  : isActive
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/40 animate-pulse'
                  : 'bg-bg-tertiary text-text-tertiary border border-border-subtle'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-current opacity-40" />
              )}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <span className={`text-text-tertiary text-xs mx-0.5 ${isDone ? 'text-accent-success' : ''}`}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Full-screen success state after all uploads */
function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 animate-fade-in-up text-center">
      <div
        className="w-24 h-24 rounded-full bg-accent-success/15 border-2 border-accent-success/40 flex items-center justify-center animate-glow-pulse"
        style={{ boxShadow: '0 0 40px rgba(61, 220, 132, 0.3)' }}
      >
        <CheckCircle2 className="h-12 w-12 text-accent-success" style={{ animation: 'rowReveal 0.6s cubic-bezier(0.16,1,0.3,1) both' }} />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-syne)' }}>
          You&apos;re on the leaderboard! 🎉
        </h2>
        <p className="text-sm text-text-secondary">Your result has been parsed and saved successfully.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-primary hover:bg-accent-primary/90 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-[0_4px_20px_rgba(79,142,247,0.4)]"
        >
          <Trophy className="h-4 w-4" />
          View Leaderboard
        </Link>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-tertiary hover:bg-bg-tertiary/75 px-6 py-3 text-sm font-bold text-text-secondary transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Upload More
        </button>
      </div>
    </div>
  );
}

export default function UploadForm() {
  const [inviteCode, setInviteCode] = useState('');
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'submitting' | 'completed'>('idle');
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 78,
    overscan: 5,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Some files were rejected. Only PDFs are allowed.');
    }

    if (validFiles.length > 0) {
      setFiles(prev => [
        ...prev,
        ...validFiles.map(file => ({ file, status: 'idle' as const }))
      ]);
      toast.success(`Added ${validFiles.length} file(s)`);
      setGlobalStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) {
      toast.error('Please enter the invite code');
      return;
    }

    const snapshot = [...files];
    const pendingIndices = snapshot
      .map((_, i) => i)
      .filter(i => snapshot[i].status === 'idle' || snapshot[i].status === 'error');

    if (pendingIndices.length === 0) {
      toast.error('No pending files to upload');
      return;
    }

    setGlobalStatus('submitting');
    setUploadStep('uploading');
    let allSuccess = true;

    const CONCURRENCY = 3;

    for (let b = 0; b < pendingIndices.length; b += CONCURRENCY) {
      const batch = pendingIndices.slice(b, b + CONCURRENCY);

      setFiles(prev => {
        const next = [...prev];
        batch.forEach(i => { next[i] = { ...next[i], status: 'uploading' }; });
        return next;
      });

      // Advance progress steps
      if (b === 0) setUploadStep('uploading');
      if (b >= Math.floor(pendingIndices.length / 2)) setUploadStep('parsing');

      await Promise.all(
        batch.map(async (i) => {
          try {
            const response = await uploadResult(snapshot[i].file, inviteCode);
            setFiles(prev => {
              const next = [...prev];
              next[i] = { ...next[i], status: 'success', rollNumber: response.roll_number };
              return next;
            });
          } catch (err: any) {
            allSuccess = false;
            const friendly = friendlyError(err.message || '');
            setFiles(prev => {
              const next = [...prev];
              next[i] = { ...next[i], status: 'error', errorMsg: friendly };
              return next;
            });
          }
        })
      );
    }

    setUploadStep('saving');
    // brief pause to show saving step
    await new Promise(r => setTimeout(r, 400));
    setUploadStep('done');

    setGlobalStatus('completed');
    if (allSuccess) {
      toast.success('All files uploaded successfully!');
    } else {
      toast.error('Some files failed to upload. Please check the list.');
    }
  };

  const resetForm = () => {
    setFiles([]);
    setGlobalStatus('idle');
    setUploadStep('idle');
  };

  // All-success → show full success state
  const isFullSuccess = globalStatus === 'completed' && files.length > 0 && files.every(f => f.status === 'success');

  return (
    <div className="max-w-2xl mx-auto glass-panel rounded-2xl p-6 md:p-10 space-y-8 shadow-[0_0_40px_rgba(79,142,247,0.1)] relative overflow-hidden animate-fade-in-up">
      {/* Decorative Blur Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

      {isFullSuccess ? (
        <SuccessState onReset={resetForm} />
      ) : (
        <>
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center justify-center space-x-2 bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 border border-accent-primary/20">
              <Sparkles className="w-3 h-3" />
              <span>Batch Upload</span>
            </div>
            <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-accent-primary tracking-wide" style={{ fontFamily: '"Coolvetica", "Syne", sans-serif' }}>
              Upload Results
            </h2>
            <p className="text-sm text-text-secondary max-w-sm mx-auto font-medium">
              Drag &amp; drop multiple result PDFs to instantly add them to the global leaderboard.
            </p>
          </div>

          {/* Progress steps — only shown during/after submit */}
          {uploadStep !== 'idle' && (
            <div className="relative z-10 border border-border-subtle rounded-2xl bg-bg-secondary/40 backdrop-blur-sm">
              <UploadSteps step={uploadStep} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label htmlFor="invite-code" className="text-xs font-bold uppercase text-accent-primary tracking-widest block">
                Invite Code
              </label>
              <div className="relative group">
                <input
                  id="invite-code"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter batch secret code"
                  className="w-full bg-bg-secondary/80 backdrop-blur-md border border-border-subtle text-text-primary rounded-xl px-4 py-3.5 text-sm outline-none focus:border-accent-primary/60 focus:ring-4 focus:ring-accent-primary/10 transition-all font-mono shadow-inner group-hover:border-border-accent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-accent-primary tracking-widest block">
                Result PDFs
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ease-out group flex flex-col items-center justify-center min-h-[200px]
                  ${isDragActive
                    ? 'border-accent-primary bg-accent-primary/10 scale-[1.02]'
                    : 'border-border-subtle hover:border-accent-primary/50 bg-bg-primary/30 hover:bg-bg-primary/50'
                  }`}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-bg-secondary/80 mb-4 group-hover:scale-110 group-hover:bg-accent-primary/20 transition-all duration-300 shadow-lg border border-border-subtle">
                  <UploadCloud className={`h-8 w-8 transition-colors ${isDragActive ? 'text-accent-primary' : 'text-text-secondary group-hover:text-accent-primary'}`} />
                </div>
                <span className="text-lg font-bold text-text-primary font-syne tracking-wide">
                  {isDragActive ? 'Drop them right here!' : 'Drag & drop PDF files'}
                </span>
                <span className="text-sm text-text-secondary mt-1.5 font-medium">
                  or click to browse from your device
                </span>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase text-text-secondary tracking-wider">
                    Selected PDFs ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={globalStatus === 'submitting'}
                    className="inline-flex items-center gap-1 text-xs text-accent-danger hover:text-accent-danger/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
                <div
                  ref={parentRef}
                  data-lenis-prevent
                  className="max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const index = virtualRow.index;
                      const fileStatus = files[index];
                      return (
                        <div
                          key={virtualRow.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom: '12px'
                          }}
                        >
                          <div
                            className={`h-full glass-panel p-3 rounded-xl flex items-center justify-between transition-all table-row-glow animate-row-reveal ${fileStatus.status === 'success' ? 'border-accent-success/30 bg-accent-success/5' :
                                fileStatus.status === 'error' ? 'border-accent-danger/30 bg-accent-danger/5' :
                                  'hover:border-accent-primary/30'
                              }`}
                            style={{ animationDelay: `${(index % 10) * 50}ms` }}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`p-2 rounded-lg shrink-0 ${fileStatus.status === 'success' ? 'bg-accent-success/20 text-accent-success' :
                                  fileStatus.status === 'error' ? 'bg-accent-danger/20 text-accent-danger' :
                                    'bg-bg-tertiary text-text-secondary'
                                }`}>
                                {fileStatus.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                  fileStatus.status === 'error' ? <AlertCircle className="w-5 h-5" /> :
                                    fileStatus.status === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin text-accent-primary" /> :
                                      <FileText className="w-5 h-5" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-text-primary truncate">
                                  {fileStatus.file.name}
                                </span>
                                <span className="text-xs text-text-secondary truncate">
                                  {fileStatus.status === 'success' ? (
                                    <span className="text-accent-success font-medium">Roll: {fileStatus.rollNumber}</span>
                                  ) : fileStatus.status === 'error' ? (
                                    <span className="text-accent-danger font-medium">{fileStatus.errorMsg}</span>
                                  ) : (
                                    `${(fileStatus.file.size / 1024).toFixed(1)} KB`
                                  )}
                                </span>
                              </div>
                            </div>

                            {fileStatus.status !== 'uploading' && (
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-accent-danger transition-colors shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={globalStatus === 'submitting' || files.length === 0}
                className="w-full inline-flex items-center justify-center rounded-xl bg-accent-primary hover:bg-accent-primary/90 disabled:bg-accent-primary/50 disabled:cursor-not-allowed text-white font-bold px-5 py-3.5 text-sm transition-all shadow-[0_4px_20px_rgba(79,142,247,0.3)] hover:shadow-[0_4px_25px_rgba(79,142,247,0.5)] active:scale-95 hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none"
              >
                {globalStatus === 'submitting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading {files.filter(f => f.status === 'success').length} / {files.length}...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Submit {files.length > 0 ? files.length : ''} Result{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
