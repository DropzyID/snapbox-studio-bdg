import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRANCH_NAMES, SimpleShell, fmtWib } from "@/components/SimpleShell";

export const Route = createFileRoute("/waitlist-demo")({
  head: () => ({
    meta: [
      { title: "Waitlist Offers Demo — Snapbox Studio" },
      { name: "description", content: "Demo page listing active waitlist claim links for Snapbox Studio." },
      { property: "og:title", content: "Waitlist Offers Demo — Snapbox Studio" },
      { property: "og:description", content: "Test the Snapbox Studio waitlist: active claim links in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WaitlistDemo,
});

type Offer = { token: string; branch_id: string; slot_start: string; expires_at: string };

function WaitlistDemo() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = () =>
    supabase.rpc("list_active_offers").then(({ data }) => setOffers(data ?? []));

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  return (
    <SimpleShell>
      <h1 className="font-display text-3xl font-bold">Waitlist offers</h1>
      <p className="mt-3 rounded-2xl border-2 border-dashed border-primary bg-accent p-3 text-sm font-bold text-accent-foreground">
        Demo only. In production this link would be sent via WhatsApp.
      </p>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Active offers (valid 10 minutes each)</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-border px-3 py-1 text-sm font-bold hover:border-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {offers === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : offers.length === 0 ? (
          <p className="rounded-3xl border-2 border-border bg-card p-6 text-center text-muted-foreground">
            No active offers right now. Join a waitlist on a booked slot, then cancel that booking to see one appear.
          </p>
        ) : (
          offers.map((o) => {
            const left = Math.max(0, new Date(o.expires_at).getTime() - now);
            return (
              <div key={o.token} className="rounded-3xl border-2 border-foreground bg-card p-4 shadow-pop-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{BRANCH_NAMES[o.branch_id] ?? o.branch_id}</p>
                    <p className="text-sm text-muted-foreground">{fmtWib(o.slot_start)} WIB</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold tabular-nums text-secondary-foreground">
                    {Math.floor(left / 60000)}:{String(Math.floor((left % 60000) / 1000)).padStart(2, "0")} left
                  </span>
                </div>
                <Link
                  to="/claim/$token"
                  params={{ token: o.token }}
                  className="mt-3 block truncate rounded-xl bg-muted px-3 py-2 font-mono text-sm text-primary hover:underline"
                >
                  /claim/{o.token}
                </Link>
              </div>
            );
          })
        )}
      </div>
    </SimpleShell>
  );
}
