'use client';

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Sylva Living-World & Knowledge Arch Three.js Scene                         */
/* -------------------------------------------------------------------------- */

const WAVE_WIDTH = 48;
const WAVE_DEPTH = 32;
const WAVE_Y = -2.25;
const WAVE_NEAR_Z = 5.2;
const SEGMENTS_DESKTOP = { x: 96, y: 54 } as const;
const SEGMENTS_MOBILE = { x: 42, y: 24 } as const;

const MAX_PIXEL_RATIO_DESKTOP = 1.75;
const MAX_PIXEL_RATIO_MOBILE = 1.25;

const CAMERA_POSITION = [0, 3.0, 11] as const;
const CAMERA_TARGET = [0, 1.2, 0] as const;

const SHIELD_NDC_DESKTOP = { x: 0.22, y: -0.05 } as const;
const SHIELD_NDC_PORTRAIT = { x: 0.0, y: 0.1 } as const;
const SHIELD_Z = -3.8;
const SHIELD_OUTER_RADIUS = 1.75;

// Sylva organic sage, moss-emerald, and warm ivory-gold highlight palette
const COLOR_SAGE_DEEP = 0x1a261e;
const COLOR_MOSS_MID = 0x3d6b4c;
const COLOR_CANOPY_LIGHT = 0x86efac;

const WAVE_VERTEX = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseStrength;

varying vec2 vUv;
varying float vHeight;
varying float vGlow;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float terrain(vec2 p, float t) {
  float h = 0.0;
  // Sculpted Sylva arch silhouette: crests at left-center, valley at mid, high arch on right
  float archProfile = exp(-pow((p.x - 4.2) * 0.16, 2.0)) * 1.45
                    + exp(-pow((p.x + 5.5) * 0.18, 2.0)) * 0.85;
  h += archProfile;
  h += sin(p.x * 0.26 + t * 0.38) * 0.48;
  h += sin(p.y * 0.36 - t * 0.30 + p.x * 0.09) * 0.42;
  float ridged = 1.0 - abs(vnoise(p * 0.18 + vec2(t * 0.045, -t * 0.035)) * 2.0 - 1.0);
  h += ridged * ridged * 1.05;
  h += vnoise(p * 0.50 - vec2(t * 0.06)) * 0.28;
  return h;
}

void main() {
  vUv = uv;
  vec2 p = position.xy;

  float h = terrain(p, uTime);

  vec2 d = p - uMouse;
  float r2 = dot(d, d);
  float swell = exp(-r2 * 0.045) * uMouseStrength;
  float ripple = sin(sqrt(r2) * 2.0 - uTime * 2.0) * exp(-r2 * 0.03) * uMouseStrength;

  float calm = mix(1.0, 0.50, uv.y);
  float lift = (h * 0.88 + swell * 1.05 + ripple * 0.24) * calm;

  vHeight = clamp((h + 0.4) / 3.1 + swell * 0.25, 0.0, 1.0);
  vGlow = swell;

  vec3 pos = position;
  pos.z += lift;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const WAVE_FRAGMENT = /* glsl */ `
uniform vec3 uSlate;
uniform vec3 uBlue;
uniform vec3 uEmerald;
uniform vec2 uGrid;
uniform float uOpacity;

varying vec2 vUv;
varying float vHeight;
varying float vGlow;

void main() {
  vec2 g = vUv * uGrid;
  vec2 gw = fwidth(g);
  vec2 gd = abs(fract(g - 0.5) - 0.5) / max(gw, vec2(0.0001));
  float grid = 1.0 - clamp(min(gd.x, gd.y), 0.0, 1.0);
  grid *= 1.0 - smoothstep(0.30, 0.65, max(gw.x, gw.y));

  float ch = vHeight * 11.0;
  float cw = fwidth(ch);
  float cd = abs(fract(ch - 0.5) - 0.5) / max(cw, 0.0001);
  float contour = 1.0 - clamp(cd, 0.0, 1.0);
  contour *= 1.0 - smoothstep(0.35, 0.80, cw);

  float h = clamp(vHeight, 0.0, 1.0);
  float ridge = smoothstep(0.62, 0.94, h);

  vec3 col = mix(uSlate * 1.8, uBlue, smoothstep(0.15, 0.58, h));
  col = mix(col, uEmerald, smoothstep(0.62, 0.92, h));
  col = mix(col, vec3(0.92, 0.97, 0.88), vGlow * 0.28);

  float lines = max(grid * 0.42, contour * (0.55 + 0.45 * ridge));
  float intensity = 0.42 + 0.88 * h + vGlow * 0.55;
  float body = 0.035 + 0.085 * h;

  float fade = smoothstep(0.0, 0.10, vUv.x) * (1.0 - smoothstep(0.90, 1.0, vUv.x));
  fade *= smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.52, 0.98, vUv.y));

  float alpha = (lines * intensity + body) * fade * uOpacity;
  gl_FragColor = vec4(col * (1.0 + ridge * 0.55), clamp(alpha, 0.0, 1.0));
}
`;

/** Sylva drifting luminous pollen/knowledge motes shader (adapted from `the code on the site.rtf`) */
const MOTES_VERTEX = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uScale;

varying float vAlpha;

void main() {
  float phase = aSeed.x;
  float speed = aSeed.y;
  float sway = aSeed.z;
  float size = aSeed.w;

  vec3 p = position;
  p.x += sin(uTime * speed * 0.35 + phase) * 0.65 * sway;
  float climb = mod(uTime * 0.28 * speed + phase * 2.0, 9.0) - 4.5;
  p.y += climb;
  p.z += cos(uTime * speed * 0.28 + phase) * 0.45 * sway;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = size * (uScale / max(-mv.z, 1.0));

  float edge = 1.0 - abs(climb) / 4.5;
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + speed * 1.4) + phase * 3.1);
  vAlpha = clamp(edge * 2.4, 0.0, 1.0) * twinkle;

  gl_Position = projectionMatrix * mv;
}
`;

const MOTES_FRAGMENT = /* glsl */ `
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv) * 2.0;
  float softCircle = pow(clamp(1.0 - d, 0.0, 1.0), 1.8);
  vec3 col = vec3(0.92, 0.96, 0.88);
  gl_FragColor = vec4(col, softCircle * vAlpha * 0.48);
}
`;

export function DotMatrixBackground({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const lowPower = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
        const segments = lowPower ? SEGMENTS_MOBILE : SEGMENTS_DESKTOP;

        const renderer = new THREE.WebGLRenderer({
          antialias: !lowPower,
          alpha: true,
          depth: false,
          stencil: false,
          powerPreference: lowPower ? "default" : "high-performance",
        });
        const maxRatio = lowPower ? MAX_PIXEL_RATIO_MOBILE : MAX_PIXEL_RATIO_DESKTOP;
        let pixelRatio = Math.min(window.devicePixelRatio || 1, maxRatio);
        renderer.setPixelRatio(pixelRatio);
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(...CAMERA_POSITION);
        camera.lookAt(...CAMERA_TARGET);

        const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);

        /* ---------------------------- Topographic Arch Wave ---------------------------- */

        const waveGeometry = new THREE.PlaneGeometry(WAVE_WIDTH, WAVE_DEPTH, segments.x, segments.y);
        const uniforms = {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uMouseStrength: { value: 0 },
          uGrid: { value: new THREE.Vector2(segments.x, segments.y) },
          uOpacity: { value: lowPower ? 0.85 : 0.95 },
          uSlate: { value: srgb(COLOR_SAGE_DEEP) },
          uBlue: { value: srgb(COLOR_MOSS_MID) },
          uEmerald: { value: srgb(COLOR_CANOPY_LIGHT) },
        };
        const waveMaterial = new THREE.ShaderMaterial({
          vertexShader: WAVE_VERTEX,
          fragmentShader: WAVE_FRAGMENT,
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = -Math.PI / 2;
        wave.position.set(0, WAVE_Y, WAVE_NEAR_Z - WAVE_DEPTH / 2);
        wave.frustumCulled = false;
        wave.renderOrder = 1;
        scene.add(wave);

        /* ------------------------- Sylva Drifting Knowledge Motes ------------------------- */

        const moteCount = lowPower ? 180 : 420;
        const motePositions = new Float32Array(moteCount * 3);
        const moteSeeds = new Float32Array(moteCount * 4);
        for (let i = 0; i < moteCount; i++) {
          motePositions[i * 3] = (Math.random() - 0.5) * 28;
          motePositions[i * 3 + 1] = (Math.random() - 0.3) * 10;
          motePositions[i * 3 + 2] = -8 + Math.random() * 14;
          moteSeeds[i * 4] = Math.random() * Math.PI * 2;
          moteSeeds[i * 4 + 1] = 0.25 + Math.random() * 0.85;
          moteSeeds[i * 4 + 2] = 0.4 + Math.random() * 1.2;
          moteSeeds[i * 4 + 3] = 2.0 + 4.5 * Math.pow(Math.random(), 2.1);
        }
        const moteGeometry = new THREE.BufferGeometry();
        moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
        moteGeometry.setAttribute("aSeed", new THREE.BufferAttribute(moteSeeds, 4));
        const moteUniforms = {
          uTime: uniforms.uTime,
          uScale: { value: 24.0 },
        };
        const moteMaterial = new THREE.ShaderMaterial({
          vertexShader: MOTES_VERTEX,
          fragmentShader: MOTES_FRAGMENT,
          uniforms: moteUniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const motes = new THREE.Points(moteGeometry, moteMaterial);
        motes.frustumCulled = false;
        motes.renderOrder = 2;
        scene.add(motes);

        /* ------------------------------ Organic Orbital Rings ------------------------------- */

        const disposables: Array<{ dispose: () => void }> = [moteGeometry, moteMaterial];
        const keep = <T extends { dispose: () => void }>(item: T) => {
          disposables.push(item);
          return item;
        };
        const glow = (color: number, opacity: number, wireframe = false) =>
          keep(
            new THREE.MeshBasicMaterial({
              color,
              wireframe,
              transparent: true,
              opacity,
              depthTest: false,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );
        const glowLine = (color: number, opacity: number) =>
          keep(
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity,
              depthTest: false,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );

        const shield = new THREE.Group();
        shield.rotation.set(1.08, -0.28, 0.18);

        const ring1 = new THREE.Mesh(
          keep(new THREE.TorusGeometry(1.0, 0.01, 6, 96)),
          glow(COLOR_MOSS_MID, 0.45)
        );

        const ticks: number[] = [];
        const tickCount = 72;
        for (let i = 0; i < tickCount; i++) {
          const a = (i / tickCount) * Math.PI * 2;
          const long = i % 6 === 0;
          const r0 = 1.24;
          const r1 = long ? 1.36 : 1.29;
          ticks.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0);
        }
        const tickGeometry = keep(new THREE.BufferGeometry());
        tickGeometry.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
        const ring2 = new THREE.LineSegments(tickGeometry, glowLine(COLOR_CANOPY_LIGHT, 0.35));

        const ring3 = new THREE.Group();
        const arcGeometry = keep(
          new THREE.TorusGeometry(SHIELD_OUTER_RADIUS, 0.014, 6, 48, Math.PI / 2.2)
        );
        const arcMaterial = glow(COLOR_MOSS_MID, 0.35);
        for (let i = 0; i < 3; i++) {
          const arc = new THREE.Mesh(arcGeometry, arcMaterial);
          arc.rotation.z = (i * Math.PI * 2) / 3;
          ring3.add(arc);
        }

        const core = new THREE.Mesh(
          keep(new THREE.IcosahedronGeometry(0.28, 1)),
          glow(COLOR_CANOPY_LIGHT, 0.45, true)
        );

        shield.add(ring1, ring2, ring3, core);
        shield.traverse((object) => {
          object.renderOrder = 0;
        });
        scene.add(shield);

        /* -------------------------------- Layout -------------------------------- */

        const tmp = new THREE.Vector3();
        const dir = new THREE.Vector3();

        const placeShield = () => {
          const portrait = camera.aspect < 0.8;
          const ndc = portrait ? SHIELD_NDC_PORTRAIT : SHIELD_NDC_DESKTOP;
          tmp.set(ndc.x, ndc.y, 0.5).unproject(camera);
          dir.copy(tmp).sub(camera.position).normalize();
          const t = (SHIELD_Z - camera.position.z) / dir.z;
          shield.position.copy(camera.position).addScaledVector(dir, t);

          const distance = Math.abs(camera.position.z - SHIELD_Z);
          const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
          const visibleWidth = visibleHeight * camera.aspect;
          const targetRadius = Math.min(
            visibleHeight * (portrait ? 0.14 : 0.18),
            visibleWidth * 0.28
          );
          shield.scale.setScalar(targetRadius / SHIELD_OUTER_RADIUS);
        };

        const resize = () => {
          const { clientWidth: w, clientHeight: h } = host;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.fov = camera.aspect < 0.8 ? 62 : camera.aspect < 1.2 ? 56 : 50;
          camera.position.set(...CAMERA_POSITION);
          camera.lookAt(...CAMERA_TARGET);
          camera.updateProjectionMatrix();
          camera.updateMatrixWorld();
          moteUniforms.uScale.value = Math.max(18, (h * pixelRatio) / 36);
          placeShield();
        };
        resize();

        /* -------------------------------- Pointer -------------------------------- */

        const pointerTarget = { x: 0, y: 0 };
        const pointerSmooth = { x: 0, y: -0.35 };
        let lastPointerAt = -Infinity;
        let rect = host.getBoundingClientRect();
        let rectDirty = false;
        let strength = 0;

        const onPointerMove = (event: PointerEvent) => {
          if (rectDirty) {
            rect = host.getBoundingClientRect();
            rectDirty = false;
          }
          if (!rect.width || !rect.height) return;
          pointerTarget.x = THREE.MathUtils.clamp(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -1.2,
            1.2
          );
          pointerTarget.y = THREE.MathUtils.clamp(
            -(((event.clientY - rect.top) / rect.height) * 2 - 1),
            -1.2,
            1.2
          );
          lastPointerAt = performance.now();
        };
        const markRectDirty = () => {
          rectDirty = true;
        };
        if (!reducedMotion) {
          window.addEventListener("pointermove", onPointerMove, { passive: true });
          window.addEventListener("scroll", markRectDirty, { passive: true });
        }

        const updateMouseUniform = () => {
          const ny = Math.min(pointerSmooth.y, 0.3);
          tmp.set(pointerSmooth.x, ny, 0.5).unproject(camera);
          dir.copy(tmp).sub(camera.position).normalize();
          if (dir.y > -0.01) return;
          const t = (WAVE_Y - camera.position.y) / dir.y;
          const hitX = camera.position.x + dir.x * t;
          const hitZ = camera.position.z + dir.z * t;
          uniforms.uMouse.value.set(hitX - wave.position.x, -(hitZ - wave.position.z));
        };

        /* ------------------------------ Render loop ------------------------------ */

        const draw = (time: number, dt: number) => {
          uniforms.uTime.value = time;

          const active = performance.now() - lastPointerAt < 2500;
          const tx = active ? pointerTarget.x : Math.sin(time * 0.2) * 0.45;
          const ty = active ? pointerTarget.y : -0.35 + Math.cos(time * 0.15) * 0.22;
          const follow = dt > 0 ? 1 - Math.exp(-dt * 4.2) : 1;
          pointerSmooth.x += (tx - pointerSmooth.x) * follow;
          pointerSmooth.y += (ty - pointerSmooth.y) * follow;
          strength += ((reducedMotion ? 0 : active ? 1 : 0.55) - strength) * follow;
          uniforms.uMouseStrength.value = strength;

          camera.position.x = CAMERA_POSITION[0] + pointerSmooth.x * 0.55;
          camera.position.y = CAMERA_POSITION[1] + pointerSmooth.y * 0.18;
          camera.lookAt(...CAMERA_TARGET);
          camera.updateMatrixWorld();
          updateMouseUniform();

          ring1.rotation.z = time * 0.22;
          ring2.rotation.z = -time * 0.16;
          ring3.rotation.z = time * 0.09;
          core.rotation.y = time * 0.4;
          core.rotation.x = time * 0.25;
          core.scale.setScalar(1 + Math.sin(time * 1.4) * 0.06);
          shield.rotation.x = 1.08 + pointerSmooth.y * 0.05;
          shield.rotation.y = -0.28 + pointerSmooth.x * 0.08;

          renderer.render(scene, camera);
        };

        let raf = 0;
        let visible = true;
        let pageVisible = !document.hidden;
        let contextLost = false;
        let elapsed = 3;
        let last = 0;
        let slowFrames = 0;
        let frames = 0;

        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
          last = now;
          elapsed += dt;
          draw(elapsed, dt);

          if (dt > 0) {
            frames++;
            if (dt > 1 / 40) slowFrames++;
            if (frames >= 90) {
              if (slowFrames > 30 && pixelRatio > 0.8) {
                pixelRatio = Math.max(0.75, pixelRatio - 0.25);
                renderer.setPixelRatio(pixelRatio);
                resize();
              }
              frames = 0;
              slowFrames = 0;
            }
          }
        };
        const start = () => {
          if (!raf && visible && pageVisible && !reducedMotion && !contextLost) {
            last = 0;
            raf = requestAnimationFrame(loop);
          }
        };
        const stop = () => {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        };

        draw(elapsed, 0);

        const resizeObserver = new ResizeObserver(() => {
          rectDirty = true;
          resize();
          if (reducedMotion || !raf) draw(elapsed, 0);
        });
        resizeObserver.observe(host);

        const intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        });
        intersectionObserver.observe(host);

        const onVisibility = () => {
          pageVisible = !document.hidden;
          if (pageVisible) start();
          else stop();
        };
        document.addEventListener("visibilitychange", onVisibility);

        const onContextLost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          stop();
        };
        const onContextRestored = () => {
          contextLost = false;
          resize();
          draw(elapsed, 0);
          start();
        };
        canvas.addEventListener("webglcontextlost", onContextLost);
        canvas.addEventListener("webglcontextrestored", onContextRestored);

        start();

        teardown = () => {
          stop();
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("scroll", markRectDirty);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          canvas.removeEventListener("webglcontextrestored", onContextRestored);
          scene.remove(wave, shield, motes);
          waveGeometry.dispose();
          waveMaterial.dispose();
          disposables.forEach((item) => item.dispose());
          renderer.dispose();
          renderer.forceContextLoss();
          if (canvas.parentNode === host) host.removeChild(canvas);
        };
      } catch {
        // Fallback when WebGL is unavailable
      }
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        "[mask-image:linear-gradient(to_bottom,#000_0%,#000_82%,transparent_100%)]",
        className
      )}
    />
  );
}

export default DotMatrixBackground;
