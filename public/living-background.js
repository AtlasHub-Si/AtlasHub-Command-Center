/* Atlas Motion | Living Background v1.0.0
 * Adapted from AtlasHub-Si/AtlasHub.SI-WebSite@df12c5b06b6793ef44cc06e486648f9ac399e5a7, components/motion/LivingParticleField.tsx.
 * Original particle distribution, wave paths, attraction and spring physics retained.
 * No external runtime dependencies. Internal AtlasHub use; see provenance.json.
 */
(function (global) {
"use strict";
const MINERAL_COLORS = [
  "#CDA66C", // Champagne Gold
  "#E5C287", // Bright Champagne Gold
  "#CBD5E1", // Platinum Silver
  "#ECF4F6", // Light Mineral Ink
  "#36BDD0", // Restrained Energy Cyan
];

const ATTRACTION_RADIUS = 100;

function seededUnit(index, salt) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createParticles(count, colors = MINERAL_COLORS) {
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const r1 = seededUnit(i, 1);
    const r2 = seededUnit(i, 2);
    const r3 = seededUnit(i, 3);
    const r4 = seededUnit(i, 4);
    const r5 = seededUnit(i, 5);

    const band = i % 3;
    const colorPick =
      r5 < 0.38
        ? colors[0]
        : r5 < 0.56
          ? colors[1]
          : r5 < 0.78
            ? colors[2]
            : r5 < 0.88
              ? colors[3]
              : colors[4];

    const baseYRatio =
      band === 0
        ? 0.64 + (r2 - 0.5) * 0.16
        : band === 1
          ? 0.74 + (r2 - 0.5) * 0.18
          : 0.84 + (r2 - 0.5) * 0.14;

    particles.push({
      u: (i + r1 * 0.85) / count,
      band,
      baseYRatio,
      amp: 14 + r3 * 28,
      freq: 1.6 + band * 0.7 + r4 * 0.8,
      phase: r1 * Math.PI * 2 + band * 1.4,
      speed: (0.18 + r3 * 0.24) * (band === 1 ? -1 : 1),
      size: 0.9 + r4 * 1.5,
      alpha: 0.24 + r3 * 0.54,
      color: colorPick,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
    });
  }
  return particles;
}


function mount(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("A canvas is required");
  const ctx = canvas.getContext("2d");
  const noop = { pause() {}, resume() {}, destroy() {}, isPaused() { return true; } };
  if (!ctx) return noop;
  const root = options.root || canvas.parentElement;
  const density = options.density || "hero";
  const interactive = options.interactive !== false;
  const attractionRadius = Math.max(20, Math.min(240, Number(options.attractionRadius) || ATTRACTION_RADIUS));
  const colors = Array.isArray(options.colors) && options.colors.length === 5 ? options.colors : MINERAL_COLORS;
  let width = 0, height = 0, dpr = 1, particles = [], rafId = null;
  let visible = !document.hidden, inView = true, manualPause = false, destroyed = false;
  let previous = null, elapsed = 0, lastRippleAt = -Infinity;
  const motion = global.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: -9999, y: -9999, active: false };
  const ripples = [];
  const getTargetCount = (w) => {
    if (Number.isFinite(options.particleCount)) return Math.max(1, Math.min(600, Math.floor(options.particleCount)));
    return density === "ambient" ? (w < 768 ? 48 : 130) : (w < 768 ? 80 : 240);
  };
    const drawFrame = (timeSec, animatePhysics) => {
      if (width === 0 || height === 0) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Subtle mineral contour wave filaments beneath the particles
      const waveCount = 3;
      for (let w = 0; w < waveCount; w += 1) {
        ctx.beginPath();
        const baseY = height * (0.64 + w * 0.1);
        const step = Math.max(24, width / 32);
        for (let x = 0; x <= width + step; x += step) {
          const normX = x / Math.max(width, 1);
          const waveY =
            baseY +
            Math.sin(
              normX * Math.PI * (2.2 + w * 0.5) +
                timeSec * (0.28 + w * 0.08) +
                w * 1.3,
            ) *
              (16 + w * 6) +
            Math.cos(normX * Math.PI * 4.1 - timeSec * 0.16) * 7;
          if (x === 0) {
            ctx.moveTo(x, waveY);
          } else {
            ctx.lineTo(x, waveY);
          }
        }
        ctx.strokeStyle =
          w === 2 ? "rgba(54, 189, 208, 0.07)" : "rgba(205, 166, 108, 0.09)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const nowMs = performance.now();
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i];
        const progress = (nowMs - ripple.startedAt) / ripple.duration;
        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = progress * ripple.maxRadius;
        const opacity = (1 - progress) * 0.34;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(229, 194, 135, ${opacity.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const homeX = p.u * width;
        const homeY =
          height * p.baseYRatio +
          Math.sin(p.u * Math.PI * p.freq + p.phase + timeSec * p.speed) *
            p.amp +
          Math.cos(p.u * Math.PI * (p.freq * 1.7) - timeSec * 0.22 + p.band) *
            (p.amp * 0.32);

        let boost = 0;

        if (animatePhysics) {
          let fx = 0;
          let fy = 0;

          if (interactive && pointer.active) {
            const dx = pointer.x - (homeX + p.dx);
            const dy = pointer.y - (homeY + p.dy);
            const dist = Math.hypot(dx, dy);
            if (dist > 0.5 && dist < attractionRadius) {
              const force = (1 - dist / attractionRadius) * 0.82;
              fx += (dx / dist) * force * 3.1;
              fy += (dy / dist) * force * 3.1;
              boost = Math.max(boost, (1 - dist / attractionRadius) * 0.38);
            }
          }

          for (let rIdx = 0; rIdx < ripples.length; rIdx += 1) {
            const ripple = ripples[rIdx];
            const progress = (nowMs - ripple.startedAt) / ripple.duration;
            const ringRadius = progress * ripple.maxRadius;
            const rx = homeX + p.dx - ripple.x;
            const ry = homeY + p.dy - ripple.y;
            const dist = Math.hypot(rx, ry);
            const delta = Math.abs(dist - ringRadius);
            if (dist > 1 && delta < 32) {
              const waveForce = (1 - delta / 32) * (1 - progress) * 2.8;
              fx += (rx / dist) * waveForce;
              fy += (ry / dist) * waveForce;
              boost = Math.max(boost, (1 - delta / 32) * 0.42);
            }
          }

          p.vx = (p.vx + fx - p.dx * 0.055) * 0.84;
          p.vy = (p.vy + fy - p.dy * 0.055) * 0.84;
          p.dx += p.vx;
          p.dy += p.vy;
        } else {
          p.dx = 0;
          p.dy = 0;
          p.vx = 0;
          p.vy = 0;
        }

        const x = homeX + p.dx;
        const y = homeY + p.dy;

        const textZoneFade =
          options.editorialFade && x < width * 0.48 && y < height * 0.56 ? 0.48 : 1;
        const pulse = options.pulse ? 0.9 + 0.1 * Math.sin(timeSec * 0.85 + p.phase) : 1;
        const finalAlpha = Math.min(0.95, (p.alpha + boost) * textZoneFade * pulse);

        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size + boost * 1.1, 0, Math.PI * 2);
        ctx.fill();

        if (p.size > 1.85 || boost > 0.16) {
          ctx.globalAlpha = finalAlpha * 0.24;
          ctx.beginPath();
          ctx.arc(x, y, p.size * 2.6 + boost * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    };


  const paused = () => destroyed || manualPause || motion.matches || !visible || !inView;
  function stop() { if (rafId !== null) global.cancelAnimationFrame(rafId); rafId = null; previous = null; }
  function sync() {
    if (destroyed) return;
    root?.setAttribute("data-motion-paused", String(paused()));
    if (paused()) {
      stop(); pointer.active = false; ripples.length = 0;
      if (motion.matches || manualPause) drawFrame(motion.matches ? 0 : elapsed, false);
    } else if (rafId === null) rafId = global.requestAnimationFrame(tick);
  }
  function tick(now) {
    rafId = null;
    if (paused()) { sync(); return; }
    // Preserve the original 60Hz spring physics on high-refresh displays.
    if (previous === null || now - previous >= 15) {
      elapsed += previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      drawFrame(elapsed, true);
    }
    rafId = global.requestAnimationFrame(tick);
  }
  function resize() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width)); height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = getTargetCount(width);
    if (particles.length !== count) particles = createParticles(count, colors);
    drawFrame(motion.matches ? 0 : elapsed, false);
  }
  function move(event) {
    if (paused() || !interactive) return;
    const r = canvas.getBoundingClientRect();
    pointer.active = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    pointer.x = event.clientX - r.left; pointer.y = event.clientY - r.top;
  }
  function leave() { pointer.active = false; }
  function up(event) { if (event.pointerType === "touch") leave(); }
  function down(event) {
    if (paused() || !interactive) return;
    move(event);
    const now = performance.now();
    if (!pointer.active || now - lastRippleAt < 180) return;
    lastRippleAt = now; if (ripples.length >= 4) ripples.shift();
    ripples.push({x:pointer.x,y:pointer.y,startedAt:now,duration:620,maxRadius:150});
  }
  function onVisibility() { visible = !document.hidden; sync(); }
  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  const intersectionObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; sync(); }, {threshold:0.02}) : null;
  resizeObserver?.observe(canvas); intersectionObserver?.observe(canvas);
  global.addEventListener("resize", resize, {passive:true});
  document.addEventListener("visibilitychange", onVisibility);
  motion.addEventListener("change", sync);
  if (interactive) {
    global.addEventListener("pointermove", move, {passive:true});
    global.addEventListener("pointerdown", down, {passive:true});
    global.addEventListener("pointerup", up, {passive:true});
    global.addEventListener("pointercancel", leave);
    global.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave);
  }
  resize(); sync();
  return {
    pause() { manualPause = true; sync(); },
    resume() { manualPause = false; sync(); },
    isPaused: paused,
    destroy() {
      destroyed = true; stop(); resizeObserver?.disconnect(); intersectionObserver?.disconnect();
      global.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", sync);
      global.removeEventListener("pointermove", move); global.removeEventListener("pointerdown", down);
      global.removeEventListener("pointerup", up); global.removeEventListener("pointercancel", leave); global.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      root?.removeAttribute("data-motion-paused");
    }
  };
}
global.AtlasLivingBackground = Object.freeze({version:"1.0.0", mount});
})(globalThis);
