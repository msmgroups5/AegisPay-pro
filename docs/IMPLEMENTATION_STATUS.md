# AegisPay implementation status

## Implemented on the working branch

- Client signup and sign-in use Supabase Auth. New public signups are restricted to the USER role and create their profile through the Auth trigger.
- English/Urdu selection uses the browser's preferred language when supported, then asks the user to confirm or change it. Country or language detection is not an authoritative locale service.
- Deposit proof and CNIC/passport images upload to a private owner-scoped Storage bucket.
- Deposit workflow requires screenshot review plus a confirmed matching TRON transfer before any balance credit.
- KYC supports a CNIC front/back pair or passport photo page. A verified KYC record is reusable; rejected images can be submitted again.
- The withdrawal RPC blocks requests until KYC is verified. Client direct writes to balances, review statuses, deposits, and withdrawals are removed.
- A separate Master Admin web portal can review KYC, deposits, and withdrawals.
- Android has distinct Client and Master Admin application variants. The WebView supports image selection for screenshots and identity photos.
- The service worker caches only same-origin application files, never Supabase/Auth responses.
- Fixed the 10-second runtime poll so a healthy unchanged status no longer replaces the client DOM or clears an in-progress sign-in/sign-up form. The poll only redraws on a real runtime transition or first status error.
- The old demo login identities and displayed demo credentials have been removed from the client and admin entry points. All six unlinked live profile rows are now anonymized and marked DELETED; linked withdrawal, referral, task, notification, and audit history remains intact.
- Fifteen migrations are applied. The dual-approval migration adds atomic two-party withdrawal approval (Master Admin panel plus allowlisted Telegram user), secure dashboard aggregates, and an explicit testnet-only payout flag. A withdrawal stays reserved until both approvals; a rejection releases the reservation. A transaction ID blocks Telegram changes until payout reconciliation. Only `PAID` records count as completed payouts.
- All eight Edge Functions are ACTIVE. `admin-queues`, `admin-review`, `execute-payout`, and `telegram-withdrawal` are on the new versions; the Telegram webhook has platform JWT checks disabled only for its callback route, which instead validates a token-derived Telegram webhook secret, configured chat, stored message ID, allowlisted numeric approver ID, and runtime switch. Other Telegram actions still require a valid Supabase JWT and role.
- The live Supabase mode is `TESTNET_DEMO`, mainnet payouts remain disabled, and Shasta testnet payouts require a separate `TRON_TESTNET_PAYOUT_PRIVATE_KEY`. Withdrawals cannot pay without both recorded approvals and no existing transaction ID. The receive address remains blank until the owner supplies a controlled test wallet.
- The Master Admin queue now reports confirmed gross USDT deposits, credited USDT, `PAID` withdrawal count, and net USDT paid. The dashboard also offers a Telegram connection check and retry for unsent review messages.

## Runtime configuration still required

- Supabase Auth email confirmation, allowed redirect URLs, and outbound email delivery must be verified in project settings.
- A new Supabase Auth Master Admin identity must be created and its profile role set by the project owner. The old seed Master Admin row was anonymized with the other five; no shared password is embedded or generated.
- Supabase secret values are not readable through the connected management tools. The Master Admin dashboard's Telegram check verifies the saved bot token with Telegram `getMe`, checks the chat, and registers the webhook; it cannot be run until a Master Admin Auth identity exists. The deployment also requires `TELEGRAM_APPROVER_IDS`; that allowlist is enforced server-side.
- AI_REVIEW_ENDPOINT, AI_REVIEW_API_KEY, and AI_REVIEW_MODEL must be configured as Supabase Edge Function secrets. Until a live review check confirms them, deposits and KYC remain pending/manual review; balances are never credited by AI alone.
- A controlled TRON Shasta receiving wallet and test tokens are needed for end-to-end deposit testing. Testnet payouts require a separate funded test wallet and its private key stored as `TRON_TESTNET_PAYOUT_PRIVATE_KEY`. No chain transfer was made.
- Language auto-selection and translations currently cover English and Urdu; other locales fall back to English and need translated copy before broader language coverage.
- The Netlify production site remains on its previously ready deploy until the updated pull request builds; a deployment preview may still be blocked by the private-repository contributor verification gate.
- Local Auth/RBAC, Supabase service, new runtime-poll regression, static, and API smoke checks passed. GitHub Actions must rebuild both Android APKs from the new commit before a fresh install package is available. Repeat signup because the earlier failed signup did not create an Auth identity.

## Verification

Local verification passed: JavaScript syntax checks, the client runtime-poll regression test, core Auth/RBAC tests, Supabase service tests, static repository validation, and API smoke tests. The live migrations and all four updated Edge Function deployments succeeded. No Admin identity, Telegram callback, live-chain transfer, or payout was created as a test.

