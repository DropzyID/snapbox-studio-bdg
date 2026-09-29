import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";

export const BRANCH_NAMES: Record<string, string> = { dago: "Dago", buahbatu: "Buah Batu" };

export const fmtWib = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function SimpleShell({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto max-w-xl px-4 pb-16 pt-10 sm:px-6">{children}</main>
    </div>
  );
}

