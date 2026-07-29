'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Award, Search, UploadCloud, Home, ShieldAlert, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Award },
    { href: '/subject', label: 'Subjects', icon: LayoutDashboard },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/admin', label: 'OverPower', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Desktop Navigation — sticky */}
      <header
        className={`sticky top-0 z-50 w-full hidden md:block pointer-events-none transition-all duration-500 ${scrolled ? 'pt-3' : 'pt-5'
          }`}
      >
        <div className="mx-auto max-w-7xl px-8 flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex flex-col group pointer-events-auto">
            <span
              className="text-2xl md:text-[28px] font-extrabold tracking-wide transition-all duration-300 group-hover:opacity-90"
              style={{ fontFamily: 'var(--font-coolvetica), "Coolvetica", cursive' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                APS
              </span>
              <span className="text-text-primary"> Tracker</span>
            </span>
            <span className="text-[11px] text-text-secondary font-medium tracking-widest uppercase mt-0.5">
              · GL Bajaj Mathura ·
            </span>
          </Link>

          {/* Nav links bubble - centered */}
          <div
            className={`liquid-glass-nav rounded-full px-6 py-0 flex h-[54px] items-center pointer-events-auto transition-all duration-500 ${scrolled ? 'liquid-glass-nav-scrolled shadow-2xl' : ''
              }`}
          >
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-full ${isActive
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

          {/* Upload CTA — filled pill */}
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-accent-primary hover:bg-accent-primary/90 px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-200 shadow-[0_0_20px_rgba(91,156,246,0.35)] hover:shadow-[0_0_28px_rgba(91,156,246,0.5)] hover:scale-[1.04] active:scale-[0.97] pointer-events-auto"
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Upload Result
          </Link>
        </div>
      </header>

      {/* Mobile Header (Top) */}
      <header className="sticky top-0 z-50 w-full pt-3 pb-2 px-4 md:hidden bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle/50 flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex flex-col group">
          <span
            className="text-xl font-extrabold tracking-wide transition-all duration-300 group-hover:opacity-90"
            style={{ fontFamily: 'var(--font-coolvetica), "Coolvetica", cursive' }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              APS
            </span>
            <span className="text-text-primary"> Tracker</span>
          </span>
          <span className="text-[8px] text-text-secondary tracking-widest uppercase">· GL Bajaj ·</span>
        </Link>
        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[78vw] max-w-[320px] z-[70] bg-bg-secondary/95 backdrop-blur-2xl border-l border-border-subtle flex flex-col pt-6 px-6 pb-10 md:hidden transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">Navigation</span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'text-accent-primary bg-accent-primary/10 border border-accent-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Upload CTA at bottom of drawer */}
        <Link
          href="/upload"
          onClick={() => setDrawerOpen(false)}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-accent-primary hover:bg-accent-primary/90 px-5 py-3.5 text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(91,156,246,0.3)] active:scale-95"
        >
          <UploadCloud className="h-4 w-4" />
          Upload Result PDF
        </Link>
      </aside>
    </>
  );
}
