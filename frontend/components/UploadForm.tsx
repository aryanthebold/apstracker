'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVirtualizer } from '@tanstack/react-virtual';
import { uploadResult } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FileStatus {
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  rollNumber?: string;
  errorMsg?: string;
}

export default function UploadForm() {
  const [inviteCode, setInviteCode] = useState('');
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'submitting' | 'completed'>('idle');

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
      setGlobalStatus('idle'); // Reset if adding new files after a completion
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
    const pendingFiles = files.filter(f => f.status === 'idle' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.error('No pending files to upload');
      return;
    }

    setGlobalStatus('submitting');

    let allSuccess = true;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'success') continue;

      setFiles(prev => {
        const next = [...prev];
        next[i].status = 'uploading';
        return next;
      });

      try {
        const response = await uploadResult(files[i].file, inviteCode);
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'success';
          next[i].rollNumber = response.roll_number;
          return next;
        });
      } catch (err: any) {
        allSuccess = false;
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'error';
          next[i].errorMsg = err.message || 'Upload failed';
          return next;
        });
      }
    }

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
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel rounded-2xl p-6 md:p-10 space-y-8 shadow-[0_0_40px_rgba(79,142,247,0.1)] relative overflow-hidden animate-fade-in-up">
      {/* Decorative Blur Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center space-y-2 relative z-10">
        <div className="inline-flex items-center justify-center space-x-2 bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 border border-accent-primary/20">
          <Sparkles className="w-3 h-3" />
          <span>Batch Upload</span>
        </div>
        <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-accent-primary tracking-wide" style={{ fontFamily: '"Coolvetica", "Syne", sans-serif' }}>
          Upload Results
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto font-medium">
          Drag & drop multiple result PDFs to instantly add them to the global leaderboard.
        </p>
      </div>

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
          <div
            ref={parentRef}
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
        )}

        <div className="pt-2">
          {globalStatus === 'completed' && files.every(f => f.status === 'success') ? (
            <button
              type="button"
              onClick={resetForm}
              className="w-full inline-flex items-center justify-center rounded-xl bg-bg-tertiary border border-border-subtle hover:bg-bg-tertiary/75 px-5 py-3.5 text-sm font-bold text-text-primary transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
            >
              <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" />
              Upload More Results
            </button>
          ) : (
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
          )}
        </div>
      </form>
    </div>
  );
}
