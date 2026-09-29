import { createFileRoute, Link } from "@tanstack/react-router";
import { SimpleShell } from "@/components/SimpleShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Snapbox Studio" },
      {
        name: "description",
        content:
          "Privacy note for the Snapbox Studio portfolio demo: how demo booking details are handled.",
      },
      { property: "og:title", content: "Privacy — Snapbox Studio" },
      {
        property: "og:description",
        content: "How the Snapbox Studio portfolio demo handles the details you enter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Privacy() {
  return (
    <SimpleShell>
      <div className="sb-page">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Privacy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Snapbox Studio is a fictional self-photo studio created for a portfolio demo.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-base font-bold">This is a demo</h2>
            <p className="mt-2 opacity-80">
              This website does not represent a real business. Nothing here is a real service, and
              no real payments are processed — the payment screen is simulated.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">What we store</h2>
            <p className="mt-2 opacity-80">
              If you use the booking form, the name and WhatsApp number you enter are stored only to
              demonstrate the booking flow — for example, so you can look up your booking on the
              Manage booking page. They are never shared with anyone and are not used for any other
              purpose.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">No real messages or payments</h2>
            <p className="mt-2 opacity-80">
              WhatsApp messages and payment confirmations shown in the demo are simulated. No real
              message is sent and no money is charged.
            </p>
          </section>

          <p className="pt-2 text-xs opacity-60">
            Questions? This is a portfolio project — reach out via the contact buttons in the{" "}
            <Link to="/" className="underline underline-offset-2 hover:text-primary">
              footer on the home page
            </Link>
            .
          </p>
        </div>
      </div>
    </SimpleShell>
  );
}

export default Privacy;
