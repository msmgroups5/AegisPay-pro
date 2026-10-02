# AegisPay — Fresh React Client

The fresh client is a React/Vite/Tailwind mobile-first portal aligned to the existing AegisPay Supabase business schema.

## Current operational work
- Supabase Auth sign-in and client signup through the existing `public-signup` Edge Function.
- Protected client routes and persistent Supabase sessions.
- Live user profile/balance/principal/profit/status data from `public.users`.
- Server-side deposit submission through `submit-deposit`; no direct balance credit from the browser.
- Deposit tier validation, 64-character TRON TXID validation and private evidence upload.
- Live referral ledger reads.
- Withdrawal requests through the existing `request_withdrawal` RPC.
- Runtime error boundary so React exceptions show a recovery screen instead of a blank page.
- Android WebView fixes: relative Vite assets and hash routing.
- APK workflow verifies the web build and APK file before artifact upload.

## Security boundary
The browser never receives service-role keys, payout keys or Telegram bot credentials. Financial approval and balance-changing operations remain server-side.

## Remaining live prerequisite
The connected Supabase project previously reported no `private-verification` Storage bucket. Migration `web/supabase/migrations/002_private_verification_storage.sql` prepares the required private bucket and owner-scoped policies; it must be applied to the live project before evidence uploads can work.

The fresh client is intentionally aligned to the existing `users`, `deposit_submissions`, `referrals`, `withdrawal_requests`, `vip_tiers` and existing Edge Function/RPC layer instead of replacing those production tables with the earlier incompatible demo schema.

## Testnet boundary
Deposit verification and payout behavior follow the existing AegisPay testnet/prototype controls. Do not treat the client as real-mainnet production until Auth, private Storage, deposit verification, Master Admin approval, Telegram approval, payout reconciliation, release signing and end-to-end device tests are verified.
