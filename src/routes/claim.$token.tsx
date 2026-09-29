import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRANCH_NAMES, SimpleShell, fmtWib } from "@/components/SimpleShell";

export const Route = createFileRoute("/claim/$token")({
  head: () => ({
    meta: [
      { title: "Claim Your Slot — Snapbox Studio" },
      { name: "description", content: "A waitlist slot opened up at Snapbox Studio. Claim it before the timer runs out." },
      { property: "og:title", content: "Claim Your Slot — Snapbox Studio" },
      { property: "og:description", content: "A photobox slot opened up for you. Claim it within 10 minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClaimPage,
});

type Offer = { branch_id: string; slot_start: string; expires_at: string; status: string };

function ClaimPage() {
  const { token } = Route.useParams();
  const [offer, setOffer] = useState<Offer | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    setOffer(undefined);
    supabase.rpc("get_waitlist_offer", { _token: token }).then(({ data, error }) => {
      if (error) return setFailed(true);
      setOffer(data?.[0] ?? null);
    });
  };
  useEffect(load, [token]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const left = offer ? new Date(offer.expires_at).getTime() - now : 0;
  const live = !!offer && offer.status === "active" && left > 0;
  const mm = String(Math.max(0, Math.floor(left / 60000))).padStart(2, "0");
  const ss = String(Math.max(0, Math.floor((left % 60000) / 1000))).padStart(2, "0");

  return (
    <SimpleShell>
      <div className="rounded-3xl border-2 border-foreground bg-card p-6 text-center shadow-pop sm:p-8">
        {failed ? (
          <div role="alert" className="py-6">
            <h1 className="font-display text-xl font-bold">We couldn't load this offer</h1>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <button type="button" onClick={load} className="mt-5 rounded-full border-2 border-foreground px-5 py-2 text-sm font-bold">
              Try again
            </button>
          </div>
        ) : offer === undefined ? (
          <div aria-busy="true" aria-label="Loading your offer" className="space-y-3 py-4">
            <div className="sb-skeleton mx-auto h-7 w-2/3" />
            <div className="sb-skeleton mx-auto h-4 w-1/2" />
            <div className="sb-skeleton mx-auto h-16 w-40" />
            <div className="sb-skeleton mx-auto h-12 w-48 rounded-full" />
          </div>
        ) : !live ? (
          <>
            <h1 className="font-display text-2xl font-bold">This offer is no longer available</h1>
            <p className="mt-3 text-muted-foreground">
              {offer?.status === "claimed"
                ? "This slot has already been claimed."
                : "The 10-minute window has passed, so the slot moved on. You can still book any open time."}
            </p>
            <Link
              to="/book"
              className="mt-6 inline-flex rounded-full border-2 border-foreground bg-primary px-6 py-3 font-bold text-primary-foreground shadow-pop-sm"
            >
              Book a session
            </Link>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> A slot opened up
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">It's your turn!</h1>
            <div className="mt-6 space-y-2 rounded-2xl bg-muted p-4 text-left">
              <p className="flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-primary" /> {BRANCH_NAMES[offer.branch_id] ?? offer.branch_id}
              </p>
              <p className="flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4 text-primary" /> {fmtWib(offer.slot_start)} WIB
              </p>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Held for you for</p>
            <p className="font-display text-5xl font-bold tabular-nums text-primary">
              {mm}:{ss}
            </p>
            <Link
              to="/book"
              search={{ claim: token }}
              className="mt-6 inline-flex w-full justify-center rounded-full border-2 border-foreground bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-pop-sm transition-transform hover:-translate-y-0.5"
            >
              Claim this slot
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">You'll pick your package and backdrop next.</p>
          </>
        )}
      </div>
    </SimpleShell>
  );
}
