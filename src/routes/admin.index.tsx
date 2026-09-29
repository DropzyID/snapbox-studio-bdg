import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Ban, Camera, Check, LogOut, RefreshCw, Trash2, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRANCH_NAMES } from "@/components/SimpleShell";
import { rupiahFmt } from "@/lib/packages";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    const { data: isOwner } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "owner" });
    if (!isOwner) throw redirect({ to: "/admin/login" });
  },
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Snapbox Studio" },
      { name: "description", content: "Today's schedule, revenue, and studio settings for Snapbox Studio owners." },
      { property: "og:title", content: "Owner Dashboard — Snapbox Studio" },
      { property: "og:description", content: "Owner-only dashboard for Snapbox Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TZ = "Asia/Jakarta";
const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const PKG_NAMES: Record<string, string> = { solo: "Solo", duo: "Duo", group: "Group" };

type DayBooking = {
  id: string;
  booking_code: string;
  branch_id: string;
  package_id: string;
  customer_name: string;
  whatsapp: string;
  people_count: number;
  slot_start: string;
  slot_end: string;
  status: string;
  deposit_status: string;
  recovered_via_waitlist: boolean;
};
type Stats = {
  today_revenue: number;
  week_revenue: number;
  no_show: number;
  attended: number;
  recovered_count: number;
  recovered_revenue: number;
  hours: { hour: number; count: number }[];
};

const card = "rounded-3xl border border-border bg-card p-5 shadow-pop-sm sm:p-6";

function AdminPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, s] = await Promise.all([
      supabase.rpc("admin_day_bookings", { _day: todayKey() }),
      supabase.rpc("admin_stats"),
    ]);
    setBookings((b.data as DayBooking[] | null) ?? []);
    setStats((s.data as unknown as Stats | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  const setStatus = async (id: string, status: "completed" | "no_show") => {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
    await supabase.rpc("admin_set_booking_status", { _id: id, _status: status });
    void load();
  };

  const noShowRate = stats && stats.attended > 0 ? Math.round((stats.no_show / stats.attended) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Camera className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold sm:text-lg">
              Snapbox<span className="text-primary">.</span> <span className="text-muted-foreground">Owner</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} aria-label="Refresh" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card">
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </button>
            <button onClick={signOut} className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Good day, owner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Stat label="Today's revenue" value={rupiahFmt(stats?.today_revenue ?? 0)} />
          <Stat label="This week" value={rupiahFmt(stats?.week_revenue ?? 0)} />
          <Stat label="No-show rate" value={`${noShowRate}%`} sub={`${stats?.no_show ?? 0} of ${stats?.attended ?? 0} · 30 days`} />
          <Stat
            label="Slots recovered by waitlist"
            value={String(stats?.recovered_count ?? 0)}
            sub={`≈ ${rupiahFmt(stats?.recovered_revenue ?? 0)} recovered`}
            accent
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {(["dago", "buahbatu"] as const).map((br) => (
            <BranchTimeline key={br} branch={br} bookings={bookings.filter((b) => b.branch_id === br)} onStatus={setStatus} loading={loading} />
          ))}
        </section>

        <HoursChart hours={stats?.hours ?? []} />

        <section className="grid gap-6 lg:grid-cols-2">
          <BlockSlots />
          <PriceEditor />
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string | undefined; accent?: boolean | undefined }) {
  return (
    <div className={accent ? "rounded-3xl bg-secondary p-4 text-secondary-foreground shadow-pop-sm sm:p-5" : "rounded-3xl border border-border bg-card p-4 shadow-pop-sm sm:p-5"}>
      <p className={accent ? "text-xs font-semibold opacity-85" : "text-xs font-semibold text-muted-foreground"}>{label}</p>
      <p className="mt-2 font-display text-lg font-bold sm:text-2xl">{value}</p>
      {sub && <p className={accent ? "mt-1 text-xs opacity-85" : "mt-1 text-xs text-muted-foreground"}>{sub}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-secondary/15 text-secondary",
  completed: "bg-foreground text-background",
  no_show: "bg-accent text-primary",
};
const STATUS_LABEL: Record<string, string> = { pending: "Awaiting deposit", confirmed: "Confirmed", completed: "Completed", no_show: "No-show" };

function BranchTimeline({
  branch,
  bookings,
  onStatus,
  loading,
}: {
  branch: string;
  bookings: DayBooking[];
  onStatus: (id: string, s: "completed" | "no_show") => void;
  loading: boolean;
}) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{BRANCH_NAMES[branch]}</h2>
        <span className="text-xs font-semibold text-muted-foreground">{bookings.length} today</span>
      </div>
      {bookings.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
          {loading ? "Loading…" : "No sessions booked today."}
        </p>
      ) : (
        <ol className="mt-4 space-y-3 border-l-2 border-dashed border-border pl-4">
          {bookings.map((b) => (
            <li key={b.id} className="relative rounded-2xl border border-border bg-background p-3.5">
              <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-card bg-primary" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold">
                    {fmtTime(b.slot_start)}–{fmtTime(b.slot_end)}
                  </p>
                  <p className="truncate font-semibold">{b.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {PKG_NAMES[b.package_id] ?? b.package_id} · {b.people_count} {b.people_count === 1 ? "person" : "people"} · {b.booking_code}
                    {b.recovered_via_waitlist && " · via waitlist"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[b.status] ?? ""}`}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </div>
              {(b.status === "confirmed" || b.status === "pending") && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => onStatus(b.id, "completed")} className="flex items-center justify-center gap-1.5 rounded-full bg-foreground px-3 py-2 text-xs font-bold text-background">
                    <Check className="h-3.5 w-3.5" /> Completed
                  </button>
                  <button onClick={() => onStatus(b.id, "no_show")} className="flex items-center justify-center gap-1.5 rounded-full border border-primary px-3 py-2 text-xs font-bold text-primary">
                    <UserX className="h-3.5 w-3.5" /> No-show
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function HoursChart({ hours }: { hours: { hour: number; count: number }[] }) {
  const range = Array.from({ length: 11 }, (_, i) => 10 + i);
  const counts = range.map((h) => hours.find((x) => x.hour === h)?.count ?? 0);
  const max = Math.max(1, ...counts);
  const peak = counts.indexOf(Math.max(...counts));
  return (
    <section className={card}>
      <h2 className="font-display text-lg font-bold">Busiest hours</h2>
      <p className="text-xs text-muted-foreground">Sessions by start hour · last 30 days + upcoming</p>
      <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-3">
        {range.map((h, i) => (
          <div key={h} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">{counts[i] || ""}</span>
            <div
              className={i === peak && (counts[i] ?? 0) > 0 ? "w-full rounded-t-lg bg-primary" : "w-full rounded-t-lg bg-secondary/70"}
              style={{ height: `${Math.max(4, ((counts[i] ?? 0) / max) * 100)}%` }}
            />
            <span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">{h}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

type Block = { id: string; branch_id: string; starts_at: string; ends_at: string; reason: string };
const TIMES = Array.from({ length: 23 }, (_, i) => {
  const m = 10 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

function BlockSlots() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [branch, setBranch] = useState("dago");
  const [date, setDate] = useState(todayKey());
  const [allDay, setAllDay] = useState(true);
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("12:00");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("blocked_slots")
      .select("id, branch_id, starts_at, ends_at, reason")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at");
    setBlocks(data ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const start = allDay ? "00:00" : from;
    const end = allDay ? "23:59" : to;
    if (!date) return setMsg("Please pick a date.");
    if (end <= start) return setMsg("The end time needs to be after the start time.");
    setBusy(true);
    const { error } = await supabase.from("blocked_slots").insert({
      branch_id: branch,
      starts_at: `${date}T${start}:00+07:00`,
      ends_at: `${date}T${end}:00+07:00`,
      reason: reason.trim().slice(0, 80),
    });
    setBusy(false);
    if (error) return setMsg("Couldn't save the block. Please try again.");
    setReason("");
    setMsg("Blocked. Those slots are now unavailable on the booking page.");
    void load();
  };

  const remove = async (id: string) => {
    setBlocks((b) => b.filter((x) => x.id !== id));
    await supabase.from("blocked_slots").delete().eq("id", id);
  };

  const field = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-primary";

  return (
    <div className={card}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Ban className="h-5 w-5 text-primary" /> Block slots
      </h2>
      <p className="text-xs text-muted-foreground">For maintenance or holidays. Existing bookings are not cancelled.</p>
      <form onSubmit={add} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Branch
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className={field}>
              <option value="dago">Dago</option>
              <option value="buahbatu">Buah Batu</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Date
            <input type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Whole day
        </label>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">
              From
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={field}>
                {TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Until
              <select value={to} onChange={(e) => setTo(e.target.value)} className={field}>
                {[...TIMES.slice(1), "21:00"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>
        )}
        <label className="block text-sm font-semibold">
          Reason (optional)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Camera maintenance" className={field} />
        </label>
        {msg && <p className="rounded-xl bg-accent px-3 py-2 text-sm font-medium">{msg}</p>}
        <button disabled={busy} className="w-full rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-pop-sm disabled:opacity-60">
          {busy ? "Saving…" : "Block these slots"}
        </button>
      </form>
      {blocks.length > 0 && (
        <ul className="mt-5 space-y-2">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  {BRANCH_NAMES[b.branch_id]} · {fmtDateTime(b.starts_at)} – {fmtTime(b.ends_at)}
                </p>
                {b.reason && <p className="truncate text-xs text-muted-foreground">{b.reason}</p>}
              </div>
              <button onClick={() => void remove(b.id)} aria-label="Remove block" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-primary">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PriceEditor() {
  const [pkgs, setPkgs] = useState<{ id: string; name: string; price: number; duration_minutes: number }[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("packages")
      .select("id, name, price, duration_minutes")
      .order("price")
      .then(({ data }) => {
        setPkgs(data ?? []);
        setDraft(Object.fromEntries((data ?? []).map((p) => [p.id, String(p.price)])));
      });
  }, []);

  const save = async (id: string) => {
    setErr(null);
    setSaved(null);
    const price = Number((draft[id] ?? "").replace(/\D/g, ""));
    if (!price || price < 1000 || price > 10_000_000) return setErr("Please enter a price between Rp 1.000 and Rp 10.000.000.");
    const { error } = await supabase.from("packages").update({ price }).eq("id", id);
    if (error) return setErr("Couldn't save the price. Please try again.");
    setPkgs((list) => list.map((p) => (p.id === id ? { ...p, price } : p)));
    setSaved(id);
  };

  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Package prices</h2>
      <p className="text-xs text-muted-foreground">Changes show right away on the home page and booking page. Existing bookings keep their price.</p>
      <div className="mt-4 space-y-3">
        {pkgs.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-background p-3.5">
            <div className="flex items-baseline justify-between">
              <p className="font-display font-bold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.duration_minutes} min · now {rupiahFmt(p.price)}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary">
                <span className="text-sm text-muted-foreground">Rp</span>
                <input
                  inputMode="numeric"
                  value={draft[p.id] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value.replace(/\D/g, "") }))}
                  className="w-full min-w-0 bg-transparent px-2 py-2.5 text-base outline-none"
                />
              </div>
              <button onClick={() => void save(p.id)} className="rounded-full bg-secondary px-5 text-sm font-bold text-secondary-foreground">
                {saved === p.id ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        ))}
        {err && <p className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-primary">{err}</p>}
      </div>
    </div>
  );
}
