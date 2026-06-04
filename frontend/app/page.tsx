'use client';

import Link from 'next/link';
import StatsBar from '@/components/StatsBar';
import { Award, UploadCloud, Search, BookOpen, ExternalLink, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

// ─── Constellation Canvas ────────────────────────────────────────────────────
function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;
    let t = 0;

    // ── Types ──────────────────────────────────────────────────────────────
    interface Star {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      baseAlpha: number;
      alpha: number;
      twinkleSpeed: number;
      twinkleOffset: number;
      tier: 0 | 1 | 2; // 0=dim, 1=mid, 2=bright
    }

    interface Meteor {
      x: number; y: number;
      vx: number; vy: number;
      len: number;
      alpha: number;
      life: number;
      maxLife: number;
    }

    const NUM_STARS = 200;
    const MAX_DIST = 160;
    const MOUSE_DIST = 200;
    const MOUSE_PUSH = 80; // px repulsion radius

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteor = 0;

    // Tier color palettes
    const TIER_COLORS: [string, string, string][] = [
      ['140,120,255', '100,160,255', '140,120,255'],  // violet-blue (dim)
      ['180,140,255', '120,200,255', '180,140,255'],  // brighter violet-cyan
      ['220,200,255', '160,240,255', '220,200,255'],  // white-ish bright
    ];

    // ── Resize ─────────────────────────────────────────────────────────────
    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };

    // ── Spawn Stars ────────────────────────────────────────────────────────
    const spawnStars = () => {
      stars = Array.from({ length: NUM_STARS }, () => {
        const tier = Math.random() < 0.6 ? 0 : Math.random() < 0.65 ? 1 : 2;
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * (tier === 0 ? 0.12 : tier === 1 ? 0.2 : 0.28),
          vy: (Math.random() - 0.5) * (tier === 0 ? 0.12 : tier === 1 ? 0.2 : 0.28),
          r: tier === 0 ? Math.random() * 0.8 + 0.4
             : tier === 1 ? Math.random() * 1.0 + 0.8
             : Math.random() * 1.2 + 1.2,
          baseAlpha: tier === 0 ? Math.random() * 0.4 + 0.25
                     : tier === 1 ? Math.random() * 0.45 + 0.4
                     : Math.random() * 0.35 + 0.6,
          alpha: 0,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          tier: tier as 0 | 1 | 2,
        };
      });
    };

    // ── Spawn Meteor ───────────────────────────────────────────────────────
    const spawnMeteor = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      const speed = 6 + Math.random() * 6;
      meteors.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 80 + Math.random() * 140,
        alpha: 0.9 + Math.random() * 0.1,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
    };

    // ── Mouse tracking ─────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Draw ────────────────────────────────────────────────────────────────
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Spawn meteor periodically
      if (t >= nextMeteor) {
        spawnMeteor();
        nextMeteor = t + 180 + Math.floor(Math.random() * 300);
      }

      // ── Update & draw meteors ──────────────────────────────────────────
      meteors = meteors.filter(m => m.life < m.maxLife);
      for (const m of meteors) {
        const progress = m.life / m.maxLife;
        const a = m.alpha * (1 - progress);
        const tailX = m.x - Math.cos(Math.atan2(m.vy, m.vx)) * m.len * (1 - progress * 0.5);
        const tailY = m.y - Math.sin(Math.atan2(m.vy, m.vx)) * m.len * (1 - progress * 0.5);

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.3, `rgba(180,160,255,${a * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${a})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tip glow
        const tipGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
        tipGlow.addColorStop(0, `rgba(255,255,255,${a})`);
        tipGlow.addColorStop(1, `rgba(180,140,255,0)`);
        ctx.beginPath();
        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = tipGlow;
        ctx.fill();

        m.x += m.vx;
        m.y += m.vy;
        m.life++;
      }

      // ── Update stars with mouse repulsion & parallax ───────────────────
      for (const s of stars) {
        // Mouse repulsion
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_PUSH && dist > 0) {
          const force = (MOUSE_PUSH - dist) / MOUSE_PUSH;
          s.x += (dx / dist) * force * 2.5;
          s.y += (dy / dist) * force * 2.5;
        }

        s.x = (s.x + s.vx + W) % W;
        s.y = (s.y + s.vy + H) % H;
        s.alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
      }

      // ── Draw connection lines ──────────────────────────────────────────
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const ddx = stars[i].x - stars[j].x;
          const ddy = stars[i].y - stars[j].y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d >= MAX_DIST) continue;

          const fade = 1 - d / MAX_DIST;
          const tierBoost = (stars[i].tier + stars[j].tier) * 0.15 + 0.7;
          const lineAlpha = fade * fade * tierBoost * 0.32 * Math.min(stars[i].alpha, stars[j].alpha);

          // Mouse proximity boosts nearby lines
          const midX = (stars[i].x + stars[j].x) / 2;
          const midY = (stars[i].y + stars[j].y) / 2;
          const mdist = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
          const mouseFactor = mdist < MOUSE_DIST ? 1 + (1 - mdist / MOUSE_DIST) * 2 : 1;

          const finalAlpha = Math.min(lineAlpha * mouseFactor, 0.9);
          const [c1, c2] = [TIER_COLORS[stars[i].tier], TIER_COLORS[stars[j].tier]];

          const grad = ctx.createLinearGradient(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
          grad.addColorStop(0, `rgba(${c1[0]},${finalAlpha})`);
          grad.addColorStop(0.5, `rgba(${c2[1]},${finalAlpha * 0.6})`);
          grad.addColorStop(1, `rgba(${c1[2]},${finalAlpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.6 + stars[i].tier * 0.2;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.stroke();
        }
      }

      // ── Draw stars ─────────────────────────────────────────────────────
      for (const s of stars) {
        const [cr] = TIER_COLORS[s.tier];
        const glowR = s.r * (s.tier === 2 ? 9 : s.tier === 1 ? 7 : 5);

        // Mouse proximity extra glow
        const ddx = s.x - mx;
        const ddy = s.y - my;
        const mdist = Math.sqrt(ddx * ddx + ddy * ddy);
        const mglow = mdist < MOUSE_DIST ? (1 - mdist / MOUSE_DIST) * 0.6 : 0;

        // Outer glow
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        glow.addColorStop(0, `rgba(${cr},${(s.alpha + mglow) * 0.7})`);
        glow.addColorStop(0.4, `rgba(${cr},${(s.alpha + mglow) * 0.15})`);
        glow.addColorStop(1, `rgba(${cr},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core star
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + mglow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,220,255,${Math.min(s.alpha + mglow, 1)})`;
        ctx.fill();

        // Sparkle cross for bright stars
        if (s.tier === 2) {
          const arm = s.r * 3 + mglow * 4;
          ctx.strokeStyle = `rgba(255,255,255,${s.alpha * 0.4})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(s.x - arm, s.y); ctx.lineTo(s.x + arm, s.y);
          ctx.moveTo(s.x, s.y - arm); ctx.lineTo(s.x, s.y + arm);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => { resize(); spawnStars(); });
    ro.observe(canvas);
    resize();
    spawnStars();
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default function HomePage() {
  return (
    <div className="w-full flex flex-col min-h-screen text-text-primary selection:bg-accent-primary/30 selection:text-accent-primary">

      {/* =============================================
          SECTION 1: Hero
          ============================================= */}
      <section className="relative min-h-[calc(100vh-90px)] flex flex-col items-center justify-center py-20 md:py-12 px-4 md:px-8">

        {/* Backgrounds wrapper */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Live constellation canvas */}
          <ConstellationBackground />

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
              className="text-[4rem] sm:text-[5.5rem] md:text-[6.5rem] lg:text-[7.5rem] font-bold tracking-[0.06em] logo-glow-gradient leading-none select-none"
              style={{ fontFamily: 'var(--font-coolvetica), "Coolvetica", cursive' }}
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
        <div className="animate-fade-in-up delay-500 absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 hover:opacity-60 transition-opacity">
          <span className="text-[9px] uppercase tracking-[0.2em] text-text-secondary">Scroll goes brrrrrrrrrr</span>
          <ChevronDown className="h-3 w-3 text-text-secondary animate-bounce" />
        </div>
      </section>

      {/* =============================================
          SECTION 2: Features Bento Grid
          ============================================= */}
      <section className="w-full max-w-5xl mx-auto py-20 px-4 md:px-8 space-y-14">

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
  );
}
