import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Clock, QrCode, TimerOff } from "lucide-react";
import { confirmPayment, expirePayment, type PaymentSession } from "@/lib/payment";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function DepositPayment({
  session,
  balance,
  onPaid,
  onBookAgain,
}: {
  session: PaymentSession;
  balance: number;
  onPaid: () => void;
  onBookAgain: () => void;
}) {
  const [svg, setSvg] = useState("");
  const [left, setLeft] = useState(() => Math.max(0, session.expiresAt - Date.now()));
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiring = useRef(false);

  useEffect(() => {
    QRCode.toString(session.qrPayload, { type: "svg", margin: 0, color: { dark: "#1A1A2E", light: "#0000" } }).then(setSvg);
  }, [session.qrPayload]);

  useEffect(() => {
    const id = setInterval(() => {
      const ms = Math.max(0, session.expiresAt - Date.now());
      setLeft(ms);
      if (ms === 0 && !expiring.current) {
        expiring.current = true;
        clearInterval(id);
        void expirePayment(session.bookingCode).finally(() => setExpired(true));
      }
    }, 250);
    return () => clearInterval(id);
  }, [session]);

  const pay = async () => {
    if (busy || expired) return;
    setBusy(true);
    setError(null);
    const r = await confirmPayment(session.bookingCode);
    setBusy(false);
    if (r.ok) return onPaid();
    if (r.expired) setExpired(true);
    else setError("We couldn't confirm the payment. Please try again.");
  };

  if (expired) {
    return (
      <div className="shadow-pop mx-auto max-w-lg rounded-3xl border-2 border-foreground bg-card p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
          <TimerOff className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">Time's up!</h1>
        <p className="mt-3 text-muted-foreground">
          The 10-minute payment window for {session.bookingCode} has ended, so we've released the slot. No worries —
          you can book again in a few taps.
        </p>
        <button
          onClick={onBookAgain}
          className="shadow-pop mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          Book again
        </button>
      </div>
    );
  }

  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  const urgent = left < 60000;

  return (
    <div className="shadow-pop mx-auto max-w-lg rounded-3xl border-2 border-foreground bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Pay your deposit</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1 font-display text-sm font-bold tabular-nums ${urgent ? "bg-primary text-primary-foreground" : "bg-accent"}`}
          aria-live="polite"
        >
          <Clock className="h-4 w-4" />
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Booking code <span className="font-display font-bold tracking-widest text-foreground">{session.bookingCode}</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-foreground bg-accent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deposit (30%)</p>
          <p className="mt-1 font-display text-lg font-bold">{rupiah(session.amount)}</p>
        </div>
        <div className="rounded-2xl border-2 border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay at studio</p>
          <p className="mt-1 font-display text-lg font-bold">{rupiah(balance)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-foreground bg-background p-5 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
          <QrCode className="h-4 w-4" /> Demo QRIS - simulated payment
        </p>
        <div
          className="mx-auto mt-3 aspect-square w-48 rounded-xl bg-card p-3 sm:w-56 [&_svg]:h-full [&_svg]:w-full"
          role="img"
          aria-label="Demo QRIS code"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-3 text-sm text-muted-foreground">Demo QR - no real payment is made</p>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
      <button
        onClick={pay}
        disabled={busy}
        className="shadow-pop mt-5 w-full rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Checking payment…" : "I've paid"}
      </button>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Payment is simulated in this demo. A real gateway like Midtrans or Xendit can be plugged in here.
      </p>
    </div>
  );
}
