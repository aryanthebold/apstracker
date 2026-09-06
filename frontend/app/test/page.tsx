'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStats } from '@/lib/api';
import type { BatchStats } from '@/lib/api';
import './home.css';

export default function HomePage() {
  const [stats, setStats] = useState<BatchStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Hide original layout elements
    document.body.classList.add('test-page-override');

    fetchStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load batch stats', err);
      });
    return () => {
      cancelled = true;
      document.body.classList.remove('test-page-override');
    };
  }, []);

  return (
    <>
      <style>{`
        /* Override root layout */
        .test-page-override > header.sticky,
        .test-page-override > div > canvas,
        .test-page-override > div.fixed.inset-0.-z-50 {
          display: none !important;
        }
      `}</style>
    <svg aria-hidden="true" className="inline-defs-container" style={{position: 'absolute', width: '0', height: '0', overflow: 'hidden'}}><defs><linearGradient id="brandLogoGrad" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stopColor="#2dd4bf"></stop><stop offset="50%" stopColor="#06b6d4"></stop><stop offset="100%" stopColor="#10b981"></stop></linearGradient><linearGradient id="brandOrbGrad" x1="100%" x2="0%" y1="0%" y2="100%"><stop offset="0%" stopColor="#34d399"></stop><stop offset="50%" stopColor="#14b8a6"></stop><stop offset="100%" stopColor="#06b6d4"></stop></linearGradient></defs></svg>
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" data-purpose="ambient-lighting">
    <div className="absolute inset-0 stardust-pattern opacity-60 transition-opacity duration-1000"></div>
    <div className="absolute top-0 right-0 w-[85vw] h-[85vh] hero-glow-teal opacity-90 blur-3xl"></div>
    <div className="absolute top-[10%] right-[-10%] w-[65vw] h-[65vh] hero-glow-sage opacity-80 blur-2xl"></div>
    <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[60vh] bg-emerald-950/20 blur-[130px] rounded-full"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-[#050707] via-transparent to-[#050707]/80"></div>
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" data-purpose="stellar-field"><div className="absolute rounded-full bg-white star-twinkle" style={{top: '8%', left: '14%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 6px, rgba(45, 212, 191, 0.5) 0px 0px 12px', animationDuration: '3.2s', animationDelay: '0.1s'}}></div><div className="absolute rounded-full bg-teal-200 star-twinkle" style={{top: '19%', left: '78%', width: '3px', height: '3px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 7px, rgba(20, 184, 166, 0.6) 0px 0px 14px', animationDuration: '4.2s', animationDelay: '1.2s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '28%', left: '7%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 5px, rgba(52, 211, 153, 0.4) 0px 0px 10px', animationDuration: '3.5s', animationDelay: '0.5s'}}></div><div className="absolute rounded-full bg-cyan-200 star-twinkle" style={{top: '15%', left: '45%', width: '1.8px', height: '1.8px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 5px, rgba(6, 182, 212, 0.5) 0px 0px 10px', animationDuration: '4.6s', animationDelay: '2s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '36%', left: '91%', width: '3.5px', height: '3.5px', boxShadow: 'rgba(255, 255, 255, 0.95) 0px 0px 9px, rgba(45, 212, 191, 0.7) 0px 0px 18px', animationDuration: '3.4s', animationDelay: '1.7s'}}></div><div className="absolute rounded-full bg-emerald-200 star-twinkle" style={{top: '48%', left: '22%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 5px, rgba(16, 185, 129, 0.5) 0px 0px 10px', animationDuration: '3.9s', animationDelay: '0.8s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '57%', left: '83%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.85) 0px 0px 7px, rgba(45, 212, 191, 0.5) 0px 0px 13px', animationDuration: '4.4s', animationDelay: '2.3s'}}></div><div className="absolute rounded-full bg-teal-100 star-twinkle" style={{top: '66%', left: '11%', width: '3px', height: '3px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 8px, rgba(20, 184, 166, 0.6) 0px 0px 15px', animationDuration: '3.1s', animationDelay: '1.5s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '73%', left: '68%', width: '1.8px', height: '1.8px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 5px, rgba(52, 211, 153, 0.4) 0px 0px 9px', animationDuration: '4.8s', animationDelay: '0.2s'}}></div><div className="absolute rounded-full bg-cyan-100 star-twinkle" style={{top: '81%', left: '38%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 6px, rgba(6, 182, 212, 0.45) 0px 0px 11px', animationDuration: '3.7s', animationDelay: '2.8s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '86%', left: '93%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.85) 0px 0px 7px, rgba(45, 212, 191, 0.5) 0px 0px 13px', animationDuration: '3.6s', animationDelay: '1.1s'}}></div><div className="absolute rounded-full bg-emerald-100 star-twinkle" style={{top: '92%', left: '18%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 5px, rgba(16, 185, 129, 0.4) 0px 0px 10px', animationDuration: '4.3s', animationDelay: '0.7s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '94%', left: '54%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 7px, rgba(45, 212, 191, 0.55) 0px 0px 14px', animationDuration: '3.4s', animationDelay: '2.5s'}}></div></div></div>


    <header className="relative z-40 w-full max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8" data-purpose="site-header">
    <div className="flex items-center justify-between">

    <Link className="flex items-center gap-2.5 group transition-transform duration-300 hover:scale-105" href="/test">
    <div className="w-9 h-9 rounded-full p-[1px] shadow-[0_0_20px_rgba(45,212,191,0.4)] group-hover:shadow-[0_0_30px_rgba(45,212,191,0.7)] transition-all duration-400" style={{background: 'linear-gradient(135deg, rgb(45, 212, 191) 0%, rgb(6, 182, 212) 50%, rgb(16, 185, 129) 100%)'}}><div className="w-full h-full rounded-full bg-[#070b0a] flex items-center justify-center relative overflow-hidden"><svg className="w-5 h-5 logo-orbit-ring" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="url(#brandLogoGrad)" strokeOpacity="0.4" strokeWidth="1.5"></circle><path d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9" stroke="url(#brandLogoGrad)" strokeLinecap="round" strokeWidth="2"></path><circle cx="12" cy="7" fill="url(#brandOrbGrad)" r="2"></circle></svg></div></div>
    <div className="flex flex-col">
    <span className="text-white font-bold tracking-tight text-base flex items-center gap-1.5 group-hover:text-teal-200 transition-colors duration-300">
                APS Tracker
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] group-hover:shadow-[0_0_12px_#34d399] group-hover:scale-125 transition-all duration-300"></span>
    </span>
    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono group-hover:text-zinc-300 transition-colors">GL Bajaj Mathura</span>
    </div>
    </Link>

    <nav className="hidden md:flex items-center gap-1 glass-pill px-2 py-1.5 rounded-full transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(20,184,166,0.15)]" data-purpose="main-navigation">
    <Link className="px-4 py-1.5 text-xs font-medium text-white bg-white/10 rounded-full transition-all duration-300 shadow-sm border border-white/15 hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]" href="/test">Home</Link>
    <Link className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/[0.08] hover:shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all duration-300" href="/leaderboard">Leaderboard</Link>
    <Link className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/[0.08] hover:shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all duration-300" href="/subject">Subjects</Link>
    <Link className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/[0.08] hover:shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all duration-300" href="/search">Search</Link>
    <div className="w-px h-3.5 bg-white/15 mx-1"></div>
    <Link className="px-3.5 py-1.5 text-xs font-medium text-teal-300 hover:text-teal-100 rounded-full hover:bg-teal-500/10 hover:shadow-[0_0_16px_rgba(45,212,191,0.3)] transition-all duration-300 flex items-center gap-1" href="/admin">Over Power</Link>
    </nav>

    <div className="flex items-center gap-3">
    <Link href="/upload" className="glass-pill hover:bg-white/[0.09] text-white text-xs font-medium py-2 px-4 rounded-full transition-all duration-300 flex items-center gap-2 border border-white/15 hover:border-teal-400/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-102 active:scale-98 group">
    <svg className="w-3.5 h-3.5 text-teal-400 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
    </svg>
    <span className="group-hover:text-teal-200 transition-colors">Upload Result</span>
    </Link>

    <button className="w-8 h-8 rounded-full border border-white/10 hover:border-teal-400/40 flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/10 hover:shadow-[0_0_14px_rgba(45,212,191,0.25)] hover:scale-105 active:scale-95 transition-all duration-300" title="Account">
    <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
    </svg>
    </button>
    </div>
    </div>
    </header>


    <main className="relative z-10 pt-10 pb-20 overflow-hidden" id="hero">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative min-h-[680px] flex flex-col justify-between">

    <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none" data-purpose="hero-starfield-backdrop"><div className="absolute rounded-full bg-white star-twinkle" style={{top: '14%', left: '8%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.8) 0px 0px 6px, rgba(45, 212, 191, 0.4) 0px 0px 10px', animationDuration: '2.8s', animationDelay: '0s'}}></div><div className="absolute rounded-full bg-cyan-200 star-twinkle" style={{top: '22%', left: '24%', width: '2px', height: '2px', boxShadow: 'rgba(6, 182, 212, 0.7) 0px 0px 7px, rgba(6, 182, 212, 0.3) 0px 0px 14px', animationDuration: '3.4s', animationDelay: '0.8s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '12%', left: '34%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.75) 0px 0px 6px', animationDuration: '2.4s', animationDelay: '1.4s'}}></div><div className="absolute rounded-full bg-teal-200 star-twinkle" style={{top: '10%', left: '68%', width: '3.5px', height: '3.5px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 10px, rgba(20, 184, 166, 0.6) 0px 0px 18px', animationDuration: '3.8s', animationDelay: '0.3s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '18%', left: '84%', width: '2px', height: '2px', boxShadow: 'rgba(255, 255, 255, 0.7) 0px 0px 6px', animationDuration: '4.2s', animationDelay: '1.9s'}}></div><div className="absolute rounded-full bg-cyan-100 star-twinkle" style={{top: '28%', left: '93%', width: '3px', height: '3px', boxShadow: 'rgba(255, 255, 255, 0.85) 0px 0px 8px, rgba(6, 182, 212, 0.5) 0px 0px 14px', animationDuration: '3.1s', animationDelay: '0.5s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '48%', left: '6%', width: '3.5px', height: '3.5px', boxShadow: 'rgba(255, 255, 255, 0.9) 0px 0px 10px, rgba(45, 212, 191, 0.55) 0px 0px 16px', animationDuration: '3.6s', animationDelay: '1.2s'}}></div><div className="absolute rounded-full bg-emerald-200 star-twinkle" style={{top: '62%', left: '16%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(52, 211, 153, 0.7) 0px 0px 7px, rgba(16, 185, 129, 0.4) 0px 0px 12px', animationDuration: '2.9s', animationDelay: '2.1s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '76%', left: '10%', width: '1.8px', height: '1.8px', boxShadow: 'rgba(255, 255, 255, 0.65) 0px 0px 5px', animationDuration: '4.5s', animationDelay: '0.7s'}}></div><div className="absolute rounded-full bg-teal-100 star-twinkle" style={{top: '72%', left: '28%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.85) 0px 0px 8px, rgba(20, 184, 166, 0.5) 0px 0px 14px', animationDuration: '3.3s', animationDelay: '1.6s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '44%', left: '91%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(255, 255, 255, 0.85) 0px 0px 8px, rgba(45, 212, 191, 0.45) 0px 0px 12px', animationDuration: '3.7s', animationDelay: '2.4s'}}></div><div className="absolute rounded-full bg-cyan-200 star-twinkle" style={{top: '60%', left: '81%', width: '4px', height: '4px', boxShadow: 'rgba(255, 255, 255, 0.95) 0px 0px 12px, rgba(6, 182, 212, 0.6) 0px 0px 20px', animationDuration: '4.1s', animationDelay: '1s'}}></div><div className="absolute rounded-full bg-white star-twinkle" style={{top: '74%', left: '72%', width: '1.8px', height: '1.8px', boxShadow: 'rgba(255, 255, 255, 0.7) 0px 0px 5px', animationDuration: '2.6s', animationDelay: '2.7s'}}></div><div className="absolute rounded-full bg-emerald-100 star-twinkle" style={{top: '70%', left: '89%', width: '2.5px', height: '2.5px', boxShadow: 'rgba(52, 211, 153, 0.7) 0px 0px 7px, rgba(16, 185, 129, 0.35) 0px 0px 12px', animationDuration: '3.5s', animationDelay: '0.2s'}}></div></div>



    <div className="absolute inset-0 pointer-events-none hidden lg:block" data-purpose="interactive-circuit-network">

    <svg className="w-full h-full" fill="none" viewBox="0 0 1200 680" xmlns="http://www.w3.org/2000/svg">
    <defs>

    <linearGradient id="glowPulseTealOut" x1="100%" x2="0%" y1="0%" y2="0%">
    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9"></stop>
    <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1"></stop>
    <stop offset="100%" stopColor="#34d399" stopOpacity="0.95"></stop>
    </linearGradient>
    <linearGradient id="glowPulseCyanOut" x1="0%" x2="100%" y1="0%" y2="0%">
    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9"></stop>
    <stop offset="50%" stopColor="#34d399" stopOpacity="1"></stop>
    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.95"></stop>
    </linearGradient>
    <linearGradient id="trackGradLeft" x1="100%" x2="0%" y1="0%" y2="0%">
    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"></stop>
    <stop offset="40%" stopColor="#2dd4bf" stopOpacity="0.32"></stop>
    <stop offset="100%" stopColor="#34d399" stopOpacity="0.1"></stop>
    </linearGradient>
    <linearGradient id="trackGradRight" x1="0%" x2="100%" y1="0%" y2="0%">
    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"></stop>
    <stop offset="40%" stopColor="#34d399" stopOpacity="0.32"></stop>
    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1"></stop>
    </linearGradient>

    <filter height="140%" id="neonFilter" width="140%" x="-20%" y="-20%">
    <feGaussianBlur result="blur" stdDeviation="3"></feGaussianBlur>
    <feMerge>
    <feMergeNode in="blur"></feMergeNode>
    <feMergeNode in="SourceGraphic"></feMergeNode>
    </feMerge>
    </filter>
    </defs>



    <path className="circuit-sparkle-dash" d="M 420 224 H 345 L 280 180 H 210" id="pathTopLeft" opacity="0.65" stroke="url(#trackGradLeft)" strokeWidth="1.2"></path>
    <path className="circuit-pulse-stream-outward" d="M 420 224 H 345 L 280 180 H 210" filter="url(#neonFilter)" stroke="url(#glowPulseTealOut)"></path>



    <path className="circuit-sparkle-dash" d="M 430 270 H 380 L 310 348 H 235" id="pathBottomLeft" opacity="0.65" stroke="url(#trackGradLeft)" strokeWidth="1.2"></path>
    <path className="circuit-pulse-stream-outward" d="M 430 270 H 380 L 310 348 H 235" filter="url(#neonFilter)" stroke="url(#glowPulseTealOut)" style={{animationDelay: '-1.4s'}}></path>



    <path className="circuit-sparkle-dash" d="M 775 224 H 840 L 910 168 H 985" id="pathTopRight" opacity="0.65" stroke="url(#trackGradRight)" strokeWidth="1.2"></path>
    <path className="circuit-pulse-stream-outward" d="M 775 224 H 840 L 910 168 H 985" filter="url(#neonFilter)" stroke="url(#glowPulseCyanOut)" style={{animationDelay: '-0.7s'}}></path>



    <path className="circuit-sparkle-dash" d="M 770 270 H 815 L 885 348 H 960" id="pathBottomRight" opacity="0.65" stroke="url(#trackGradRight)" strokeWidth="1.2"></path>
    <path className="circuit-pulse-stream-outward" d="M 770 270 H 815 L 885 348 H 960" filter="url(#neonFilter)" stroke="url(#glowPulseCyanOut)" style={{animationDelay: '-2.1s'}}></path>

    <line stroke="white" strokeOpacity="0.18" strokeWidth="1" x1="540" x2="540" y1="360" y2="480"></line>
    <line stroke="teal" strokeOpacity="0.3" strokeWidth="1" x1="590" x2="590" y1="340" y2="530"></line>
    <line stroke="white" strokeOpacity="0.15" strokeWidth="1" x1="640" x2="640" y1="370" y2="500"></line>
    </svg>

    <div className="absolute left-28 top-36 pointer-events-auto animate-float-slow interactive-metric-node cursor-pointer group" data-purpose="data-node-top-sgpa">
    <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full glass-pill border border-emerald-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 group-hover:border-emerald-300 group-hover:shadow-[0_0_22px_rgba(16,185,129,0.55)] transition-all duration-300">
    <svg className="w-3.5 h-3.5 text-emerald-300 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polygon points="12 2 2 22 22 22 12 2"></polygon>
    </svg>
    </div>
    <div className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 group-hover:bg-white/[0.08]">
    <div className="flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
    <span className="text-[11px] font-medium tracking-wide text-zinc-300 group-hover:text-white transition-colors">Top SGPA</span>
    </div>
    <div className="flex items-baseline gap-1.5 mt-0.5">
    <span className="text-sm font-mono font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">{stats ? stats.top_sgpa.toFixed(2) : "—"}</span>
    {stats && (
      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/40 transition-all">
        +{(stats.top_sgpa - stats.average_sgpa).toFixed(2)} vs avg
      </span>
    )}
    </div>
    </div>
    </div>
    </div>

    <div className="absolute left-20 top-80 pointer-events-auto animate-float-delayed interactive-metric-node cursor-pointer group" data-purpose="data-node-clean-records">
    <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full glass-pill border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:scale-110 group-hover:border-teal-300/60 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all duration-300">
    <svg className="w-3.5 h-3.5 text-zinc-300 group-hover:text-teal-200 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
    </div>
    <div className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 group-hover:bg-white/[0.08]">
    <div className="flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-teal-300 group-hover:shadow-[0_0_8px_#2dd4bf] transition-all duration-300"></span>
    <span className="text-[11px] font-medium tracking-wide text-zinc-300 group-hover:text-white transition-colors">Clean Records</span>
    </div>
    <div className="flex items-baseline gap-1 mt-0.5">
    <span className="text-sm font-mono font-bold text-white tracking-tight group-hover:text-teal-200 transition-colors">{stats ? stats.clean_records : "—"}</span>
    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors">Students Passed</span>
    </div>
    </div>
    </div>
    </div>

    <div className="absolute top-32 pointer-events-auto animate-float-delayed interactive-metric-node cursor-pointer group" data-purpose="data-node-batch-avg" style={{right: '4%'}}>
    <div className="flex items-center gap-3 flex-row-reverse">
    <div className="w-8 h-8 rounded-full glass-pill border border-teal-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.35)] group-hover:scale-110 group-hover:border-teal-300 group-hover:shadow-[0_0_25px_rgba(45,212,191,0.6)] transition-all duration-300">
    <svg className="w-4 h-4 text-teal-300 animate-spin group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" style={{animationDuration: '18s'}} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"></path>
    </svg>
    </div>
    <div className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 text-right group-hover:bg-white/[0.08]">
    <div className="flex items-center justify-end gap-1.5">
    <span className="text-[11px] font-medium tracking-wide text-zinc-300 group-hover:text-white transition-colors">Batch Avg SGPA</span>
    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#14b8a6] group-hover:shadow-[0_0_10px_#2dd4bf] transition-all"></span>
    </div>
    <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
    <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors">Avg SGPA</span>
    <span className="text-sm font-mono font-bold text-white tracking-tight group-hover:text-teal-200 transition-colors">{stats ? stats.average_sgpa.toFixed(2) : "—"}</span>
    </div>
    </div>
    </div>
    </div>

    <div className="absolute right-28 top-80 pointer-events-auto animate-float-slow interactive-metric-node cursor-pointer group" data-purpose="data-node-total-enrolled">
    <div className="flex items-center gap-3 flex-row-reverse">
    <div className="w-8 h-8 rounded-full glass-pill border border-white/15 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:border-emerald-300/60 group-hover:shadow-[0_0_22px_rgba(52,211,153,0.45)] transition-all duration-300">
    <svg className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
    </div>
    <div className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 text-right group-hover:bg-white/[0.08]">
    <div className="flex items-center justify-end gap-1.5">
    <span className="text-[11px] font-medium tracking-wide text-zinc-300 group-hover:text-white transition-colors">Total Enrolled</span>
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] group-hover:shadow-[0_0_10px_#34d399] transition-all"></span>
    </div>
    <div className="flex items-baseline justify-end gap-1 mt-0.5">
    <span className="text-sm font-mono font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">{stats ? stats.total_students : "—"}</span>
    <span className="text-[10px] text-zinc-400 font-mono group-hover:text-zinc-300 transition-colors">Engineers</span>
    </div>
    </div>
    </div>
    </div>
    </div>

    <div className="relative z-20 flex flex-col items-center text-center max-w-3xl mx-auto mt-6 sm:mt-12">

    <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-8 border border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(52,211,153,0.3)] transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 active:translate-y-0">
    <svg className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
    <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                " Only for 2024-2028 Batch :)"
              </span>
    <span className="text-xs text-zinc-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all duration-300">→</span>
    </div>

    <div className="relative mb-6">


    <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white leading-none flicker-neon-title select-none font-semibold cursor-default hover:brightness-110 transition-all duration-500" style={{letterSpacing: '-0.035em'}}>
        APS Tracker
      </h1>
    </div>

    <p className="text-sm sm:text-base md:text-lg text-zinc-400 font-normal max-w-xl mx-auto leading-relaxed mb-9 transition-colors hover:text-zinc-300 duration-300">
              Your academic leaderboard, report card tracker, and analytics hub - all in one place.
            </p>

    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">

    <Link className="btn-kinetic w-full sm:w-auto px-7 py-3 rounded-full bg-white text-[#050707] font-semibold text-xs tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-zinc-100 hover:shadow-[0_0_45px_rgba(255,255,255,0.7)] flex items-center justify-center gap-2 group" href="/leaderboard">
    <span className="">View Leaderboard</span>
    <span className="text-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
    </Link>

    <Link className="btn-kinetic w-full sm:w-auto px-7 py-3 rounded-full glass-pill text-white font-semibold text-xs tracking-wide border border-white/20 hover:bg-white/[0.09] hover:border-teal-400/40 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] flex items-center justify-center" href="/search">
                Detailed Search
              </Link>
    </div>
    </div>

    <div className="pt-16 pb-2 flex flex-col sm:flex-row items-center justify-between text-zinc-400 text-xs border-b border-white/[0.06]">

    <div className="flex items-center gap-2.5 glass-pill px-3 py-1.5 rounded-full mb-4 sm:mb-0 border border-white/10 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 cursor-pointer group">
    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
    <svg className="w-2.5 h-2.5 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
    </svg>
    </div>
    <span className="font-mono text-[11px] text-zinc-300 group-hover:text-white transition-colors">· Scroll goes brrrrrrrrrrrrrr!</span>
    </div>

    <div className="flex items-center gap-3 group cursor-default">
    <span className="text-xs font-mono tracking-wider text-emerald-400/90 group-hover:text-emerald-300 uppercase transition-colors">ANALYtics Reimagined</span>
    <div className="flex items-center gap-1">
    <div className="w-6 h-1 rounded-full bg-emerald-400 progress-live-bar"></div>
    <div className="w-2 h-1 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors"></div>
    <div className="w-2 h-1 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors"></div>
    </div>
    </div>
    </div>
    </div>
    </main>


    <section className="relative z-20 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-purpose="academic-modules-grid" id="analytics">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Link className="glass-card interactive-feature-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/10 hover:border-emerald-400/50 block" href="/leaderboard">
    <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all duration-500"></div>
    <div className="relative z-10">
    <div className="flex items-center justify-between mb-6"><div className="feature-icon-badge w-12 h-12 rounded-2xl glass-pill border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10 transition-all duration-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-4.125a4.5 4.5 0 00-7.008 0M12 3v3.75m0 0a3.75 3.75 0 013.75 3.75v.75H8.25v-.75A3.75 3.75 0 0112 6.75z" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><span className="feature-category-pill text-xs font-mono tracking-widest uppercase text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-400/40 backdrop-blur-sm shadow-sm transition-all duration-300">CGPA TIER</span></div>
    <div className="flex items-center gap-3 mb-3">
    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors tracking-tight">
            Leaderboard &amp; Rankings
          </h3>
    </div>
    <p className="text-base text-zinc-300 group-hover:text-zinc-200 leading-relaxed mb-6 font-normal transition-colors">
          Instant class standings with real-time rank normalization, SGPA tier distribution, and cutoffs across all branch divisions.
        </p>
    </div>
    <div className="relative z-10 pt-4 border-t border-white/10 group-hover:border-white/15 flex items-center justify-between transition-colors">
    <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 uppercase tracking-wider transition-colors">Normalized Percentiles</span>
    <div className="explore-btn inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400 text-[#050707] font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(45,212,191,0.6)] opacity-90 group-hover:opacity-100 transition-all duration-300">
    <span className="">Go Explore</span>
    <span className="explore-arrow transition-transform duration-300">→</span>
    </div>
    </div>
    </Link>
    <Link className="glass-card interactive-feature-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/10 hover:border-teal-400/50 block" href="/subject">
    <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 group-hover:bg-teal-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all duration-500"></div>
    <div className="relative z-10">
    <div className="flex items-center justify-between mb-6"><div className="feature-icon-badge w-12 h-12 rounded-2xl glass-pill border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.35)] bg-teal-500/10 transition-all duration-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><span className="feature-category-pill text-xs font-mono tracking-widest uppercase text-teal-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-teal-400/40 backdrop-blur-sm shadow-sm transition-all duration-300">HIGH SCORES</span></div>
    <div className="flex items-center gap-3 mb-3">
    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-teal-300 transition-colors tracking-tight">
            Subject Toppers
          </h3>
    </div>
    <p className="text-base text-zinc-300 group-hover:text-zinc-200 leading-relaxed mb-6 font-normal transition-colors">
          Detailed breakdown of highest marks in Mathematics, Data Structures, Applied Physics, and engineering core subjects.
        </p>
    </div>
    <div className="relative z-10 pt-4 border-t border-white/10 group-hover:border-white/15 flex items-center justify-between transition-colors">
    <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 uppercase tracking-wider transition-colors">Curriculum Matrix</span>
    <div className="explore-btn inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400 text-[#050707] font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(45,212,191,0.6)] opacity-90 group-hover:opacity-100 transition-all duration-300">
    <span className="">Go Explore</span>
    <span className="explore-arrow transition-transform duration-300">→</span>
    </div>
    </div>
    </Link>
    <Link className="glass-card interactive-feature-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/10 hover:border-cyan-400/50 block" href="/search">
    <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 group-hover:bg-cyan-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all duration-500"></div>
    <div className="relative z-10">
    <div className="flex items-center justify-between mb-6"><div className="feature-icon-badge w-12 h-12 rounded-2xl glass-pill border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)] bg-cyan-500/10 transition-all duration-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><span className="feature-category-pill text-xs font-mono tracking-widest uppercase text-cyan-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-cyan-400/40 backdrop-blur-sm shadow-sm transition-all duration-300">PRN LOOKUP</span></div>
    <div className="flex items-center gap-3 mb-3">
    <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight">
            Detailed Search
          </h3>
    </div>
    <p className="text-base text-zinc-300 group-hover:text-zinc-200 leading-relaxed mb-6 font-normal transition-colors">
          Query student marks by Roll Number or PRN with comprehensive radar performance charts and projected CGPA calculators.
        </p>
    </div>
    <div className="relative z-10 pt-4 border-t border-white/10 group-hover:border-white/15 flex items-center justify-between transition-colors">
    <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 uppercase tracking-wider transition-colors">Deep Scan Query</span>
    <div className="explore-btn inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 text-[#050707] font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.6)] opacity-90 group-hover:opacity-100 transition-all duration-300">
    <span className="">Go Explore</span>
    <span className="explore-arrow transition-transform duration-300">→</span>
    </div>
    </div>
    </Link></div>
    </section>



    <footer className="relative z-20 w-full border-t border-white/[0.08] py-8 mt-12 bg-black/40 backdrop-blur-sm" data-purpose="partner-ecosystem-bar">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-between gap-6 md:gap-8">
    <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs tracking-wider opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
    <svg className="w-3.5 h-3.5 fill-current text-cyan-400" viewBox="0 0 24 24">
    <path d="M6.49 4.22a1.05 1.05 0 0 1 1.48-.48l4.47 2.19a1.05 1.05 0 0 1 .57.94v3.13L8.79 5.78a1.05 1.05 0 0 1-2.3 0L6.49 4.22zm11.02 0a1.05 1.05 0 0 0-1.48-.48l-4.47 2.19a1.05 1.05 0 0 0-.57.94v3.13l4.22-4.22a1.05 1.05 0 0 0 2.3 0l-.0-1.56zM4.22 6.49a1.05 1.05 0 0 0-.48 1.48l2.19 4.47c.2.4.6.66 1.05.66h3.02L5.78 8.88a1.05 1.05 0 0 0 0-2.3L4.22 6.49zm15.56 0a1.05 1.05 0 0 1 .48 1.48l-2.19 4.47a1.05 1.05 0 0 1-1.05.66h-3.02l4.22-4.22a1.05 1.05 0 0 1 1.56-.09zM12 8.78l3.22 3.22H8.78L12 8.78zm0 6.44l-3.22-3.22h6.44L12 15.22zM4.22 17.51a1.05 1.05 0 0 1-.48-1.48l2.19-4.47a1.05 1.05 0 0 1 1.05-.66h3.02l-4.22 4.22a1.05 1.05 0 0 1 0 2.3l-1.56.09zm15.56 0a1.05 1.05 0 0 0 .48-1.48l-2.19-4.47a1.05 1.05 0 0 0-1.05-.66h-3.02l4.22 4.22a1.05 1.05 0 0 0 0 2.3l1.56.09zM6.49 19.78a1.05 1.05 0 0 0 1.48.48l4.47-2.19a1.05 1.05 0 0 0 .57-.94v-3.13l-4.22 4.22a1.05 1.05 0 0 0-2.3 0l-.0 1.56zm11.02 0a1.05 1.05 0 0 1-1.48.48l-4.47-2.19a1.05 1.05 0 0 1-.57-.94v-3.13l4.22 4.22a1.05 1.05 0 0 1 2.3 0l.0 1.56z"></path>
    </svg>
    <span className="">Netlify</span>
    </div>

    <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs tracking-wider opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
    <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z"></path>
    </svg>
    <span className="">Render</span>
    </div>

    <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs tracking-wider opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
    <svg className="w-3.5 h-3.5 fill-emerald-400" viewBox="0 0 24 24">
    <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.21 12.604a.396.396 0 0 0 .316.638H12v8.958a.396.396 0 0 0 .716.233l9.074-12.441a.396.396 0 0 0-.428-.638z"></path>
    </svg>
    <span className="">Supabase</span>
    </div>

    <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs tracking-wider opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]">
    <svg className="w-3.5 h-3.5 text-teal-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 3l9 18H3l9-18z" strokeLinecap="round" strokeLinejoin="round"></path>
    <circle cx="12" cy="14" fill="currentColor" r="1.5"></circle>
    </svg>
    <span className="">Antigravity</span>
    </div>

    <a className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-semibold text-xs tracking-wider opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] group" href="https://aktu.ac.in" rel="noreferrer" target="_blank">
    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
    </svg>
    <span className="">aktu.ac.in</span>
    <span className="text-emerald-400 font-mono transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
    </a></div>

    <div className="mt-6 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] font-mono">
    <p className="">© 2024–2028 APS Academic Registry. Encrypted Academic Intelligence.</p>
    <p className="mt-2 sm:mt-0 flex items-center gap-2">
    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Cluster Sync Status: Operational
            </p>
    </div>
    </div>
    </footer>




    </>
  );
}
