import { createFileRoute, Link } from "@tanstack/react-router";
import { SimpleShell } from "@/components/SimpleShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Snapbox Studio" },
      {
        name: "description",
        content:
          "Terms for the Snapbox Studio portfolio demo: bookings, payments, and messages are simulated.",
      },
      { property: "og:title", content: "Terms — Snapbox Studio" },
      {
        property: "og:description",
        content: "Bookings, payments, and WhatsApp messages on this site are simulated for a portfolio demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Terms() {
  return (
    <SimpleShell>
      <div className="sb-page">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Terms</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Snapbox Studio is a fictional self-photo studio created for a portfolio demo.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-base font-bold">Simulated bookings</h2>
            <p className="mt-2 opacity-80">
              Bookings made on this website are simulated for portfolio purposes. No real session is
              reserved and no real studio exists at the locations shown.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">Simulated payments</h2>
            <p className="mt-2 opacity-80">
              Payments are simulated. The QR screen and deposit confirmation are part of the demo —
              no money is ever charged and no real payment gateway is connected.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">Simulated WhatsApp messages</h2>
            <p className="mt-2 opacity-80">
              WhatsApp links and confirmations shown in the demo are illustrative. No real message
              is sent to any phone number.
            </p>
          </section>

          <p className="pt-2 text-xs opacity-60">
            See also our{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-primary">
              privacy note
            </Link>{" "}
            or head{" "}
            <Link to="/" className="underline underline-offset-2 hover:text-primary">
              back to the home page
            </Link>
            .
          </p>
        </div>
      </div>
    </SimpleShell>
  );
}

export default Terms;
