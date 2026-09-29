# Supabase operational configuration

Project: wtcspnrmsoisroavojop

## Migrations and Edge Functions

The connected project already has these additive migrations applied:

- `20260930_signup_private_evidence_and_kyc.sql`
- `20260930_network_aware_deposit_credit.sql`
- `20260930_rls_and_foreign_key_indexes.sql`

The `submit-deposit`, `submit-kyc`, `admin-queues`, `admin-review`, `verify-deposit`, `monitor-deposits`, and `execute-payout` Edge Functions are deployed and ACTIVE.

All six original unlinked application profiles were anonymized in place, marked DELETED, and had old elevated roles reset to USER. Their linked history remains intact.

## Secrets

Keep secrets in Supabase Edge Function configuration:

- `TRONGRID_API_KEY` (required for mainnet; optional for public testnet calls)
- `AEGIS_CRON_SECRET` (required for monitor-deposits)
- `AI_REVIEW_ENDPOINT`
- `AI_REVIEW_API_KEY`
- `AI_REVIEW_MODEL`
- `TRON_PAYOUT_PRIVATE_KEY` (only for deliberately enabled mainnet payouts)

Supabase supplies project URL and server API credentials to Edge Functions. Never place a service-role/secret key in the client app. The AI settings must point to an HTTPS OpenAI-compatible vision endpoint. The app stores review statuses and short issue codes; it does not persist extracted ID numbers. When AI settings are missing or uncertain, submissions remain in manual review.

## Required project settings

- Verify Supabase Auth email-confirmation and redirect settings, and configure email delivery.
- Verify or replace `deposit_rules.receiving_address` with a wallet controlled for TRON testnet use, then fund it with test tokens.
- Keep `system_mode` set to `TESTNET_DEMO` and `real_payouts` false while testing.
- Create a new Supabase Auth identity for the first Master Admin, then set its profile role through a project-owner-controlled operation. No Master Admin Auth identity currently exists.
- Recheck Supabase security/performance advisors after application traffic. Authenticated SECURITY DEFINER RPC warnings remain for functions that enforce caller identity or Master Admin role checks; unused-index notices are expected before application traffic.

Only English and Urdu translations are currently available; the browser language is detected for those two locales and other languages fall back to English.
