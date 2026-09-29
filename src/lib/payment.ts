// Deposit payment layer. Currently a simulation — swap these functions for a
// real gateway (Midtrans, Xendit) without touching the booking UI.
import { supabase } from "@/integrations/supabase/client";

export const DEPOSIT_RATE = 0.3;
export const PAYMENT_WINDOW_MS = 10 * 60 * 1000;

export function depositFor(price: number) {
  const deposit = Math.round((price * DEPOSIT_RATE) / 1000) * 1000;
  return { deposit, balance: price - deposit };
}

export type PaymentSession = { bookingCode: string; amount: number; qrPayload: string; expiresAt: number };

export function createPaymentSession(bookingCode: string, amount: number): PaymentSession {
  return {
    bookingCode,
    amount,
    qrPayload: `DEMO-QRIS|SNAPBOX|${bookingCode}|IDR${amount}`,
    expiresAt: Date.now() + PAYMENT_WINDOW_MS,
  };
}

export async function confirmPayment(bookingCode: string): Promise<{ ok: true } | { ok: false; expired: boolean }> {
  const { error } = await supabase.rpc("simulate_deposit_paid", { _booking_code: bookingCode });
  if (!error) return { ok: true };
  return { ok: false, expired: error.message.includes("payment_window_closed") };
}

export async function expirePayment(bookingCode: string) {
  await supabase.rpc("expire_unpaid_booking", { _booking_code: bookingCode });
}
