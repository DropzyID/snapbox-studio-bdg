import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, CalendarClock, Search, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatWibDate, formatWibTime } from "@/lib/booking-actions";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "Manage Your Booking — Snapbox Studio Bandung" },
      { name: "description", content: "Find your Snapbox Studio booking with your code and WhatsApp number to cancel or reschedule." },
      { property: "og:title", content: "Manage Your Booking — Snapbox Studio" },
      { property: "og:description", content: "Cancel or reschedule your photobox session at Snapbox Studio Bandung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagePage,
});

const BRANCH_NAMES: Record<string, string> = { dago: "Dago", buahbatu: "Buah Batu" };
const PACKAGES: Record<string, { name: string; minutes: number }> = {
  solo: { name: "Solo", minutes: 15 },
  duo: { name: "Duo", minutes: 20 },
  group: { name: "Group", minutes: 30 },
};
const THEME_NAMES: Record<string, string> = { y2k: "Y2K", vintage: "Vintage", minimal: "Minimal" };
const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting deposit",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  no_show: "Missed",
  completed: "Completed",
};

const TIMES: string[] = [];
for (let m = 10 * 60; m <= 21 * 60; m += 30)
  TIMES.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);

const TWO_HOURS = 2 * 60 * 60 * 1000;
const slotStart = (dateKey: string, time: string) => new Date(`${dateKey}T${time}:00+07:00`);
const wibKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

type Booking = {
  booking_code: string;
  branch_id: string;
  package_id: string;
  theme_id: string;
  customer_name: string;
  people_count: number;
  slot_start: string;
  slot_end: string;
  status: string;
  deposit_status: string;
};

const inputCls =
  "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-secondary";

function ManagePage() {
  const [code, setCode] = useState("");
  const [wa, setWa] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "reschedule" | "confirmCancel">("view");

  const lookup = async (quiet = false) => {
    if (!code.trim() || !wa.trim()) {
      setError("Enter both your booking code and WhatsApp number.");
      return;
    }
    setBusy(true);
    if (!quiet) {
      setError(null);
      setNotice(null);
    }
    const { data, error: e } = await supabase.rpc("find_my_booking", { _booking_code: code, _whatsapp: wa });
    setBusy(false);
    const row = (data as Booking[] | null)?.[0];
    if (e || !row) {
      setBooking(null);
      setError("We couldn't find a booking with that code and WhatsApp number. Double-check both and try again.");
      return;
    }
    setBooking(row);
    setMode("view");
  };

  const explain = (msg: string) =>
    msg.includes("too_late")
      ? "Your session starts in less than 2 hours, so changes are no longer possible."
      : msg.includes("slot_taken")
        ? "Sorry, this slot was just taken. Please pick another time."
        : msg.includes("not_changeable")
          ? "This booking can't be changed anymore."
          : "Something went wrong. Please try again.";

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc("cancel_my_booking", { _booking_code: code, _whatsapp: wa });
    setBusy(false);
    if (e) return setError(explain(e.message));
    setNotice("Your booking has been cancelled. We hope to see you another time!");
    await lookup(true);
  };

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
      <main className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Manage your booking</h1>
        <p className="mt-2 text-muted-foreground">Enter your booking code and the WhatsApp number you booked with.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
          className="shadow-pop mt-6 space-y-4 rounded-3xl border-2 border-foreground bg-card p-6"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Booking code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SB-4X7K2"
              className={`${inputCls} font-display tracking-widest`}
              maxLength={12}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">WhatsApp number</span>
            <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812xxxxxxx" inputMode="tel" className={inputCls} maxLength={20} />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="shadow-pop inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            <Search className="h-4 w-4" /> {busy && !booking ? "Searching…" : "Find my booking"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 rounded-2xl border-2 border-destructive bg-card p-4 text-sm font-semibold text-destructive">{error}</p>}
        {notice && <p className="mt-4 rounded-2xl border-2 border-foreground bg-accent p-4 text-sm font-semibold">{notice}</p>}

        {booking && (
          <BookingCard
            booking={booking}
            busy={busy}
            mode={mode}
            setMode={setMode}
            onCancel={cancel}
            onRescheduled={async (msg) => {
              setNotice(msg);
              await lookup(true);
            }}
            code={code}
            wa={wa}
            explain={explain}
          />
        )}
      </main>
    </div>
  );
}

function BookingCard({
  booking,
  busy,
  mode,
  setMode,
  onCancel,
  onRescheduled,
  code,
  wa,
  explain,
}: {
  booking: Booking;
  busy: boolean;
  mode: "view" | "reschedule" | "confirmCancel";
  setMode: (m: "view" | "reschedule" | "confirmCancel") => void;
  onCancel: () => void;
  onRescheduled: (msg: string) => Promise<void>;
  code: string;
  wa: string;
  explain: (m: string) => string;
}) {
  const start = new Date(booking.slot_start);
  const pkg = PACKAGES[booking.package_id];
  const active = booking.status === "pending" || booking.status === "confirmed";
  const changeable = active && start.getTime() - Date.now() > TWO_HOURS;

  const rows: [string, string][] = [
    ["Name", booking.customer_name],
    ["Branch", `Snapbox ${BRANCH_NAMES[booking.branch_id] ?? booking.branch_id}`],
    ["Package", `${pkg?.name ?? booking.package_id} · ${booking.people_count} ${booking.people_count === 1 ? "person" : "people"}`],
    ["Backdrop", THEME_NAMES[booking.theme_id] ?? booking.theme_id],
    ["Date", formatWibDate(start)],
    ["Time", `${formatWibTime(start)} – ${formatWibTime(new Date(booking.slot_end))}`],
    ["Deposit", booking.deposit_status === "paid" ? "Paid" : "Unpaid"],
  ];

  return (
    <div className="shadow-pop mt-6 rounded-3xl border-2 border-foreground bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold tracking-widest">{booking.booking_code}</p>
        <span
          className={`rounded-full border-2 border-foreground px-3 py-1 text-xs font-bold ${
            booking.status === "confirmed" ? "bg-secondary text-secondary-foreground" : booking.status === "cancelled" ? "bg-muted" : "bg-accent"
          }`}
        >
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </div>
      <dl className="mt-4 divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {active && !changeable && (
        <p className="mt-5 rounded-2xl bg-muted p-4 text-sm">
          Your session starts in less than 2 hours, so changes are no longer possible. See you soon — we can't wait! 📸
        </p>
      )}

      {changeable && mode === "view" && (
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setMode("reschedule")}
            className="shadow-pop-sm inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-secondary px-4 py-3 font-bold text-secondary-foreground"
          >
            <CalendarClock className="h-4 w-4" /> Reschedule
          </button>
          <button
            onClick={() => setMode("confirmCancel")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-card px-4 py-3 font-bold"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
        </div>
      )}

      {changeable && mode === "confirmCancel" && (
        <div className="mt-5 rounded-2xl border-2 border-destructive p-4">
          <p className="text-sm font-semibold">Cancel this booking? The time slot will be released for someone else.</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button onClick={() => setMode("view")} className="rounded-2xl border-2 border-border px-4 py-2.5 font-bold">
              Keep it
            </button>
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-2xl bg-destructive px-4 py-2.5 font-bold text-destructive-foreground disabled:opacity-60"
            >
              {busy ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </div>
      )}

      {changeable && mode === "reschedule" && pkg && (
        <Reschedule
          booking={booking}
          minutes={pkg.minutes}
          code={code}
          wa={wa}
          explain={explain}
          onClose={() => setMode("view")}
          onDone={onRescheduled}
        />
      )}
    </div>
  );
}

function Reschedule({
  booking,
  minutes,
  code,
  wa,
  explain,
  onClose,
  onDone,
}: {
  booking: Booking;
  minutes: number;
  code: string;
  wa: string;
  explain: (m: string) => string;
  onClose: () => void;
  onDone: (msg: string) => Promise<void>;
}) {
  const [now] = useState(() => new Date());
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ start: number; end: number }[]>([]);
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => wibKey(new Date(now.getTime() + i * 86_400_000))),
    [now],
  );

  useEffect(() => {
    let off = false;
    supabase
      .rpc("get_booked_slots", {
        _branch_id: booking.branch_id,
        _from: new Date(now.getTime() - 86_400_000).toISOString(),
        _to: new Date(now.getTime() + 16 * 86_400_000).toISOString(),
      })
      .then(({ data }) => {
        if (off) return;
        const ownStart = new Date(booking.slot_start).getTime();
        setBooked(
          (data ?? [])
            .map((r) => ({ start: new Date(r.slot_start).getTime(), end: new Date(r.slot_end).getTime() }))
            .filter((r) => r.start !== ownStart), // don't block against the customer's own current slot
        );
      });
    return () => {
      off = true;
    };
  }, [booking, now, version]);

  const disabled = (d: string, t: string) => {
    const [hh = 0, mm = 0] = t.split(":").map(Number);
    if (hh * 60 + mm + minutes > 21 * 60) return true;
    const s = slotStart(d, t).getTime();
    if (s <= Date.now()) return true;
    if (s === new Date(booking.slot_start).getTime()) return true;
    const e = s + minutes * 60_000;
    return booked.some((b) => b.start < e && b.end > s);
  };

  const save = async () => {
    if (!date || !time) return setErr("Pick a new date and time first.");
    setSaving(true);
    setErr(null);
    const { error } = await supabase.rpc("reschedule_my_booking", {
      _booking_code: code,
      _whatsapp: wa,
      _new_start: slotStart(date, time).toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(explain(error.message));
      if (error.message.includes("slot_taken")) {
        setTime(null);
        setVersion((v) => v + 1);
      }
      return;
    }
    await onDone(`All set! Your session is now on ${formatWibDate(slotStart(date, time))} at ${time}.`);
  };

  return (
    <div className="mt-5 space-y-5 border-t-2 border-dashed border-border pt-5">
      <div>
        <h2 className="mb-3 font-display text-base font-bold">New date</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {days.map((key) => {
            const d = slotStart(key, "12:00");
            const act = date === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDate(key);
                  setTime(null);
                }}
                className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border-2 py-2.5 transition-all ${
                  act ? "border-foreground bg-primary text-primary-foreground shadow-pop-sm" : "border-border bg-card hover:border-foreground/40"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase opacity-80">
                  {d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Jakarta" })}
                </span>
                <span className="font-display text-xl font-bold">
                  {d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "Asia/Jakarta" })}
                </span>
                <span className="text-[11px] opacity-80">{d.toLocaleDateString("en-GB", { month: "short", timeZone: "Asia/Jakarta" })}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="mb-3 font-display text-base font-bold">New time</h2>
        {!date ? (
          <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Choose a date first to see open slots.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {TIMES.filter((t) => {
              const [hh = 0, mm = 0] = t.split(":").map(Number);
              return hh * 60 + mm + minutes <= 21 * 60;
            }).map((t) => {
              const dis = disabled(date, t);
              const act = time === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={dis}
                  onClick={() => setTime(t)}
                  className={`rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                    dis
                      ? "cursor-not-allowed border-dashed border-border bg-muted text-muted-foreground/60 line-through"
                      : act
                        ? "border-foreground bg-secondary text-secondary-foreground shadow-pop-sm"
                        : "border-border bg-card hover:border-foreground/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {err && <p role="alert" className="text-sm font-semibold text-destructive">{err}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="rounded-2xl border-2 border-border px-4 py-3 font-bold">
          Never mind
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="shadow-pop-sm rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save new time"}
        </button>
      </div>
    </div>
  );
}
