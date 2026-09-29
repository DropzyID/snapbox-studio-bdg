import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const rupiahFmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

/** Live package prices from the database (owner can edit them in /admin). */
export function usePackagePrices(): Record<string, number> {
  const [prices, setPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    supabase
      .from("packages")
      .select("id, price")
      .then(({ data }) => {
        if (!alive || !data) return;
        setPrices(Object.fromEntries(data.map((p) => [p.id, p.price])));
      });
    return () => {
      alive = false;
    };
  }, []);
  return prices;
}
