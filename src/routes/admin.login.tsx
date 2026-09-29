import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleShell } from "@/components/SimpleShell";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Owner Login — Snapbox Studio" },
      { name: "description", content: "Sign in to the Snapbox Studio owner dashboard." },
      { property: "og:title", content: "Owner Login — Snapbox Studio" },
      { property: "og:description", content: "Owner-only access to the Snapbox Studio dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const DEMO_EMAIL = "demo@snapbox.test";
const DEMO_PASS = "SnapboxDemo2026";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err || !data.user) {
      setBusy(false);
      setError("That email and password don't match. Please try again.");
      return;
    }
    const { data: isOwner } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "owner" });
    if (!isOwner) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("This account doesn't have owner access.");
      return;
    }
    navigate({ to: "/admin", replace: true });
  };

  const input =
    "mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <SimpleShell>
      <div className="mx-auto max-w-sm">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-pop-sm">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">Owner login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to see today's schedule and manage the studio.</p>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-secondary/50 bg-card p-4 text-sm">
          <div className="flex items-center gap-2 font-bold">
            <KeyRound className="h-4 w-4 text-secondary" /> Demo login
          </div>
          <p className="mt-1 text-muted-foreground">
            Email: <span className="font-mono text-foreground">{DEMO_EMAIL}</span>
            <br />
            Password: <span className="font-mono text-foreground">{DEMO_PASS}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASS);
            }}
            className="mt-2 text-xs font-bold text-secondary underline underline-offset-4"
          >
            Fill in demo login
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </label>
          {error && <p className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-primary">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-pop-sm transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </SimpleShell>
  );
}
