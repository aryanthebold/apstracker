'use client';

import { useEffect, useRef } from 'react';

export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const NUM_STARS = 75;
    const MAX_DIST = 180;

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
      if (!canvas) return;
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



    // ── Draw ────────────────────────────────────────────────────────────────
    const draw = () => {
      // Don't draw if the canvas is hidden (e.g. on mobile)
      if (W === 0 || H === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      
      t++;
      ctx.clearRect(0, 0, W, H);

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

      // ── Update stars with parallax ───────────────────
      for (const s of stars) {

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

          const finalAlpha = Math.min(lineAlpha, 0.9);
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

        // Outer glow
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        glow.addColorStop(0, `rgba(${cr},${s.alpha * 0.7})`);
        glow.addColorStop(0.4, `rgba(${cr},${s.alpha * 0.15})`);
        glow.addColorStop(1, `rgba(${cr},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core star
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,220,255,${Math.min(s.alpha, 1)})`;
        ctx.fill();

        // Sparkle cross for bright stars
        if (s.tier === 2) {
          const arm = s.r * 3;
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
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
