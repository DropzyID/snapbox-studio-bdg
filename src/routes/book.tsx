import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Camera, Check, MapPin, PartyPopper } from "lucide-react";

const searchSchema = z.object({
  package: z.enum(["solo", "duo", "group"]).optional().catch(undefined),
});

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Book a Session — Snapbox Studio Bandung" },
      {
        name: "description",
        content:
          "Pick your branch, package, backdrop and time slot. Book a self-photo session at Snapbox Studio Dago or Buah Batu in under a minute.",
      },
      { property: "og:title", content: "Book a Session — Snapbox Studio Bandung" },
      {
        property: "og:description",
        content: "Choose branch, package, backdrop and time — book your photobox session in Bandung.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
});

type BranchId = "dago" | "buahbatu";
type PackageId = "solo" | "duo" | "group";
type BackdropId = "y2k" | "vintage" | "minimal";

const BRANCHES: { id: BranchId; name: string; area: string }[] = [
  { id: "dago", name: "Dago", area: "Dago, Bandung" },
  { id: "buahbatu", name: "Buah Batu", area: "Buah Batu, Bandung" },
];

const PACKAGES: { id: PackageId; name: string; price: number; minutes: number; min: number; max: number }[] = [
  { id: "solo", name: "Solo", price: 60000, minutes: 15, min: 1, max: 1 },
  { id: "duo", name: "Duo", price: 100000, minutes: 20, min: 2, max: 2 },
  { id: "group", name: "Group", price: 180000, minutes: 30, min: 3, max: 6 },
];

const BACKDROPS: { id: BackdropId; name: string; cls: string }[] = [
  { id: "y2k", name: "Y2K", cls: "backdrop-y2k" },
  { id: "vintage", name: "Vintage", cls: "backdrop-vintage" },
  { id: "minimal", name: "Minimal", cls: "backdrop-minimal" },
];

const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let m = 10 * 60; m <= 21 * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
})();

const STEPS = ["Branch", "Package", "Schedule", "Details", "Review"];

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Mock availability: deterministic pseudo-random per branch/date/time
function isSlotTaken(branch: BranchId, dateKey: string, time: string) {
  const s = `${branch}|${dateKey}|${time}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100 < 30;
}

function isPast(dateKey: string, time: string, now: Date) {
  if (dateKey !== toKey(now)) return false;
  const [hh = 0, mm = 0] = time.split(":").map(Number);
  return hh * 60 + mm <= now.getHours() * 60 + now.getMinutes();
}

const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell us your name (at least 2 letters).")
    .max(60, "That name is a bit long — keep it under 60 characters."),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v.length > 0, "We need your WhatsApp number to send the confirmation.")
    .refine(
      (v) => /^(\+62|62|0)8\d{7,11}$/.test(v),
      "Hmm, that doesn't look like an Indonesian WhatsApp number. Try 0812xxxxxxx.",
    ),
});

type Errors = { [K in "branch"|"pkg"|"backdrop"|"date"|"time"|"name"|"whatsapp"|"people"]?: string | undefined };

function BookPage() {
  const search = Route.useSearch();
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [pkg, setPkg] = useState<PackageId | null>(search.package ?? null);
  const [backdrop, setBackdrop] = useState<BackdropId | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [people, setPeople] = useState<number>(search.package === "duo" ? 2 : search.package === "group" ? 3 : 1);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmed, setConfirmed] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  const days = useMemo(() => {
    if (!now) return [];
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      return d;
    });
  }, [now]);

  const selectedPkg = PACKAGES.find((p) => p.id === pkg) ?? null;
  const selectedBranch = BRANCHES.find((b) => b.id === branch) ?? null;
  const selectedBackdrop = BACKDROPS.find((b) => b.id === backdrop) ?? null;

  const choosePkg = (id: PackageId) => {
    setPkg(id);
    const p = PACKAGES.find((x) => x.id === id)!;
    setPeople((n) => Math.min(p.max, Math.max(p.min, n)));
    setErrors((e) => ({ ...e, pkg: undefined }));
  };

  const slotDisabled = (t: string) =>
    !branch || !date || !now || isSlotTaken(branch, date, t) || isPast(date, t, now);

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0 && !branch) e.branch = "Pick the branch you'd like to visit.";
    if (s === 1) {
      if (!pkg) e.pkg = "Choose a package to continue.";
      if (!backdrop) e.backdrop = "Pick a backdrop theme — you can't go wrong!";
    }
    if (s === 2) {
      if (!date) e.date = "Pick a date within the next 14 days.";
      if (!time) e.time = "Choose an available time slot.";
      else if (slotDisabled(time)) e.time = "That slot just got taken — pick another one.";
    }
    if (s === 3) {
      const r = detailsSchema.safeParse({ name, whatsapp });
      if (!r.success) for (const issue of r.error.issues) e[issue.path[0] as "name" | "whatsapp"] ??= issue.message;
      if (selectedPkg && (people < selectedPkg.min || people > selectedPkg.max || !Number.isInteger(people))) {
        e.people =
          selectedPkg.min === selectedPkg.max
            ? `${selectedPkg.name} is for exactly ${selectedPkg.min} ${selectedPkg.min === 1 ? "person" : "people"}.`
            : `${selectedPkg.name} fits ${selectedPkg.min}–${selectedPkg.max} people.`;
      }
    }
    return e;
  }

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const back = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };
  const confirm = () => {
    for (let s = 0; s < 4; s++) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dateLabel = (key: string | null) => {
    if (!key) return "—";
    const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  if (confirmed) {
    return (
      <Shell>
        <div className="shadow-pop mx-auto max-w-lg rounded-3xl border-2 border-foreground bg-card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">You're booked, {name.trim().split(" ")[0]}!</h1>
          <p className="mt-3 text-muted-foreground">
            {selectedPkg?.name} · {selectedBackdrop?.name} backdrop at Snapbox {selectedBranch?.name} on{" "}
            {dateLabel(date)}, {time}. We'll send the details to your WhatsApp.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">(Demo only — no real booking was made yet.)</p>
          <Link
            to="/"
            className="shadow-pop mt-6 inline-flex rounded-2xl bg-secondary px-6 py-3 font-bold text-secondary-foreground"
          >
            Back to home
          </Link>
        </div>
      </Shell>
    );
  }

  const cardBase =
    "rounded-2xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40";
  const cardState = (active: boolean) =>
    active
      ? "border-foreground bg-pink-soft shadow-pop-sm -translate-y-0.5"
      : "border-border bg-card hover:border-foreground/40";

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Book your session</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full border-2 border-foreground bg-card">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
            />
          </div>
          <ol className="mt-3 hidden grid-cols-5 gap-2 text-xs font-semibold sm:grid">
            {STEPS.map((s, i) => (
              <li key={s} className={i <= step ? "text-foreground" : "text-muted-foreground"}>
                {i < step ? <Check className="mr-1 inline h-3 w-3 text-primary" /> : `${i + 1}. `}
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-3xl border-2 border-foreground bg-card p-5 shadow-pop sm:p-7">
            {step === 0 && (
              <div>
                <StepTitle>Which branch?</StepTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBranch(b.id);
                        setTime(null);
                        setErrors({});
                      }}
                      className={`${cardBase} ${cardState(branch === b.id)}`}
                    >
                      <MapPin className="h-5 w-5 text-primary" />
                      <div className="mt-2 font-display text-lg font-bold">{b.name}</div>
                      <div className="text-sm text-muted-foreground">{b.area}</div>
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.branch} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-7">
                <div>
                  <StepTitle>Pick a package</StepTitle>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PACKAGES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => choosePkg(p.id)}
                        className={`${cardBase} ${cardState(pkg === p.id)}`}
                      >
                        <div className="font-display text-lg font-bold">{p.name}</div>
                        <div className="mt-1 font-bold text-primary">{rupiah(p.price)}</div>
                        <div className="text-sm text-muted-foreground">
                          {p.minutes} min · {p.min === p.max ? `${p.min} ${p.min === 1 ? "person" : "people"}` : `${p.min}–${p.max} people`}
                        </div>
                      </button>
                    ))}
                  </div>
                  <FieldError msg={errors.pkg} />
                </div>
                <div>
                  <StepTitle>Choose a backdrop</StepTitle>
                  <div className="grid grid-cols-3 gap-3">
                    {BACKDROPS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBackdrop(b.id);
                          setErrors((e) => ({ ...e, backdrop: undefined }));
                        }}
                        className={`${cardBase} ${cardState(backdrop === b.id)} p-2`}
                      >
                        <div className={`${b.cls} aspect-[3/4] rounded-xl`} />
                        <div className="mt-2 text-center font-display text-sm font-bold">{b.name}</div>
                      </button>
                    ))}
                  </div>
                  <FieldError msg={errors.backdrop} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7">
                <div>
                  <StepTitle>Pick a date</StepTitle>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                    {days.map((d) => {
                      const key = toKey(d);
                      const active = date === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setDate(key);
                            setTime(null);
                            setErrors((e) => ({ ...e, date: undefined }));
                          }}
                          className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border-2 py-2.5 transition-all ${
                            active
                              ? "border-foreground bg-primary text-primary-foreground shadow-pop-sm"
                              : "border-border bg-card hover:border-foreground/40"
                          }`}
                        >
                          <span className="text-[11px] font-semibold uppercase opacity-80">
                            {d.toLocaleDateString("en-GB", { weekday: "short" })}
                          </span>
                          <span className="font-display text-xl font-bold">{d.getDate()}</span>
                          <span className="text-[11px] opacity-80">
                            {d.toLocaleDateString("en-GB", { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError msg={errors.date} />
                </div>
                <div>
                  <StepTitle>Pick a time</StepTitle>
                  {!date ? (
                    <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Choose a date first to see open slots.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {TIMES.map((t) => {
                          const disabled = slotDisabled(t);
                          const active = time === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setTime(t);
                                setErrors((e) => ({ ...e, time: undefined }));
                              }}
                              className={`rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                                disabled
                                  ? "cursor-not-allowed border-dashed border-border bg-muted text-muted-foreground/60 line-through"
                                  : active
                                    ? "border-foreground bg-secondary text-secondary-foreground shadow-pop-sm"
                                    : "border-border bg-card hover:border-foreground/40"
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Crossed-out slots are already booked.</p>
                    </>
                  )}
                  <FieldError msg={errors.time} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <StepTitle>Your details</StepTitle>
                <Field label="Name" error={errors.name}>
                  <input
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nadia Putri"
                    className={inputCls(!!errors.name)}
                    autoComplete="name"
                  />
                </Field>
                <Field label="WhatsApp number" error={errors.whatsapp}>
                  <input
                    value={whatsapp}
                    maxLength={20}
                    inputMode="tel"
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812 3456 7890"
                    className={inputCls(!!errors.whatsapp)}
                    autoComplete="tel"
                  />
                </Field>
                <Field
                  label={`Number of people${selectedPkg ? ` (${selectedPkg.min === selectedPkg.max ? selectedPkg.min : `${selectedPkg.min}–${selectedPkg.max}`})` : ""}`}
                  error={errors.people}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPeople((n) => Math.max(1, n - 1))}
                      className="grid h-11 w-11 place-items-center rounded-xl border-2 border-foreground bg-card text-lg font-bold"
                      aria-label="Fewer people"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-display text-2xl font-bold">{people}</span>
                    <button
                      type="button"
                      onClick={() => setPeople((n) => Math.min(10, n + 1))}
                      className="grid h-11 w-11 place-items-center rounded-xl border-2 border-foreground bg-card text-lg font-bold"
                      aria-label="More people"
                    >
                      +
                    </button>
                  </div>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div>
                <StepTitle>Review & confirm</StepTitle>
                <dl className="divide-y-2 divide-dashed divide-border rounded-2xl border-2 border-border">
                  {[
                    ["Branch", selectedBranch?.name, 0],
                    ["Package", selectedPkg && `${selectedPkg.name} · ${selectedPkg.minutes} min`, 1],
                    ["Backdrop", selectedBackdrop?.name, 1],
                    ["Date & time", `${dateLabel(date)} · ${time ?? "—"}`, 2],
                    ["Name", name.trim(), 3],
                    ["WhatsApp", whatsapp.trim(), 3],
                    ["People", String(people), 3],
                  ].map(([k, v, s]) => (
                    <div key={k as string} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="flex items-center gap-3 text-right font-semibold">
                        <span className="break-all">{v || "—"}</span>
                        <button
                          type="button"
                          onClick={() => setStep(s as number)}
                          className="text-xs font-bold text-secondary underline-offset-2 hover:underline"
                        >
                          Edit
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-pink-soft px-4 py-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-xl font-bold text-primary">
                    {selectedPkg ? rupiah(selectedPkg.price) : "—"}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 hidden items-center justify-between gap-3 lg:flex">
              <NavButtons step={step} back={back} next={next} confirm={confirm} />
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <Summary
                branch={selectedBranch?.name}
                pkg={selectedPkg}
                backdrop={selectedBackdrop?.name}
                when={date ? `${dateLabel(date)}${time ? ` · ${time}` : ""}` : undefined}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-background/95 px-4 pb-4 pt-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs text-muted-foreground">
              {[selectedBranch?.name, selectedPkg?.name, selectedBackdrop?.name, time].filter(Boolean).join(" · ") ||
                "Nothing picked yet"}
            </div>
            <div className="font-display text-lg font-bold text-primary">
              {selectedPkg ? rupiah(selectedPkg.price) : "Rp —"}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <NavButtons step={step} back={back} next={next} confirm={confirm} compact />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Camera className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold sm:text-lg">
              Snapbox<span className="text-primary">.</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
        </nav>
      </header>
      <main className="px-4 pb-36 pt-8 sm:px-6 lg:pb-16">{children}</main>
    </div>
  );
}

function NavButtons({
  step,
  back,
  next,
  confirm,
  compact,
}: {
  step: number;
  back: () => void;
  next: () => void;
  confirm: () => void;
  compact?: boolean | undefined;
}) {
  const last = step === STEPS.length - 1;
  return (
    <>
      {step > 0 ? (
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-foreground bg-card px-4 py-3 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          {!compact && "Back"}
        </button>
      ) : (
        !compact && <span />
      )}
      <button
        type="button"
        onClick={last ? confirm : next}
        className={`shadow-pop-sm inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
          last ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {last ? "Confirm booking" : "Next"}
        {last ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </button>
    </>
  );
}

function Summary({
  branch,
  pkg,
  backdrop,
  when,
}: {
  branch?: string | undefined;
  pkg: (typeof PACKAGES)[number] | null;
  backdrop?: string | undefined;
  when?: string | undefined;
}) {
  const rows: [string, string | undefined][] = [
    ["Branch", branch],
    ["Package", pkg ? `${pkg.name} · ${pkg.minutes} min` : undefined],
    ["Backdrop", backdrop],
    ["When", when],
  ];
  return (
    <div className="shadow-pop rounded-3xl border-2 border-foreground bg-card p-5">
      <h2 className="font-display text-lg font-bold">Your session</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-xl font-bold text-primary">{pkg ? rupiah(pkg.price) : "Rp —"}</span>
      </div>
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-display text-lg font-bold sm:text-xl">{children}</h2>;
}

function FieldError({ msg }: { msg?: string | undefined }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
      {msg}
    </p>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      <FieldError msg={error} />
    </label>
  );
}

const inputCls = (err: boolean) =>
  `w-full rounded-xl border-2 bg-background px-4 py-3 text-base outline-none transition-colors focus:border-secondary ${
    err ? "border-destructive" : "border-border"
  }`;
