# AegisPay Production Readiness

## Verified deployment state — 2026-10-08

- GitHub repository: `msmgroups5/AegisPay-pro`
- Production source branch: `main`
- Cloudflare Pages project: `aegispay-pro`
- Supabase project: `wtcspnrmsoisroavojop`, ACTIVE_HEALTHY
- Public website route: `/`
- Client portal route: `/app/`
- Master Admin route: `/admin/`
- Client APK route: `/downloads/aegispay-client.apk`

## Source-of-truth alignment

- Client portal source is root `client.html`.
- Master Admin source is root `master-admin.html`.
- Shared browser assets are rooted at the repository top level.
- `site/` is the Cloudflare Pages publish package; `site/app/index.html` mirrors `client.html`.
- The Cloudflare Pages workflow copies the canonical root client/admin/runtime assets into the publish package on every build.
- Android client/admin flavors bundle the same canonical root portal files.
- No alternate React/Vite client, demo REST backend, preview site, or legacy UniApp/Huawei web runtime remains in `main`.

## Supabase verified state

- RLS is enabled on the application tables.
- Two Auth users exist and both are email-confirmed.
- Two AegisPay profiles are linked: one active MASTER ADMIN and one active USER.
- `private-verification` Storage bucket is present, private, limited to 10 MB, and restricted to JPEG/PNG/WebP.
- Storage access policies are owner-scoped and runtime-gated.
- One active cycle-settlement cron runs every minute.
- Current system mode is `MAINNET / LIVE_DEPOSIT_TEST`.
- Controlled live-deposit testing is enabled; real payouts remain disabled by the Phase 3 server-side payout gate.
- No Supabase development branches exist.

## Security review

Supabase Security Advisor currently reports 8 authenticated-callable SECURITY DEFINER functions. These functions are intentionally used by authenticated client/admin/RLS workflows and enforce explicit identity, role, ownership and/or runtime checks. The stale one-argument `link_withdrawal_wallet(text)` overload is no longer callable by client roles.

Leaked Password Protection is still disabled and is a production prerequisite.

Public table grants were hardened to least privilege on 2026-10-03:
- sensitive tables no longer grant write privileges to `anon` or `authenticated`;
- client-readable tables are SELECT-only;
- notifications retain UPDATE for read-state changes;
- Shop offers and platform settings retain only the authenticated operations required by the Master Admin UI.

## Performance review

Supabase Performance Advisor reports 12 currently unused indexes. With the present small dataset, these are review candidates, not automatic deletion targets. Do not remove an index solely because it has not yet been used.

## Current production blockers

1. Operator-side: enable Leaked Password Protection in Supabase Auth when available on the current plan.
2. Configure and verify server-side AI, Telegram and controlled Shasta/testnet payout secrets.
3. Complete TESTNET_DEMO end-to-end verification for deposit evidence, on-chain confirmation, Shop/tasks, 18-hour settlement, KYC and withdrawal dual approval.
4. Verify production Auth redirect/provider/SMTP settings on a physical client device.
5. Configure release signing and perform physical APK update verification.
