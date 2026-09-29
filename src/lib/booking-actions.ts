// Placeholder studio WhatsApp number — replace with the real one.
export const STUDIO_WHATSAPP = "6281200000000";

export type BookingInfo = {
  code: string;
  packageName: string;
  branchName: string;
  start: Date;
  minutes: number;
};

const wib = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-GB", { timeZone: "Asia/Jakarta", ...opts });

export const formatWibDate = (d: Date) => wib(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const formatWibTime = (d: Date) => wib(d, { hour: "2-digit", minute: "2-digit", hour12: false });

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function downloadIcs(b: BookingInfo) {
  const end = new Date(b.start.getTime() + b.minutes * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Snapbox Studio//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${b.code}@snapbox.studio`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(b.start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:Snapbox Studio ${b.branchName} - ${b.packageName} session`,
    `LOCATION:Snapbox Studio ${b.branchName}\\, Bandung`,
    `DESCRIPTION:Booking code: ${b.code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `snapbox-${b.code}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function whatsappLink(b: BookingInfo) {
  const msg = `Hi Snapbox! My booking code is ${b.code}.\nPackage: ${b.packageName}\nBranch: ${b.branchName}\nDate: ${formatWibDate(b.start)}\nTime: ${formatWibTime(b.start)}`;
  return `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
