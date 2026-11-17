import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  Easing,
} from "remotion";

export const ORANGE = "#FF6A1A";
export const AMBER = "#FFB01F";
export const RED = "#FF2A2A";
export const WHITE = "#FFF4EA";

const glow = (c: string, s = 1) =>
  `0 0 ${12 * s}px ${c}, 0 0 ${40 * s}px ${c}, 0 0 ${90 * s}px ${c}`;

/** Flicker like a neon tube turning on. Returns 0..1 */
export const neonOn = (frame: number, start: number, seed: string) => {
  const t = frame - start;
  if (t < 0) return 0;
  if (t > 14) return 1;
  const pattern = [0.9, 0, 0, 1, 0.2, 0, 1, 1, 0.4, 1, 1, 0.7, 1, 1, 1];
  const jitter = random(`${seed}-${t}`) * 0.25;
  return Math.min(1, pattern[t] + jitter * (pattern[t] > 0 ? 1 : 0));
};

/** Brightness multiplier applied to a shot right after a cut ("lights coming on"). */
export const lightsOnBrightness = (frame: number) => {
  const pattern = [0.25, 1.7, 0.35, 1.45, 0.7, 1.25, 1.08, 1.03];
  return frame < pattern.length ? pattern[frame] : 1;
};

/* ---------------------------------------------------------------- */
/* Transition 1: LED panel — a wall of LEDs lights up diagonally,   */
/* fully covers the cut, then switches off in the same direction.   */
/* ---------------------------------------------------------------- */
export const LedGrid: React.FC<{ duration: number; seed: string }> = ({
  duration,
  seed,
}) => {
  const frame = useCurrentFrame();
  const cols = 12;
  const rows = 21;
  const cw = 1080 / cols;
  const ch = 1920 / rows;
  const p = frame / duration; // 0..1
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = (x / cols + (rows - y) / rows) / 2; // 0 bottom-left .. 1 top-right
      const r = random(`${seed}-${x}-${y}`);
      const onAt = d * 0.38 + r * 0.06;
      const offAt = 0.52 + d * 0.38 + r * 0.06;
      let o = 0;
      if (p >= onAt && p < offAt) o = 1;
      // little sparkle on edges
      if (Math.abs(p - onAt) < 0.03 || Math.abs(p - offAt) < 0.03) o = 0.55;
      if (o === 0) continue;
      const col = r > 0.82 ? WHITE : r > 0.55 ? AMBER : ORANGE;
      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x * cw + 4,
            top: y * ch + 4,
            width: cw - 8,
            height: ch - 8,
            borderRadius: 10,
            background: col,
            opacity: o,
            boxShadow: `0 0 18px ${col}, 0 0 40px ${ORANGE}`,
          }}
        />,
      );
    }
  }
  // dark gaps between leds while the wall is lit
  const coverage = interpolate(p, [0.3, 0.45, 0.55, 0.7], [0, 0.85, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#050302", opacity: coverage }} />
      {cells}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- */
/* Transition 2: LED sweep — slanted neon bars race across the      */
/* frame with a white flash on the cut.                             */
/* ---------------------------------------------------------------- */
export const LedSweep: React.FC<{
  duration: number;
  seed: string;
  direction?: 1 | -1;
}> = ({ duration, seed, direction = 1 }) => {
  const frame = useCurrentFrame();
  const mid = duration / 2;
  const bars = [
    { w: 140, c: ORANGE, off: 0 },
    { w: 40, c: WHITE, off: 0.08 },
    { w: 90, c: RED, off: 0.14 },
    { w: 24, c: AMBER, off: 0.2 },
    { w: 200, c: ORANGE, off: 0.26 },
    { w: 30, c: WHITE, off: 0.33 },
  ];
  const flash = interpolate(frame, [mid - 2, mid, mid + 3], [0, 0.95, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `rotate(${direction * -14}deg) scale(1.6)`,
        }}
      >
        {bars.map((b, i) => {
          const t = interpolate(
            frame,
            [0 + b.off * duration, duration * (0.7 + b.off)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.quad),
            },
          );
          const x =
            direction === 1
              ? interpolate(t, [0, 1], [-400, 1500])
              : interpolate(t, [0, 1], [1500, -400]);
          const flick = 0.75 + random(`${seed}-${i}-${frame}`) * 0.25;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - b.w / 2,
                top: -400,
                width: b.w,
                height: 2800,
                background: b.c,
                opacity: t > 0 && t < 1 ? flick : 0,
                boxShadow: glow(b.c, 1.4),
                borderRadius: b.w / 2,
              }}
            />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, #fff 0%, ${AMBER} 40%, ${ORANGE} 75%)`,
          opacity: flash,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- */
/* Transition 3: Ceiling tubes — blackout, then horizontal LED      */
/* tubes flicker on from top to bottom like gym lights.             */
/* ---------------------------------------------------------------- */
export const LedTubes: React.FC<{ duration: number; seed: string }> = ({
  duration,
  seed,
}) => {
  const frame = useCurrentFrame();
  const mid = Math.floor(duration / 2);
  const black = interpolate(
    frame,
    [0, mid - 1, mid + 1, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const tubes = 7;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#030202", opacity: black }} />
      {new Array(tubes).fill(0).map((_, i) => {
        const on = neonOn(frame, i * 1.2, `${seed}-${i}`);
        const off = interpolate(frame, [duration - 5 + i * 0.4, duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const c = i % 3 === 1 ? WHITE : i % 3 === 2 ? AMBER : ORANGE;
        const y = 150 + i * 270;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: y,
              height: 26,
              borderRadius: 13,
              background: c,
              opacity: on * off,
              boxShadow: glow(c, 1.5),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- */
/* Transition 4: Strobe — club-style colour strobes on the cut.     */
/* ---------------------------------------------------------------- */
export const LedStrobe: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const seq = ["#000", WHITE, "#000", ORANGE, "#000", WHITE, RED, "#000", ORANGE];
  const idx = Math.floor(interpolate(frame, [0, duration], [0, seq.length], {
    extrapolateRight: "clamp",
  }));
  const c = seq[Math.min(idx, seq.length - 1)];
  const fade = interpolate(frame, [duration - 3, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: c,
        opacity: (c === "#000" ? 0.9 : 0.85) * fade,
        mixBlendMode: c === "#000" ? "normal" : "screen",
      }}
    />
  );
};

/* ---------------------------------------------------------------- */
/* Transition 5: Neon frame — a neon tube draws around the screen,  */
/* closes, and bursts into light.                                   */
/* ---------------------------------------------------------------- */
export const NeonFrame: React.FC<{ duration: number; seed: string }> = ({
  duration,
  seed,
}) => {
  const frame = useCurrentFrame();
  const inset = 36;
  const w = 1080 - inset * 2;
  const h = 1920 - inset * 2;
  const perim = 2 * (w + h);
  const draw = interpolate(frame, [0, duration * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(frame, [duration * 0.6, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mid = duration / 2;
  const burst = interpolate(frame, [mid - 1, mid + 1, mid + 5], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flick = 0.8 + random(`${seed}-${frame}`) * 0.2;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <filter id={`g-${seed}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[ORANGE, WHITE].map((c, i) => (
          <rect
            key={c}
            x={inset + i * 14}
            y={inset + i * 14}
            width={w - i * 28}
            height={h - i * 28}
            rx={40}
            fill="none"
            stroke={c}
            strokeWidth={i === 0 ? 14 : 5}
            strokeDasharray={perim}
            strokeDashoffset={perim * (1 - draw) * (i === 0 ? 1 : -1)}
            filter={`url(#g-${seed})`}
            opacity={fade * flick}
          />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${WHITE} 0%, ${ORANGE} 55%, transparent 80%)`,
          opacity: burst,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export type TransitionKind = "grid" | "sweep" | "sweepL" | "tubes" | "strobe" | "frame";

export const LedTransition: React.FC<{ kind: TransitionKind; duration: number; seed: string }> = ({
  kind,
  duration,
  seed,
}) => {
  switch (kind) {
    case "grid":
      return <LedGrid duration={duration} seed={seed} />;
    case "sweep":
      return <LedSweep duration={duration} seed={seed} />;
    case "sweepL":
      return <LedSweep duration={duration} seed={seed} direction={-1} />;
    case "tubes":
      return <LedTubes duration={duration} seed={seed} />;
    case "strobe":
      return <LedStrobe duration={duration} />;
    case "frame":
      return <NeonFrame duration={duration} seed={seed} />;
  }
};

/* ---------------------------------------------------------------- */
/* Persistent LED strips on the left/right edges, pulsing on beat.  */
/* ---------------------------------------------------------------- */
export const EdgeLeds: React.FC<{ beat?: number }> = ({ beat = 15 }) => {
  const frame = useCurrentFrame();
  const k = frame % beat;
  const pulse = 0.35 + 0.65 * Math.exp(-k / 4);
  const hueShift = Math.floor(frame / (beat * 2)) % 3;
  const c = [ORANGE, RED, AMBER][hueShift];
  const bar = (side: "left" | "right") => (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 8,
        background: `linear-gradient(to bottom, transparent, ${c} 15%, ${c} 85%, transparent)`,
        opacity: pulse,
        boxShadow: glow(c, 0.8),
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {bar("left")}
      {bar("right")}
    </AbsoluteFill>
  );
};
