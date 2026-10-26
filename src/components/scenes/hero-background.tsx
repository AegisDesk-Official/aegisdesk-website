'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSearchParams } from 'next/navigation';
import { Play, Pause } from 'lucide-react';
import { Leva, useControls, button } from 'leva';

gsap.registerPlugin(useGSAP);

export interface FrameTuneValues {
  scale: number;
  x: number;
  y: number;
}

export type TuningState = Record<string, FrameTuneValues>;

const DEFAULT_TUNING: TuningState = {
  'hero-01': { scale: 1.0, x: 0, y: 0 },
  'hero-02': { scale: 1.0, x: 0, y: 0 },
  'hero-03': { scale: 1.0, x: 0, y: 0 },
  'hero-04': { scale: 1.0, x: 0, y: 0 },
  'hero-05': { scale: 1.0, x: 0, y: 0 },
  'hero-06': { scale: 1.0, x: 0, y: 0 },
  'hero-07': { scale: 1.0, x: 0, y: 0 },
  'hero-08': { scale: 1.0, x: 0, y: 0 },
};

// Hold times specified in task requirement 3:
// 01: 1.5s, 02: 1.5s, 03: 2s, 04: 8s, 05: 3s, 06: 3s, 07: 2.5s, 08: 1.5s
const HOLD_TIMES: Record<string, number> = {
  'hero-01': 1.5,
  'hero-02': 1.5,
  'hero-03': 2.0,
  'hero-04': 8.0,
  'hero-05': 3.0,
  'hero-06': 3.0,
  'hero-07': 2.5,
  'hero-08': 1.5,
};

const DISSOLVE_DURATION = 3.5;

const ALL_FRAMES = [
  'hero-01',
  'hero-02',
  'hero-03',
  'hero-04',
  'hero-05',
  'hero-06',
  'hero-07',
  'hero-08',
] as const;

interface TuningPanelProps {
  onTuningUpdate: (t: TuningState) => void;
  onManualFrameChange: (f: string) => void;
}

function TuningPanelInner({ onTuningUpdate, onManualFrameChange }: TuningPanelProps) {
  const searchParams = useSearchParams();
  const isTuneMode = searchParams.get('tune') === '1';

  useControls(
    'Hero Frames Tuning',
    {
      previewFrame: {
        value: 'auto',
        options: ['auto', ...ALL_FRAMES],
        label: 'Inspect Frame',
        onChange: (v: string) => onManualFrameChange(v),
      },
      ...ALL_FRAMES.reduce((acc, frame) => {
        acc[`${frame}_scale`] = {
          value: DEFAULT_TUNING[frame].scale,
          min: 0.85,
          max: 1.25,
          step: 0.001,
          label: `${frame} scale`,
          onChange: (val: number) => {
            onTuningUpdate({
              ...DEFAULT_TUNING,
              [frame]: { scale: val, x: 0, y: 0 },
            });
          },
        };
        acc[`${frame}_x`] = {
          value: DEFAULT_TUNING[frame].x,
          min: -60,
          max: 60,
          step: 0.5,
          label: `${frame} X (px)`,
          onChange: (val: number) => {
            onTuningUpdate({
              ...DEFAULT_TUNING,
              [frame]: { scale: 1.0, x: val, y: 0 },
            });
          },
        };
        acc[`${frame}_y`] = {
          value: DEFAULT_TUNING[frame].y,
          min: -60,
          max: 60,
          step: 0.5,
          label: `${frame} Y (px)`,
          onChange: (val: number) => {
            onTuningUpdate({
              ...DEFAULT_TUNING,
              [frame]: { scale: 1.0, x: 0, y: val },
            });
          },
        };
        return acc;
      }, {} as any),
      'Copy values': button((get: (path: string) => any) => {
        const exported: TuningState = {};
        ALL_FRAMES.forEach((frame) => {
          exported[frame] = {
            scale: Number(get(`Hero Frames Tuning.${frame}_scale`)),
            x: Number(get(`Hero Frames Tuning.${frame}_x`)),
            y: Number(get(`Hero Frames Tuning.${frame}_y`)),
          };
        });
        const json = JSON.stringify(exported, null, 2);
        navigator.clipboard.writeText(json);
        alert('Tuning JSON copied to clipboard!\n\n' + json);
      }),
    },
    { render: () => isTuneMode }
  );

  if (!isTuneMode) return null;

  return (
    <Leva
      hidden={false}
      collapsed={false}
      titleBar={{ title: 'AegisDesk · Hero Slit Alignment Tuning' }}
      theme={{
        colors: {
          elevation1: '#111713',
          elevation2: '#17201B',
          elevation3: '#0B0F0D',
          accent1: '#2FA67F',
          accent2: '#3dbd91',
          highlight1: '#F4EFE9',
          highlight2: '#E8EDE8',
          highlight3: '#9AA8A0',
        },
      }}
    />
  );
}

export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loadFrames5to8, setLoadFrames5to8] = useState<boolean>(false);
  const [tuning, setTuning] = useState<TuningState>(DEFAULT_TUNING);
  const [manualFrame, setManualFrame] = useState<string>('auto');

  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const frames5to8Ready = useRef<boolean>(false);

  // Responsive, Reduced-Motion and Mount detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMounted(true);

    // Support direct frame inspection via ?frame=hero-04 or ?frame=04
    const urlParams = new URLSearchParams(window.location.search);
    const requestedFrame = urlParams.get('frame');
    if (requestedFrame) {
      const normalized = requestedFrame.startsWith('hero-')
        ? requestedFrame
        : `hero-${requestedFrame.padStart(2, '0')}`;
      if (ALL_FRAMES.includes(normalized as any)) {
        setManualFrame(normalized);
        setLoadFrames5to8(true);
      }
    }

    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mqMotion.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqMotion.addEventListener('change', handleMotionChange);

    const mqMobile = window.matchMedia('(max-width: 767px)');
    setIsMobile(mqMobile.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mqMobile.addEventListener('change', handleMobileChange);

    // Requirement 4: Load frames 05 to 08 afterwards when browser is idle (desktop only)
    if (!mqMobile.matches) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          setLoadFrames5to8(true);
        });
      } else {
        const timer = setTimeout(() => {
          setLoadFrames5to8(true);
        }, 1200);
        return () => {
          clearTimeout(timer);
          mqMotion.removeEventListener('change', handleMotionChange);
          mqMobile.removeEventListener('change', handleMobileChange);
        };
      }
    }

    return () => {
      mqMotion.removeEventListener('change', handleMotionChange);
      mqMobile.removeEventListener('change', handleMobileChange);
    };
  }, []);

  // Preload and verify frames 05-08 when loadFrames5to8 is activated
  useEffect(() => {
    if (!loadFrames5to8 || typeof window === 'undefined') return;

    const framesToPreload = ['hero-05', 'hero-06', 'hero-07', 'hero-08'];
    let loadedCount = 0;

    framesToPreload.forEach((f) => {
      const img = new Image();
      img.src = `/images/hero/${f}-1672.webp`;
      img.onload = () => {
        loadedCount += 1;
        if (loadedCount >= framesToPreload.length) {
          frames5to8Ready.current = true;
          if (masterTimelineRef.current && masterTimelineRef.current.paused() && isPlaying) {
            masterTimelineRef.current.play();
          }
        }
      };
      img.onerror = () => {
        loadedCount += 1;
        if (loadedCount >= framesToPreload.length) {
          frames5to8Ready.current = true;
          if (masterTimelineRef.current && masterTimelineRef.current.paused() && isPlaying) {
            masterTimelineRef.current.play();
          }
        }
      };
    });
  }, [loadFrames5to8, isPlaying]);

  // Motion hygiene: IntersectionObserver and visibilitychange
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!masterTimelineRef.current) return;
          if (!entry.isIntersecting) {
            masterTimelineRef.current.pause();
          } else if (isPlaying && manualFrame === 'auto') {
            masterTimelineRef.current.play();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    const handleVisibilityChange = () => {
      if (!masterTimelineRef.current) return;
      if (document.hidden) {
        masterTimelineRef.current.pause();
      } else if (isPlaying && manualFrame === 'auto') {
        masterTimelineRef.current.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, manualFrame]);

  // Handle manual frame tuning inspection override
  useEffect(() => {
    if (manualFrame !== 'auto') {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.pause();
      }
      ALL_FRAMES.forEach((frame) => {
        const el = document.getElementById(`hero-frame-wrap-${frame}`);
        if (el) {
          el.style.opacity = frame === manualFrame ? '1' : '0';
          el.style.zIndex = frame === manualFrame ? '10' : '1';
        }
      });
    } else {
      if (masterTimelineRef.current && isPlaying) {
        masterTimelineRef.current.play();
      }
    }
  }, [manualFrame, isPlaying]);

  // Build Master GSAP Timeline
  useGSAP(
    () => {
      if (typeof window === 'undefined' || !isMounted || reducedMotion || manualFrame !== 'auto') {
        return;
      }

      // Cleanup prior timeline if exists
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
        masterTimelineRef.current = null;
      }

      // PHONE MODE (Requirement 8): loop 01 to 04 only, forward and then back
      if (isMobile) {
        const phoneSequence = ['hero-01', 'hero-02', 'hero-03', 'hero-04', 'hero-03', 'hero-02'];
        
        // Initial setup
        ALL_FRAMES.forEach((f) => {
          const wrap = document.getElementById(`hero-frame-wrap-${f}`);
          const scaleInner = document.getElementById(`hero-frame-inner-${f}`);
          if (wrap) gsap.set(wrap, { opacity: f === 'hero-01' ? 1 : 0, zIndex: f === 'hero-01' ? 2 : 1 });
          if (scaleInner) gsap.set(scaleInner, { scale: 1.0 });
        });

        const tl = gsap.timeline({
          repeat: -1,
          defaults: { ease: 'power1.inOut' },
        });

        for (let i = 0; i < phoneSequence.length; i++) {
          const currentFrame = phoneSequence[i];
          const nextIndex = (i + 1) % phoneSequence.length;
          const nextFrame = phoneSequence[nextIndex];
          const hold = HOLD_TIMES[currentFrame] || 1.5;

          const currentInner = `#hero-frame-inner-${currentFrame}`;
          const nextWrap = `#hero-frame-wrap-${nextFrame}`;
          const nextInner = `#hero-frame-inner-${nextFrame}`;

          // Hold time: current frame scales smoothly 1.00 -> 1.05
          tl.to(
            currentInner,
            {
              scale: 1.05,
              duration: hold + DISSOLVE_DURATION,
              ease: 'none',
            },
            '+=0'
          );

          // Prepare next frame
          tl.set(nextWrap, { zIndex: 3 }, `<+${hold}`);
          tl.set(nextInner, { scale: 1.0 }, `<`);

          // Dissolve into next frame over 3.5s
          tl.fromTo(
            nextWrap,
            { opacity: 0 },
            {
              opacity: 1,
              duration: DISSOLVE_DURATION,
              ease: 'power1.inOut',
            },
            `<+${hold}`
          );

          // Reset previous frame once fully covered
          tl.set(`#hero-frame-wrap-${currentFrame}`, { opacity: 0, zIndex: 1 });
          tl.set(currentInner, { scale: 1.0 });
        }

        masterTimelineRef.current = tl;
        if (!isPlaying) tl.pause();
        return;
      }

      // DESKTOP MODE (Requirement 3):
      // 01, 02, 03, 04, 05, 06, 07, 08, back to 01
      const desktopSequence = ALL_FRAMES;

      // Initial state: frame 01 fully visible, others hidden
      desktopSequence.forEach((f) => {
        const wrap = document.getElementById(`hero-frame-wrap-${f}`);
        const scaleInner = document.getElementById(`hero-frame-inner-${f}`);
        if (wrap) {
          gsap.set(wrap, {
            opacity: f === 'hero-01' ? 1 : 0,
            zIndex: f === 'hero-01' ? 2 : 1,
          });
        }
        if (scaleInner) {
          gsap.set(scaleInner, { scale: 1.0 });
        }
      });

      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: 'power1.inOut' },
      });

      for (let i = 0; i < desktopSequence.length; i++) {
        const currentFrame = desktopSequence[i];
        const nextIndex = (i + 1) % desktopSequence.length;
        const nextFrame = desktopSequence[nextIndex];
        const hold = HOLD_TIMES[currentFrame];

        const currentWrap = `#hero-frame-wrap-${currentFrame}`;
        const currentInner = `#hero-frame-inner-${currentFrame}`;
        const nextWrap = `#hero-frame-wrap-${nextFrame}`;
        const nextInner = `#hero-frame-inner-${nextFrame}`;

        // If reaching transition from 04 to 05, verify frames 05-08 readiness (Requirement 4)
        if (currentFrame === 'hero-04') {
          tl.call(() => {
            if (!frames5to8Ready.current) {
              tl.pause();
            }
          });
        }

        // Camera move: frame scales continuously from 1.00 to 1.05 while visible
        tl.to(
          currentInner,
          {
            scale: 1.05,
            duration: hold + DISSOLVE_DURATION,
            ease: 'none',
          },
          '+=0'
        );

        // Position next frame with higher z-index so it fades smoothly over current
        tl.set(nextWrap, { zIndex: 3 }, `<+${hold}`);
        tl.set(nextInner, { scale: 1.0 }, `<`);

        // Dissolve into next frame over 3.5s with ease-in-out
        tl.fromTo(
          nextWrap,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DISSOLVE_DURATION,
            ease: 'power1.inOut',
          },
          `<+${hold}`
        );

        // Once next frame is at 100% opacity, hide current frame and reset its scale
        tl.set(currentWrap, { opacity: 0, zIndex: 1 });
        tl.set(currentInner, { scale: 1.0 });
      }

      masterTimelineRef.current = tl;
      if (!isPlaying) tl.pause();
    },
    { dependencies: [isMounted, isMobile, reducedMotion, manualFrame], scope: containerRef }
  );

  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const nextState = !prev;
      if (masterTimelineRef.current) {
        if (nextState) {
          masterTimelineRef.current.play();
        } else {
          masterTimelineRef.current.pause();
        }
      }
      return nextState;
    });
  };

  // Frames to render:
  // Before mount (SSR): only hero-01 for lightning-fast First Contentful Paint / LCP
  // After mount on mobile: 01 to 04
  // After mount on desktop: 01 to 04 initially, plus 05 to 08 when idle
  const activeFramesToRender = useMemo(() => {
    if (!isMounted) return ['hero-01'] as const;
    if (isMobile) return ALL_FRAMES.slice(0, 4);
    if (!loadFrames5to8) return ALL_FRAMES.slice(0, 4);
    return ALL_FRAMES;
  }, [isMounted, isMobile, loadFrames5to8]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 h-full w-full overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Leva Tuning Panel (Requirement 5: isolated inside Suspense) */}
      <Suspense fallback={null}>
        <TuningPanelInner
          onTuningUpdate={(newTuning) => setTuning((prev) => ({ ...prev, ...newTuning }))}
          onManualFrameChange={setManualFrame}
        />
      </Suspense>

      {/* Frame Stack */}
      {activeFramesToRender.map((frame, index) => {
        const frameTune = tuning[frame] || DEFAULT_TUNING[frame];
        const isReducedMotionTarget = reducedMotion && frame === 'hero-04';
        const isInitialVisible = !reducedMotion && frame === 'hero-01';

        return (
          <div
            key={frame}
            id={`hero-frame-wrap-${frame}`}
            className="absolute inset-0 h-full w-full transition-opacity duration-100 will-change-transform"
            style={{
              opacity: isReducedMotionTarget || isInitialVisible ? 1 : 0,
              zIndex: isReducedMotionTarget || isInitialVisible ? 2 : 1,
              transform: `translate3d(${frameTune.x}px, ${frameTune.y}px, 0) scale(${frameTune.scale})`,
              transformOrigin: 'right center',
            }}
          >
            <div
              id={`hero-frame-inner-${frame}`}
              className="h-full w-full will-change-transform"
              style={{
                transformOrigin: 'right center',
              }}
            >
              <picture>
                {/* Mobile: exactly 800px per Requirement 8 */}
                <source
                  media="(max-width: 767px)"
                  type="image/avif"
                  srcSet={`/images/hero/${frame}-800.avif`}
                />
                <source
                  media="(max-width: 767px)"
                  type="image/webp"
                  srcSet={`/images/hero/${frame}-800.webp`}
                />
                {/* Desktop & Tablet: responsive 1672w, 1200w */}
                <source
                  media="(min-width: 768px)"
                  type="image/avif"
                  srcSet={`/images/hero/${frame}-1672.avif 1672w, /images/hero/${frame}-1200.avif 1200w`}
                  sizes="100vw"
                />
                <source
                  media="(min-width: 768px)"
                  type="image/webp"
                  srcSet={`/images/hero/${frame}-1672.webp 1672w, /images/hero/${frame}-1200.webp 1200w`}
                  sizes="100vw"
                />
                <img
                  src={`/images/hero/${frame}-800.webp`}
                  alt=""
                  loading={frame === 'hero-01' ? 'eager' : 'lazy'}
                  decoding={frame === 'hero-01' ? 'sync' : 'async'}
                  fetchPriority={frame === 'hero-01' ? 'high' : 'auto'}
                  className="h-full w-full object-cover object-right pointer-events-none"
                  style={{
                    backgroundImage: `url(/images/hero/${frame}-blur.webp)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                  }}
                />
              </picture>
            </div>
          </div>
        );
      })}

      {/* Requirement 6: Readability Gradients */}
      {/* 1. Soft canvas gradient across the left 55% (85% opacity at far left) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4] w-full h-full bg-[linear-gradient(to_right,rgba(11,15,13,0.85)_0%,rgba(11,15,13,0.76)_30%,rgba(11,15,13,0.45)_45%,rgba(11,15,13,0)_55%)]"
      />

      {/* 2. Darker gradient behind the stats bar at the bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[4] h-44 sm:h-36 bg-[linear-gradient(to_top,rgba(11,15,13,0.95)_0%,rgba(11,15,13,0.70)_50%,transparent_100%)]"
      />

      {/* Requirement 7: Motion hygiene Pause/Play toggle button at bottom right */}
      {!reducedMotion && (
        <div className="absolute bottom-[80px] sm:bottom-[70px] right-4 sm:right-6 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause background loop animation' : 'Play background loop animation'}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)]/80 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-dim)] backdrop-blur-sm transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] cursor-pointer"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default HeroBackground;
