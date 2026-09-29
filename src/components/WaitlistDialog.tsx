import { useState } from "react";
import { z } from "zod";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name (at least 2 letters).").max(60, "Keep your name under 60 characters."),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+62|62|0)8\d{7,11}$/.test(v), "Hmm, that doesn't look like an Indonesian WhatsApp number. Try 0812xxxxxxx."),
});

export function WaitlistDialog({
  open,
  onOpenChange,
  branchId,
  branchName,
  slotStart,
  label,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  branchId: string;
  branchName: string;
  slotStart: Date | null;
  label: string;
}) {
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [errors, setErrors] = useState<{ name?: string | undefined; whatsapp?: string | undefined; form?: string | undefined }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const change = (o: boolean) => {
    if (!o) {
      setDone(false);
      setErrors({});
    }
    onOpenChange(o);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ name, whatsapp: wa });
    if (!r.success) {
      const f = r.error.flatten().fieldErrors;
      setErrors({ name: f.name?.[0], whatsapp: f.whatsapp?.[0] });
      return;
    }
    if (!slotStart) return;
    setBusy(true);
    setErrors({});
    const { error } = await supabase.rpc("join_waitlist", {
      _branch_id: branchId,
      _slot_start: slotStart.toISOString(),
      _customer_name: r.data.name,
      _whatsapp: r.data.whatsapp,
    });
    setBusy(false);
    if (error) {
      setErrors({ form: "We couldn't add you to the waitlist. Please try again." });
      return;
    }
    setDone(true);
  };

  const input = "w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none focus:border-foreground";

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="rounded-3xl border-2 border-foreground bg-background shadow-pop">
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-7 w-7" />
            </div>
            <DialogTitle className="font-display text-xl">You're on the waitlist</DialogTitle>
            <DialogDescription className="mt-2">
              You're on the waitlist. We'll offer you this slot if it opens up.
            </DialogDescription>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Join the waitlist</DialogTitle>
              <DialogDescription>
                {branchName} · {label}. If this slot opens up, we'll send you a link to claim it.
              </DialogDescription>
            </DialogHeader>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Name</span>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              {errors.name && <span className="mt-1 block text-sm font-medium text-primary">{errors.name}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">WhatsApp number</span>
              <input className={input} value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812xxxxxxx" inputMode="tel" />
              {errors.whatsapp && <span className="mt-1 block text-sm font-medium text-primary">{errors.whatsapp}</span>}
            </label>
            {errors.form && <p className="text-sm font-medium text-primary">{errors.form}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full border-2 border-foreground bg-primary py-3 font-bold text-primary-foreground shadow-pop-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Adding you…" : "Join waitlist"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
