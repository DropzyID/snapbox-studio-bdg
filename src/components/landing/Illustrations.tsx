import { useEffect, useRef, useState, type ReactNode } from "react";

export type SceneTheme = "y2k" | "vintage" | "minimal";

const BG: Record<SceneTheme, string> = {
  y2k: "backdrop-y2k",
  vintage: "backdrop-vintage",
  minimal: "backdrop-minimal",
};

function Star({ x, y, s, delay }: { x: number; y: number; s: number; delay: string }) {
  return (
    <path
      className="sb-twinkle"
      style={{ animationDelay: delay, transformOrigin: `${x}px ${y}px` }}
      d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}Z`}
      fill="white"
    />
  );
}

function People({ tone }: { tone: string }) {
  return (
    <g fill={tone}>
      {/* left person, waving */}
      <circle cx="44" cy="84" r="9" />
      <path d="M30 150 C30 112 34 98 44 98 C54 98 58 112 58 150Z" />
      <path d="M36 104 L24 84" stroke={tone} strokeWidth="6" strokeLinecap="round" />
      {/* right person, peace sign */}
      <circle cx="78" cy="88" r="8.5" />
      <path d="M64 150 C64 115 68 101 78 101 C88 101 92 115 92 150Z" />
      <path d="M87 106 L96 90" stroke={tone} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M95 91 L94 83 M97 91 L100 84" stroke={tone} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** Illustrated photobox scene. Props animate when an ancestor with `.group` is hovered. */
export function ThemeScene({ theme, className = "" }: { theme: SceneTheme; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${BG[theme]} ${className}`}>
      {theme === "vintage" && <div aria-hidden className="sb-grain sb-grain-shift absolute -inset-4" />}
      <svg
        aria-hidden
        viewBox="0 0 120 150"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {theme === "y2k" && (
          <>
            <Star x={18} y={22} s={6} delay="0s" />
            <Star x={100} y={30} s={8} delay="0.4s" />
            <Star x={86} y={62} s={4} delay="0.8s" />
            <Star x={24} y={58} s={3.5} delay="1.1s" />
            <circle cx="98" cy="118" r="10" fill="white" opacity="0.35" />
            <circle cx="95" cy="115" r="3" fill="white" opacity="0.9" />
            {/* butterfly clip */}
            <g className="sb-twinkle-soft" style={{ animationDelay: "0.2s", transformOrigin: "60px 22px" }}>
              <path d="M60 22 C52 10 40 14 46 24 C40 30 52 34 60 24Z" fill="white" opacity="0.9" />
              <path d="M60 22 C68 10 80 14 74 24 C80 30 68 34 60 24Z" fill="white" opacity="0.9" />
              <rect x="59" y="16" width="2" height="12" rx="1" fill="var(--foreground)" opacity="0.6" />
            </g>
            <rect x="0" y="138" width="120" height="12" fill="white" opacity="0.18" />
            <People tone="oklch(0.228 0.038 282.9 / 0.78)" />
          </>
        )}
        {theme === "vintage" && (
          <>
            <rect x="0" y="136" width="120" height="14" fill="oklch(0.42 0.07 50 / 0.45)" />
            {/* polaroid prop on wall */}
            <g transform="rotate(-8 24 30)">
              <rect x="12" y="16" width="24" height="28" rx="1.5" fill="oklch(0.97 0.02 85)" />
              <rect x="15" y="19" width="18" height="17" fill="oklch(0.62 0.1 55)" />
            </g>
            {/* plant */}
            <g>
              <path d="M104 136 L98 118 L112 118 Z" fill="oklch(0.5 0.09 45)" />
              <path d="M105 118 C96 104 94 96 100 90 C104 100 106 108 105 118Z" fill="oklch(0.5 0.1 140)" />
              <path d="M105 118 C112 104 116 98 114 90 C108 98 105 108 105 118Z" fill="oklch(0.56 0.1 140)" />
              <path d="M105 118 C102 108 104 98 106 94 C108 102 107 110 105 118Z" fill="oklch(0.45 0.09 140)" />
            </g>
            <People tone="oklch(0.3 0.05 40 / 0.72)" />
          </>
        )}
        {theme === "minimal" && (
          <>
            <path
              className="sb-arch"
              d="M26 138 L26 62 A34 34 0 0 1 94 62 L94 138"
              fill="none"
              stroke="oklch(0.55 0.04 60 / 0.55)"
              strokeWidth="1.4"
            />
            <rect x="0" y="138" width="120" height="12" fill="oklch(0.88 0.02 70 / 0.6)" />
            <People tone="oklch(0.228 0.038 282.9 / 0.55)" />
          </>
        )}
      </svg>
    </div>
  );
}

/** Adds `is-in` once the element scrolls into view. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`sb-reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

const iconProps = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-8 w-8",
};

export function StepIcon({ kind }: { kind: 0 | 1 | 2 }) {
  if (kind === 0)
    return (
      <svg {...iconProps}>
        <path d="M6 8 H30" />
        <path d="M8 8 C8 20 12 28 16 34 M16 8 C16 20 18 28 20 34" />
        <path d="M28 8 C28 20 24 28 22 34" />
        <path d="M33 26 C33 20 38 17 42 19 C46 21 45 26 42 27 C40 28 41 31 43 32 C42 37 35 38 33 34 C32 32 33 29 33 26Z" />
        <circle cx="38" cy="23" r="1" fill="currentColor" />
        <circle cx="36" cy="30" r="1" fill="currentColor" />
      </svg>
    );
  if (kind === 1)
    return (
      <svg {...iconProps}>
        <rect x="15" y="10" width="18" height="30" rx="5" />
        <circle cx="24" cy="21" r="4.5" />
        <path d="M21 32 H27" />
        <path d="M11 8 C8 11 8 15 11 18 M37 8 C40 11 40 15 37 18" />
      </svg>
    );
  return (
    <svg {...iconProps}>
      <rect x="16" y="4" width="16" height="40" rx="2" />
      <rect x="19" y="8" width="10" height="8" rx="1" />
      <rect x="19" y="20" width="10" height="8" rx="1" />
      <rect x="19" y="32" width="10" height="8" rx="1" />
    </svg>
  );
}

/** Printer that feeds out a mini photo strip when scrolled into view. */
export function PhotoPrinter() {
  return (
    <Reveal className="sb-printer mx-auto mt-8 flex w-40 flex-col items-center" >
      <div className="relative z-10 flex h-10 w-40 items-center justify-center rounded-2xl border border-border bg-card shadow-pop-sm">
        <span className="h-1.5 w-28 rounded-full bg-foreground/80" />
        <span className="absolute top-2 right-3 h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
      <div className="-mt-1 h-36 w-24 overflow-hidden" aria-hidden>
        <div className="sb-strip flex flex-col gap-1.5 rounded-b-md border border-border bg-card p-1.5">
          <ThemeScene theme="y2k" className="h-9 rounded-sm" />
          <ThemeScene theme="vintage" className="h-9 rounded-sm" />
          <ThemeScene theme="minimal" className="h-9 rounded-sm" />
          <p className="text-center font-display text-[7px] font-bold tracking-widest">SNAPBOX</p>
        </div>
      </div>
    </Reveal>
  );
}

/** Very subtle floating shapes behind the hero headline. */
export function HeroDecor() {
  const items = [
    { c: "top-[12%] left-[8%] text-primary", d: "0s", t: "star" },
    { c: "top-[20%] right-[10%] text-secondary", d: "1.5s", t: "circle" },
    { c: "top-[48%] left-[4%] text-secondary", d: "3s", t: "sparkle" },
    { c: "top-[40%] right-[5%] text-primary", d: "2s", t: "sparkle" },
    { c: "top-[6%] left-[46%] text-secondary", d: "4s", t: "circle" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {items.map((it, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`sb-drift absolute h-5 w-5 opacity-25 sm:h-7 sm:w-7 ${it.c}`}
          style={{ animationDelay: it.d }}
        >
          {it.t === "circle" ? (
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
          ) : it.t === "star" ? (
            <path d="M12 2 L14.5 9 L22 9.5 L16 14 L18 21.5 L12 17 L6 21.5 L8 14 L2 9.5 L9.5 9Z" fill="currentColor" />
          ) : (
            <path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1Z" fill="currentColor" />
          )}
        </svg>
      ))}
    </div>
  );
}
