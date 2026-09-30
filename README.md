# Snapbox Studio

A booking web app for a fictional self-photo (photobox) studio in Bandung, Indonesia. Built for the Lovable "built it for small business" challenge.

**Live demo:** https://snapbox-studio-bdg.lovable.app
**Code:** https://github.com/DropzyID/snapbox-studio-bdg

## Features
- 5-step booking flow (branch, package, backdrop, time slot, details)
- Interactive backdrop previewer (Y2K, Vintage, Minimal)
- Real-time slot availability with database-level double-booking protection
- 30% deposit step (simulated payment)
- Manage booking: reschedule or cancel up to 2 hours before the session
- Automatic waitlist with a 10-minute claim link
- Owner dashboard: schedule, revenue, no-show rate, busiest hours, slots recovered via waitlist
- Responsive layout (mobile, tablet, desktop)

## Tech stack
- Lovable (AI app builder)
- React + TypeScript
- Supabase (database, auth, Row Level Security, server functions)

## Security
- Customer data is written only through server-side functions
- Public users can only see which slots are taken, never customer names or phone numbers
- Owner-only access to the admin dashboard
- Lovable quick and deep security scans passed before publishing

## Demo notes
- Fictional business created for a portfolio demo
- Payments and WhatsApp messages are simulated
- Dashboard data is seeded demo data
- Owner dashboard: /admin/login (demo account: Email: demo@snapbox.test
Password: SnapboxDemo2026)

## Author
Built by DropzyID with Lovable.
