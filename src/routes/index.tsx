import { rupiahFmt, usePackagePrices } from "@/lib/packages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Instagram, MapPin, Menu, MessageCircle, Sparkles, X } from "lucide-react";
import { STUDIO_WHATSAPP } from "@/lib/booking-actions";
import { useState } from "react";
import { HeroDecor, PhotoPrinter, Reveal, StepIcon, ThemeScene } from "@/components/landing/Illustrations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Snapbox Studio — Book a Self-Photo Session in Bandung",
      },
      {
        name: "description",
        content:
          "Your moment. Your frame. Booked in 30 seconds. Self-photo studio sessions with Y2K, Vintage and Minimal backdrops at our Dago & Buah Batu branches, Bandung.",
      },
      {
        property: "og:title",
        content: "Snapbox Studio — Book a Self-Photo Session in Bandung",
      },
      {
        property: "og:description",
        content:
          "Your moment. Your frame. Booked in 30 seconds. Photobox sessions from Rp 60.000 in Dago & Buah Batu, Bandung.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

function BookButton({
  label = "Book a session",
  variant = "primary",
  pkg,
}: {
  label?: string;
  variant?: "primary" | "secondary";
  pkg?: "solo" | "duo" | "group";
}) {
  return (
    <Link
      to="/book"
      search={pkg ? { package: pkg } : {}}
      className={
        variant === "secondary"
          ? "shadow-pop inline-flex items-center gap-2 rounded-2xl bg-secondary px-6 py-3.5 text-sm font-bold tracking-wide text-secondary-foreground transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-pop-sm active:translate-y-0.5 active:shadow-none sm:text-base"
          : "shadow-pop inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-pop-sm active:translate-y-0.5 active:shadow-none sm:text-base"
      }
    >
      <Camera className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function DemoBanner() {
  return (
    <div role="note" className="bg-foreground px-4 py-2 text-center text-xs font-medium text-background sm:text-sm">
      <span className="mr-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary-foreground uppercase">
        Demo mode
      </span>
      Portfolio demo: payments and WhatsApp are simulated.{" "}
      <Link to="/admin/login" className="font-bold underline underline-offset-4 hover:text-primary-foreground">
        Try the owner dashboard →
      </Link>
    </div>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 sm:flex sm:justify-between sm:px-6">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" aria-hidden />
          </span>
          <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
            Snapbox<span className="text-primary">.</span>
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-6">
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <button onClick={() => scrollTo("how-it-works")} className="transition-colors hover:text-foreground">
              How it works
            </button>
            <button onClick={() => scrollTo("backdrops")} className="transition-colors hover:text-foreground">
              Backdrops
            </button>
            <button onClick={() => scrollTo("pricing")} className="transition-colors hover:text-foreground">
              Pricing
            </button>
            <Link to="/manage" className="transition-colors hover:text-foreground">
              Manage booking
            </Link>
          </div>
          <Link
            to="/book"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Book
          </Link>
        </div>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </nav>
      {menuOpen && (
        <div className="border-t border-border/70 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
            <button
              onClick={() => {
                closeMenu();
                scrollTo("how-it-works");
              }}
              className="rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent hover:text-foreground"
            >
              How it works
            </button>
            <button
              onClick={() => {
                closeMenu();
                scrollTo("backdrops");
              }}
              className="rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent hover:text-foreground"
            >
              Backdrops
            </button>
            <button
              onClick={() => {
                closeMenu();
                scrollTo("pricing");
              }}
              className="rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent hover:text-foreground"
            >
              Pricing
            </button>
            <Link
              to="/manage"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2.5 transition-colors hover:bg-accent hover:text-foreground"
            >
              Manage booking
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft background blobs */}
      <div
        aria-hidden
        className="hero-blob-pink pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
      />
      <div
        aria-hidden
        className="hero-blob-blue pointer-events-none absolute top-40 -left-28 h-80 w-80 rounded-full opacity-25 blur-3xl"
      />
      <HeroDecor />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-secondary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Photobox · Bandung
        </span>

        <h1 className="max-w-3xl font-display text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.15] lg:text-6xl">
          Your moment. Your frame.{" "}
          <span className="text-primary">Booked in 30 seconds.</span>
        </h1>

        <svg
          aria-hidden
          viewBox="0 0 300 12"
          className="mt-2 h-3 w-52 text-primary sm:w-72"
          preserveAspectRatio="none"
        >
          <path
            d="M2 9C60 3 150 2 298 7"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A self-photo studio where you control the shutter. Pick a backdrop, grab your
          crew, and walk out with printed strips — no photographer needed.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2.5">
          <BookButton />
          <p className="text-xs text-muted-foreground sm:text-sm">
            Free reschedule up to 2 hours before your session.
          </p>
        </div>

        {/* illustrated polaroid collage */}
        <div className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-6">
          {([
            ["y2k", "sb-bob-1", "rotate-[-6deg]", ""],
            ["vintage", "sb-bob-2", "rotate-[3deg]", "sm:translate-y-4"],
            ["minimal", "sb-bob-3", "rotate-[7deg]", ""],
          ] as const).map(([theme, bob, rot, off]) => (
            <div key={theme} className={off}>
              <div className={bob}>
                <div className={`${rot} group rounded-2xl border border-border bg-card p-2 shadow-pop-sm transition-transform duration-300 hover:rotate-0 hover:scale-105 sm:p-3`}>
                  <ThemeScene theme={theme} className="aspect-[3/4] w-full rounded-xl" />
                  <div className="mt-1.5 h-2 sm:mt-2 sm:h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    title: "Pick your backdrop",
    text: "Choose from Y2K, Vintage or Minimal when you book — the set is ready when you arrive.",
  },
  {
    n: "02",
    title: "Strike your poses",
    text: "Step in with your crew, use the remote shutter, and take as many frames as your session allows.",
  },
  {
    n: "03",
    title: "Print your strips",
    text: "Pick your favorite frames on the touchscreen and collect your printed photo strips on the spot.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-primary">How it works</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-4xl">
          Three steps to your strip
        </h2>
      </div>

      <ol className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6">
        {steps.map((step, i) => (
          <Reveal
            as="li"
            key={step.n}
            delay={i * 120}
            className="rounded-3xl border border-border bg-card p-6 shadow-pop-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <StepIcon kind={i as 0 | 1 | 2} />
              </span>
              <span className="font-display text-sm font-bold text-muted-foreground">{step.n}</span>
            </div>
            <h3 className="mt-5 font-display text-lg font-bold sm:text-xl">{step.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {step.text}
            </p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

const backdrops = [
  {
    name: "Y2K",
    tagline: "Chrome, bubblegum & dial-up dreams",
    theme: "y2k" as const,
  },
  {
    name: "Vintage",
    tagline: "Faded film, warm & nostalgic",
    theme: "vintage" as const,
  },
  {
    name: "Minimal",
    tagline: "Clean lines, soft light, all you",
    theme: "minimal" as const,
  },
];

function Backdrops() {
  return (
    <section id="backdrops" className="w-full scroll-mt-20 bg-accent py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 text-center sm:items-center">
          <p className="text-xs font-bold tracking-widest uppercase text-secondary">Backdrops</p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
            Pick a vibe for your set
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every backdrop is styled by our team. Not sure which one? You can switch
            between sessions.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6">
          {backdrops.map((b) => (
            <article
              key={b.name}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-pop-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <ThemeScene theme={b.theme} className="aspect-[4/5] w-full" />
              <div className="flex-1 p-5 sm:p-6">
                <h3 className="font-display text-lg font-bold sm:text-xl">{b.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.tagline}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    id: "solo",
    name: "Solo",
    price: "Rp 60.000",
    duration: "15 min",
    group: "1 person",
    features: ["1 backdrop of your choice", "Printed photo strips", "Props & remote shutter"],
    featured: false,
  },
  {
    id: "duo",
    name: "Duo",
    price: "Rp 100.000",
    duration: "20 min",
    group: "Up to 2 people",
    features: ["1 backdrop of your choice", "Printed photo strips", "Props & remote shutter", "Digital copies via QR"],
    featured: true,
  },
  {
    id: "group",
    name: "Group",
    price: "Rp 180.000",
    duration: "30 min",
    group: "Up to 6 people",
    features: ["1 backdrop of your choice", "Printed photo strips", "Props & remote shutter", "Digital copies via QR"],
    featured: false,
  },
];

function Pricing() {
  const livePrices = usePackagePrices();
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-8 pt-16 sm:px-6 sm:pb-10 sm:pt-24">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-primary">Pricing</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-4xl">
          Simple rates, no surprises
        </h2>
      </div>

      <PhotoPrinter />

      <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6 sm:items-stretch">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={
              plan.featured
                ? "relative flex flex-col rounded-3xl bg-primary p-6 text-primary-foreground shadow-pop sm:p-8 sm:-translate-y-2"
                : "relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-pop-sm sm:p-8"
            }
          >
            {plan.featured && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-1 text-xs font-bold tracking-widest uppercase text-background">
                Most popular
              </span>
            )}
            <h3 className="font-display text-lg font-bold sm:text-xl">{plan.name}</h3>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold sm:text-3xl">{livePrices[plan.id] ? rupiahFmt(livePrices[plan.id] ?? 0) : plan.price}</span>
                <span className={plan.featured ? "text-sm opacity-80" : "text-sm text-muted-foreground"}>
                  / {plan.duration}
                </span>
              </div>
              <p className={plan.featured ? "mt-1 text-xs font-semibold opacity-80" : "mt-1 text-xs font-semibold text-muted-foreground"}>
                {plan.group}
              </p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className={
                      plan.featured
                        ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-foreground"
                        : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                    }
                  />
                  <span className={plan.featured ? "opacity-95" : "text-muted-foreground"}>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <BookButton
                label={`Book ${plan.name}`}
                variant={plan.featured ? "secondary" : "primary"}
                pkg={plan.name.toLowerCase() as "solo" | "duo" | "group"}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const branches = [
  { name: "Dago", area: "Dago, Bandung (demo location)" },
  { name: "Buah Batu", area: "Buah Batu, Bandung (demo location)" },
];

const quickLinks = [
  { label: "How it works", href: "how-it-works" },
  { label: "Backdrops", href: "backdrops" },
  { label: "Pricing", href: "pricing" },
];

function Footer() {
  return (
    <footer className="w-full bg-foreground text-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12">
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                Snapbox<span className="text-primary">.</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-70">
              Self-photo studio in Bandung. Your moment, your frame — booked in 30 seconds.
            </p>
            <div className="mt-5">
              <p className="text-xs font-bold tracking-widest uppercase opacity-60">Contact</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <a
                  href={`https://wa.me/${STUDIO_WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-background/20 px-3.5 py-2 text-xs font-bold opacity-80 transition-colors hover:border-primary/60 hover:text-primary hover:opacity-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  Chat on WhatsApp
                </a>
                <a
                  href="https://instagram.com/snapbox.studio"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-background/20 px-3.5 py-2 text-xs font-bold opacity-80 transition-colors hover:border-primary/60 hover:text-primary hover:opacity-100"
                >
                  <Instagram className="h-3.5 w-3.5" aria-hidden />
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60">Quick links</p>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <button
                    type="button"
                    onClick={() => scrollTo(l.href)}
                    className="text-sm opacity-80 underline-offset-4 transition-colors hover:text-primary hover:underline hover:opacity-100"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/book"
                  className="text-sm font-bold opacity-80 underline-offset-4 transition-colors hover:text-primary hover:underline hover:opacity-100"
                >
                  Book a session
                </Link>
              </li>
              <li>
                <Link
                  to="/manage"
                  className="text-sm opacity-80 underline-offset-4 transition-colors hover:text-primary hover:underline hover:opacity-100"
                >
                  Manage booking
                </Link>
              </li>
            </ul>
          </div>

          {/* Branches */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60">Our branches</p>
            <ul className="mt-4 space-y-3">
              {branches.map((b) => (
                <li key={b.name} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{b.name}</p>
                    <p className="text-xs opacity-70">{b.area}</p>
                    <p className="mt-0.5 text-xs opacity-70">Open daily 10:00–21:00</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-background/15 pt-6 text-xs opacity-70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} Snapbox Studio Bandung. All rights reserved.
            <span aria-hidden className="mx-2 opacity-50">
              ·
            </span>
            Fictional business created for a portfolio demo.
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/waitlist-demo"
              className="text-[11px] underline decoration-background/30 underline-offset-2 transition-colors hover:decoration-primary hover:text-primary"
            >
              Demo tools
            </Link>
            <Link
              to="/admin/login"
              className="text-[11px] underline decoration-background/30 underline-offset-2 transition-colors hover:decoration-primary hover:text-primary"
            >
              Owner dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <DemoBanner />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Backdrops />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
