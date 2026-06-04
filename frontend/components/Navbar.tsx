'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Award, Search, UploadCloud, Home, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Award },
    { href: '/subject', label: 'Subjects', icon: LayoutDashboard },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/admin', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Desktop Navigation — sticky */}
      <header
        className={`sticky top-0 z-50 w-full pt-5 hidden md:block pointer-events-none transition-all duration-500 ${
          scrolled ? 'pt-3' : 'pt-5'
        }`}
      >
        <div className="mx-auto max-w-7xl px-8 flex items-center justify-between w-full">
          {/* Logo - outside bubble, top-left */}
          <Link href="/" className="flex items-center gap-3 group pointer-events-auto">
            <span
              className="text-2xl md:text-[28px] font-extrabold tracking-wide transition-all duration-300 group-hover:opacity-90"
              style={{ fontFamily: 'var(--font-coolvetica), "Coolvetica", cursive' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                APS
              </span>
              <span className="text-text-primary"> Tracker</span>
            </span>
            <span className="rounded-full bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 text-[9px] text-accent-primary font-bold tracking-widest uppercase">
              GL Bajaj
            </span>
          </Link>

          {/* Nav links bubble - centered */}
          <div
            className={`liquid-glass-nav rounded-full px-6 py-0 flex h-[54px] items-center pointer-events-auto transition-all duration-500 ${
              scrolled ? 'liquid-glass-nav-scrolled shadow-2xl' : ''
            }`}
          >
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-full ${
                      isActive
                        ? 'text-accent-primary bg-accent-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-accent-primary/70 to-transparent" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Upload CTA - top-right, outside bubble */}
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/25 px-5 py-2.5 text-[13px] font-bold text-accent-primary transition-all duration-250 hover:shadow-[0_0_20px_rgba(91,156,246,0.3)] hover:scale-[1.03] active:scale-[0.97] pointer-events-auto"
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Upload Result
          </Link>
        </div>
      </header>

      {/* Mobile Header (Top) */}
      <header className="sticky top-0 z-50 w-full pt-4 pb-2 px-4 md:hidden bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle/50 flex items-center justify-between pointer-events-auto">
         <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-xl font-extrabold tracking-wide transition-all duration-300 group-hover:opacity-90"
              style={{ fontFamily: 'var(--font-coolvetica), "Coolvetica", cursive' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                APS
              </span>
              <span className="text-text-primary"> Tracker</span>
            </span>
            <span className="rounded-full bg-accent-primary/10 border border-accent-primary/20 px-1.5 py-0.5 text-[8px] text-accent-primary font-bold tracking-widest uppercase">
              GL Bajaj
            </span>
         </Link>
      </header>

      {/* Mobile Navigation — bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-secondary/80 backdrop-blur-2xl flex justify-around py-2 px-2 md:hidden safe-area-inset-bottom">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                isActive ? 'text-accent-primary' : 'text-text-tertiary'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary/15' : ''}`}>
                <Icon className="h-4 w-4" />
              </div>
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/upload"
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 ${
            pathname === '/upload' ? 'text-accent-primary' : 'text-text-tertiary'
          }`}
        >
          <div className="rounded-xl bg-accent-primary p-1.5 text-white shadow-[0_0_12px_rgba(91,156,246,0.5)]">
            <UploadCloud className="h-4 w-4" />
          </div>
          Upload
        </Link>
      </nav>
    </>
  );
}
