'use client';

import Link from 'next/link';
import StatsBar from '@/components/StatsBar';
import { Award, UploadCloud, Search, BookOpen, ExternalLink, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import SmoothScroll from '@/components/SmoothScroll';


export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="w-full flex flex-col min-h-screen text-text-primary selection:bg-accent-primary/30 selection:text-accent-primary">

      {/* =============================================
          SECTION 1: Hero
          ============================================= */}
      <section className="relative min-h-[calc(100vh-90px)] flex flex-col items-center justify-center py-20 md:py-12 px-4 md:px-8">

        {/* Backgrounds wrapper */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">


          {/* Decorative radial glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/5 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-blue-600/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-cyan-500/4 rounded-full blur-[100px]" />

          {/* Decorative floating orbs */}
          <div className="absolute top-16 left-10 w-2 h-2 rounded-full bg-accent-primary/40 animate-pulse hidden lg:block" />
          <div className="absolute top-32 right-16 w-1.5 h-1.5 rounded-full bg-accent-violet/50 animate-pulse delay-300 hidden lg:block" />
          <div className="absolute bottom-32 left-20 w-1 h-1 rounded-full bg-accent-cyan/60 animate-pulse delay-500 hidden lg:block" />
        </div>

        {/* Main content */}
        <div className="relative flex flex-col items-center text-center z-10 max-w-4xl mx-auto space-y-5">

          {/* Batch badge */}
          <div className="animate-fade-in-down">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-primary/8 border border-accent-primary/18 px-4 py-1.5 text-[11px] font-bold text-accent-primary tracking-[0.15em] uppercase backdrop-blur-sm">

              GL Bajaj Group of Institutes, Mathura
            </span>
          </div>

          {/* Main Logo */}
          <div className="animate-fade-in-up delay-100 space-y-0">
            <h1
              className="text-[3.8rem] sm:text-[5.5rem] md:text-[6.5rem] lg:text-[7.5rem] font-black tracking-tighter sm:tracking-[0.06em] logo-glow-gradient leading-none select-none font-figtree sm:font-coolvetica"
            >
              APS Tracker
            </h1>
            <p className="text-text-secondary text-xs md:text-sm font-medium italic tracking-wider opacity-75 mt-1">
              Only for 2024–2028 Batch :)
            </p>
          </div>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-200 text-text-secondary text-xs md:text-sm leading-relaxed max-w-lg opacity-85">
            Your academic leaderboard, report card tracker, and analytics hub — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-wrap items-center justify-center gap-4 pt-1">
            <Link
              href="/leaderboard"
              className="btn-pebble glow-blue inline-flex items-center justify-center text-white font-bold px-8 py-3.5 text-xs gap-2 group"
            >
              <Award className="h-4.5 w-4.5" />
              View Leaderboard
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/upload"
              className="btn-pebble glow-subtle inline-flex items-center justify-center text-text-primary font-bold px-8 py-3.5 text-xs gap-2"
            >
              <UploadCloud className="h-4.5 w-4.5 text-accent-primary" />
              Upload Result PDF
            </Link>
          </div>
        </div>

        {/* Stats section at bottom of hero */}
        <div className="relative animate-fade-in-up delay-400 w-full max-w-4xl mx-auto z-10 mt-8 space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-success animate-live-blink" />
              </span>
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.14em]">
                Live Batch Performance
              </span>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary tracking-wider">2024–28</span>
          </div>
          <div className="bg-bg-secondary/35 backdrop-blur-2xl border border-border-subtle rounded-[1.75rem] p-5 shadow-2xl animate-glow-pulse">
            <StatsBar />
          </div>
        </div>

        {/* Scroll hint */}
        <button 
          onClick={() => {
            const nextSection = document.getElementById('explore');
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="animate-fade-in-up delay-500 absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 hover:opacity-60 transition-opacity cursor-pointer"
        >
          <span className="text-[9px] uppercase tracking-[0.2em] text-text-secondary">Scroll goes brrrrrrrrrr</span>
          <ChevronDown className="h-3 w-3 text-text-secondary animate-bounce" />
        </button>
      </section>

      {/* =============================================
          SECTION 2: Features Bento Grid
          ============================================= */}
      <section id="explore" className="w-full max-w-5xl mx-auto py-20 px-4 md:px-8 space-y-14">

        {/* Section heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-[10px] font-bold text-accent-primary uppercase tracking-[0.2em] mb-2">
            Explore
          </span>
          <h2 className="text-2xl md:text-[2rem] font-extrabold text-text-primary tracking-tight leading-tight">
            Academic Analytics,{' '}
            <span className="text-gradient-blue">Reimagined</span>
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Deep dive into student marks, rankings, and subject metrics- all parsed from official AKTU marksheets hehee :D
          </p>
        </div>

        {/* Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Award,
              title: 'Leaderboard & Rankings',
              desc: 'Dynamic rankings by cumulative or semester-wise SGPA. Filter by branch, sort by performance, and find where you stand.',
              color: 'text-accent-primary',
              bg: 'bg-accent-primary/5',
              glowBg: 'bg-accent-primary/8',
              href: '/leaderboard',
              accent: 'from-accent-primary/20 to-transparent',
            },
            {
              icon: BookOpen,
              title: 'Subject Toppers',
              desc: 'Discover who scored highest in each subject across semesters. View theory, practical, and internal scores in detail.',
              color: 'text-accent-gold',
              bg: 'bg-accent-gold/5',
              glowBg: 'bg-accent-gold/8',
              href: '/subject',
              accent: 'from-accent-gold/20 to-transparent',
            },
            {
              icon: Search,
              title: 'Detailed Search',
              desc: 'Find any student by name or roll number. View full report cards with semester summaries and all subject grades.',
              color: 'text-accent-success',
              bg: 'bg-accent-success/5',
              glowBg: 'bg-accent-success/8',
              href: '/search',
              accent: 'from-accent-success/20 to-transparent',
            },
          ].map(({ icon: Icon, title, desc, color, bg, glowBg, href, accent }) => (
            <Link
              key={href}
              href={href}
              className="glass-panel glass-panel-hover rounded-[1.75rem] p-7 space-y-4 relative overflow-hidden group block"
            >
              {/* Corner glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${glowBg} rounded-full blur-2xl transition-all duration-500 group-hover:w-40 group-hover:h-40`} />
              {/* Bottom gradient line */}
              <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${accent}`} />

              <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center ${color} relative`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="space-y-2 relative">
                <h3 className="font-bold text-base text-text-primary leading-tight">{title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{desc}</p>
              </div>

              <div className={`flex items-center gap-1 text-[11px] font-semibold ${color} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0`}>
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-text-tertiary border-t border-border-subtle/40 pt-10 flex items-center justify-center gap-1.5 font-medium">
          <span>Results parsed from official PDF marksheets via</span>
          <a
            href="https://aktu.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary/80 flex items-center gap-0.5 hover:text-accent-primary transition-colors"
          >
            aktu.ac.in <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </section>
    </div>
    </SmoothScroll>
  );
}
