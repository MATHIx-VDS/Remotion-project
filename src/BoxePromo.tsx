import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import {
  AMBER,
  EdgeLeds,
  LedTransition,
  ORANGE,
  TransitionKind,
  WHITE,
  lightsOnBrightness,
  neonOn,
} from "./led";

const ANTON = "Anton";
const MARKER = "Permanent Marker";
const ARCHIVO = "Archivo";
loadFont({ family: ANTON, url: staticFile("fonts/Anton.woff2"), weight: "400" });
loadFont({ family: MARKER, url: staticFile("fonts/PermanentMarker.woff2"), weight: "400" });
loadFont({ family: ARCHIVO, url: staticFile("fonts/Archivo-500.woff2"), weight: "500" });
loadFont({ family: ARCHIVO, url: staticFile("fonts/Archivo-700.woff2"), weight: "700" });

const FPS = 30;
const GRADE = "contrast(1.14) saturate(1.22)";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

const BottomShade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, transparent 55%)",
    }}
  />
);

/** Video shot with "lights on" flicker after the cut and a slow push-in. */
const ClipShot: React.FC<{ src: string; startSec: number; zoom?: [number, number] }> = ({
  src,
  startSec,
  zoom = [1.08, 1.16],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = interpolate(frame, [0, durationInFrames], zoom);
  const b = lightsOnBrightness(frame);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        trimBefore={Math.round(startSec * FPS)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${s})`,
          filter: `${GRADE} brightness(${b})`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Still photo with Ken Burns + lights-on flicker. */
const PhotoShot: React.FC<{
  src: string;
  from?: [number, number, number];
  to?: [number, number, number];
}> = ({ src, from = [1.05, 0, 0], to = [1.2, -30, -40] }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.out(Easing.quad),
  });
  const s = from[0] + (to[0] - from[0]) * t;
  const x = from[1] + (to[1] - from[1]) * t;
  const y = from[2] + (to[2] - from[2]) * t;
  const b = lightsOnBrightness(frame);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${s})`,
          filter: `${GRADE} brightness(${b})`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Big slammed word with neon-orange glow. */
const PunchText: React.FC<{
  text: string;
  sub?: string;
  color?: string;
  delay?: number;
  top?: number;
  size?: number;
}> = ({ text, sub, color = WHITE, delay = 3, top = 1280, size = 190 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  if (f < 0) return null;
  const sp = spring({ frame: f, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const scale = interpolate(sp, [0, 1], [1.9, 1]);
  const blur = interpolate(sp, [0, 1], [18, 0]);
  const shake = f < 5 ? (random(`sh-${text}-${f}`) - 0.5) * 22 : 0;
  const neon = neonOn(frame, delay + 2, `pt-${text}`);
  const subIn = interpolate(f, [6, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <div
        style={{
          position: "absolute",
          top,
          left: 40,
          right: 40,
          textAlign: "center",
          fontFamily: ANTON,
          fontSize: size,
          lineHeight: 0.95,
          color,
          letterSpacing: 2,
          textTransform: "uppercase",
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
          textShadow: `0 0 ${10 * neon}px ${ORANGE}, 0 0 ${35 * neon}px ${ORANGE}, 0 0 ${80 * neon}px ${ORANGE}, 0 8px 0 rgba(0,0,0,0.6)`,
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            position: "absolute",
            top: top + size * 0.95 * text.split("\n").length + 30,
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily: ARCHIVO,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: 6,
            color: AMBER,
            textTransform: "uppercase",
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 30}px)`,
            textShadow: "0 3px 12px rgba(0,0,0,0.9)",
          }}
        >
          {sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Small neon tag line in the top area (e.g. "BOXE THAÏ"). */
const NeonTag: React.FC<{ text: string; delay?: number }> = ({ text, delay = 2 }) => {
  const frame = useCurrentFrame();
  const on = neonOn(frame, delay, `tag-${text}`);
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: ANTON,
          fontSize: 64,
          letterSpacing: 8,
          color: WHITE,
          padding: "14px 40px",
          border: `5px solid ${ORANGE}`,
          borderRadius: 18,
          opacity: on,
          background: "rgba(0,0,0,0.35)",
          boxShadow: `0 0 20px ${ORANGE}, 0 0 60px ${ORANGE}, inset 0 0 20px ${ORANGE}`,
          textShadow: `0 0 18px ${ORANGE}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Special scenes                                                      */
/* ------------------------------------------------------------------ */

const Tubes: React.FC<{ startDelay?: number; ys: number[]; seed: string }> = ({
  startDelay = 0,
  ys,
  seed,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {ys.map((y, i) => {
        const on = neonOn(frame, startDelay + i * 5, `${seed}-${i}`);
        const c = i % 2 ? WHITE : ORANGE;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: y,
              height: 18,
              borderRadius: 9,
              background: c,
              opacity: on,
              boxShadow: `0 0 14px ${c}, 0 0 50px ${c}, 0 0 120px ${ORANGE}`,
            }}
          />
        );
      })}
    </>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const logoOn = neonOn(frame, 16, "logo");
  const logoScale = interpolate(frame, [16, 66], [0.92, 1.04]);
  const subOn = interpolate(frame, [34, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgOn = neonOn(frame, 6, "bg");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: 0.45 * bgOn }}>
        <OffthreadVideo
          src={staticFile("clips/clip1.mp4")}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `${GRADE} blur(6px) brightness(0.55)`,
            transform: "scale(1.15)",
          }}
        />
      </AbsoluteFill>
      <Vignette strength={0.95} />
      <Tubes ys={[470, 1390]} seed="intro" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 900,
            opacity: logoOn,
            transform: `scale(${logoScale})`,
            filter: `drop-shadow(0 0 ${18 * logoOn}px ${ORANGE}) drop-shadow(0 0 ${50 * logoOn}px rgba(255,106,26,0.6))`,
          }}
        />
        <div
          style={{
            marginTop: 40,
            fontFamily: ARCHIVO,
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: 14,
            color: WHITE,
            opacity: subOn,
            transform: `translateY(${(1 - subOn) * 20}px)`,
          }}
        >
          BOXE · BOXE THAÏ · MMA
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Journal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const s = interpolate(sp, [0, 1], [1.35, 1]) * interpolate(frame, [0, 96], [1, 1.08]);
  const rot = interpolate(sp, [0, 1], [6, -2.5]);
  const titleOn = neonOn(frame, 8, "journal");
  const b = lightsOnBrightness(frame);
  // highlight sweep over headline
  const hl = interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#0b0705" }}>
      <AbsoluteFill style={{ opacity: 0.35 }}>
        <Img
          src={staticFile("journal.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.5)" }}
        />
      </AbsoluteFill>
      <Tubes ys={[330, 1700]} seed="journal-t" startDelay={2} />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOn,
        }}
      >
        <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 44, letterSpacing: 12, color: AMBER }}>
          ILS PARLENT DE NOUS
        </div>
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 120,
            color: WHITE,
            textShadow: `0 0 20px ${ORANGE}, 0 0 60px ${ORANGE}`,
          }}
        >
          LA MONTAGNE
        </div>
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: 160 }}>
        <div
          style={{
            position: "relative",
            width: 980,
            transform: `scale(${s}) rotate(${rot}deg)`,
            boxShadow: `0 0 0 6px ${ORANGE}, 0 0 50px ${ORANGE}, 0 30px 80px rgba(0,0,0,0.8)`,
            filter: `brightness(${b})`,
          }}
        >
          <Img src={staticFile("journal.jpg")} style={{ width: "100%", display: "block" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "7.5%",
              height: "15.5%",
              width: `${hl * 81}%`,
              background: "rgba(255,150,40,0.33)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ShopCard: React.FC<{ src: string; delay: number; x: number }> = ({ src, delay, x }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 140 } });
  const on = neonOn(frame, delay + 4, `card-${src}`);
  const floatY = Math.sin((frame + delay * 3) / 14) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 600,
        width: 470,
        transform: `translateY(${interpolate(sp, [0, 1], [900, 0]) + floatY}px) rotate(${interpolate(sp, [0, 1], [x < 500 ? -10 : 10, x < 500 ? -2 : 2])}deg)`,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: `0 0 0 5px rgba(255,106,26,${on}), 0 0 ${45 * on}px ${ORANGE}, 0 30px 60px rgba(0,0,0,0.7)`,
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

const Shop: React.FC = () => {
  const frame = useCurrentFrame();
  const t1 = neonOn(frame, 2, "shop1");
  const t2 = neonOn(frame, 8, "shop2");
  const infoIn = interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b0705" }}>
      <AbsoluteFill style={{ opacity: 0.4 }}>
        <OffthreadVideo
          src={staticFile("clips/clip2.mp4")}
          trimBefore={4 * FPS}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: `${GRADE} blur(10px) brightness(0.45)` }}
        />
      </AbsoluteFill>
      <Vignette strength={0.9} />
      <div style={{ position: "absolute", top: 150, left: 60, right: 60 }}>
        <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 40, letterSpacing: 12, color: ORANGE, opacity: t1 }}>
          E-SHOP OFFICIEL
        </div>
        <div style={{ fontFamily: ANTON, fontSize: 108, lineHeight: 1, color: WHITE, opacity: t1, marginTop: 10, whiteSpace: "nowrap" }}>
          PORTE LES COULEURS
        </div>
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 130,
            lineHeight: 1.05,
            color: "transparent",
            WebkitTextStroke: `4px ${ORANGE}`,
            opacity: t2,
            filter: `drop-shadow(0 0 ${16 * t2}px ${ORANGE})`,
          }}
        >
          DU CLUB.
        </div>
      </div>
      <ShopCard src="shop-hoodie.png" delay={10} x={50} />
      <ShopCard src="shop-tee.png" delay={18} x={560} />
      <div
        style={{
          position: "absolute",
          top: 1430,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: infoIn,
          transform: `translateY(${(1 - infoIn) * 30}px)`,
        }}
      >
        <div style={{ fontFamily: ANTON, fontSize: 64, color: WHITE, letterSpacing: 2 }}>
          SWEATS <span style={{ color: ORANGE }}>35€</span> · TEES <span style={{ color: ORANGE }}>20€</span>
        </div>
        <div style={{ fontFamily: ANTON, fontSize: 52, color: WHITE, marginTop: 6 }}>
          CASQUES & GANTS DÈS <span style={{ color: ORANGE }}>28€</span>
        </div>
        <div style={{ fontFamily: ARCHIVO, fontWeight: 500, fontSize: 34, color: "#d9cfc6", marginTop: 22 }}>
          Paiement sécurisé HelloAsso · Retrait chez Intersport
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoOn = neonOn(frame, 4, "outro-logo");
  const r = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 180 } });
  const t = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 180 } });
  const urlOn = neonOn(frame, 34, "url");
  const addrIn = interpolate(frame, [46, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 0.75 + 0.25 * Math.sin(frame / 4);
  const b = lightsOnBrightness(frame);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: `brightness(${b})` }}>
        <OffthreadVideo
          src={staticFile("clips/clip5.mp4")}
          trimBefore={Math.round(3.3 * FPS)}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `${GRADE} brightness(0.42)`,
            transform: `scale(${interpolate(frame, [0, 120], [1.1, 1.22])})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.6), rgba(60,20,0,0.25) 45%, rgba(0,0,0,0.85))` }} />
      <Tubes ys={[1190, 1730]} seed="outro-t" startDelay={26} />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 560,
            opacity: logoOn,
            filter: `drop-shadow(0 0 ${16 * logoOn}px ${ORANGE})`,
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: MARKER,
            fontSize: 210,
            lineHeight: 1,
            color: WHITE,
            transform: `scale(${interpolate(r, [0, 1], [2.2, 1])}) rotate(-5deg)`,
            opacity: Math.min(1, r * 1.5),
            textShadow: "0 10px 30px rgba(0,0,0,0.8)",
          }}
        >
          REJOINS
        </div>
        <div
          style={{
            fontFamily: MARKER,
            fontSize: 200,
            lineHeight: 1,
            marginTop: 10,
            color: ORANGE,
            transform: `scale(${interpolate(t, [0, 1], [2.2, 1])}) rotate(-5deg)`,
            opacity: Math.min(1, t * 1.5),
            textShadow: `0 0 30px rgba(255,106,26,${0.7 * pulse}), 0 10px 30px rgba(0,0,0,0.8)`,
          }}
        >
          LA TEAM !
        </div>
      </div>
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 700,
            fontSize: 66,
            color: WHITE,
            padding: "26px 60px",
            borderRadius: 80,
            border: `6px solid ${ORANGE}`,
            background: "rgba(0,0,0,0.55)",
            opacity: urlOn,
            boxShadow: `0 0 ${24 * pulse}px ${ORANGE}, 0 0 ${70 * pulse}px ${ORANGE}, inset 0 0 18px ${ORANGE}`,
          }}
        >
          boxe-academie.fr
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1440,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: addrIn,
          fontFamily: ARCHIVO,
          fontWeight: 700,
          fontSize: 40,
          color: WHITE,
          letterSpacing: 2,
          lineHeight: 1.5,
          textShadow: "0 3px 10px #000",
        }}
      >
        39 BIS AVENUE RIBOT
        <br />
        <span style={{ color: AMBER }}>BRIVE-LA-GAILLARDE</span>
        <br />
        <span style={{ fontWeight: 500, fontSize: 34, color: "#d9cfc6" }}>
          Tous niveaux · De la découverte à la compétition
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Scene = {
  dur: number;
  render: () => React.ReactNode;
  edgeLeds?: boolean;
};

const clip = (n: number, startSec: number, zoom?: [number, number]) => () => (
  <ClipShot src={`clips/clip${n}.mp4`} startSec={startSec} zoom={zoom} />
);

const SCENES: Scene[] = [
  { dur: 66, render: () => <Intro /> },
  {
    dur: 54,
    edgeLeds: true,
    render: () => (
      <>
        {clip(5, 3.2)()}
        <BottomShade />
        <PunchText text="DISCIPLINE." />
      </>
    ),
  },
  {
    dur: 45,
    edgeLeds: true,
    render: () => (
      <>
        {clip(4, 0.3, [1.15, 1.3])()}
        <BottomShade />
        <PunchText text="RESPECT." color={ORANGE} />
      </>
    ),
  },
  {
    dur: 45,
    edgeLeds: true,
    render: () => (
      <>
        <PhotoShot src="photo-kick.jpg" from={[1.05, 0, 0]} to={[1.22, 40, 60]} />
        <BottomShade />
        <PunchText text={"DÉPASSEMENT\nDE SOI."} size={150} top={1220} />
      </>
    ),
  },
  {
    dur: 54,
    edgeLeds: true,
    render: () => (
      <>
        {clip(2, 1.0)()}
        <Vignette />
        <NeonTag text="BOXE ANGLAISE" />
      </>
    ),
  },
  {
    dur: 36,
    edgeLeds: true,
    render: () => (
      <>
        <PhotoShot src="photo-punch.jpg" from={[1.25, 30, 0]} to={[1.08, 0, 0]} />
        <Vignette />
        <NeonTag text="BOXE THAÏ" />
      </>
    ),
  },
  {
    dur: 48,
    edgeLeds: true,
    render: () => (
      <>
        {clip(1, 6.2)()}
        <Vignette />
        <NeonTag text="MMA" />
      </>
    ),
  },
  {
    dur: 36,
    edgeLeds: true,
    render: () => (
      <>
        <PhotoShot src="photo-blue.jpg" from={[1.05, 0, 0]} to={[1.25, -60, 20]} />
        <Vignette />
        <NeonTag text="PRÉPA PHYSIQUE" />
      </>
    ),
  },
  {
    dur: 50,
    edgeLeds: true,
    render: () => (
      <>
        {clip(3, 3.5)()}
        <BottomShade />
        <PunchText text="TOUS NIVEAUX" size={170} sub="De la découverte à la compétition" />
      </>
    ),
  },
  {
    dur: 40,
    edgeLeds: true,
    render: () => (
      <>
        <PhotoShot src="photo-wide.jpg" from={[1.2, 0, 0]} to={[1.05, 0, 0]} />
        <BottomShade />
        <PunchText text={"COACHS\nEXPÉRIMENTÉS"} size={135} top={1200} color={ORANGE} />
      </>
    ),
  },
  {
    dur: 42,
    edgeLeds: true,
    render: () => (
      <>
        {clip(6, 0, [1.05, 1.2])()}
        <BottomShade />
        <PunchText text="ESPRIT CLUB." size={170} />
      </>
    ),
  },
  { dur: 96, render: () => <Journal /> },
  { dur: 105, render: () => <Shop /> },
  { dur: 126, render: () => <Outro /> },
];

const TRANSITIONS: TransitionKind[] = [
  "grid",
  "sweep",
  "tubes",
  "strobe",
  "sweepL",
  "frame",
  "grid",
  "sweep",
  "strobe",
  "tubes",
  "grid",
  "frame",
  "sweepL",
];
const TRANSITION_DUR: Record<TransitionKind, number> = {
  grid: 20,
  sweep: 16,
  sweepL: 16,
  tubes: 18,
  strobe: 10,
  frame: 18,
};

const starts: number[] = [];
SCENES.reduce((acc, s) => {
  starts.push(acc);
  return acc + s.dur;
}, 0);
export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.dur, 0);

export const BoxePromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((s, i) => (
        <Sequence key={`s${i}`} from={starts[i]} durationInFrames={s.dur} premountFor={30}>
          {s.render()}
          {s.edgeLeds ? <EdgeLeds /> : null}
        </Sequence>
      ))}
      {starts.slice(1).map((cut, i) => {
        const kind = TRANSITIONS[i % TRANSITIONS.length];
        const d = TRANSITION_DUR[kind];
        return (
          <Sequence key={`t${i}`} from={cut - Math.floor(d / 2)} durationInFrames={d}>
            <LedTransition kind={kind} duration={d} seed={`t${i}`} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
