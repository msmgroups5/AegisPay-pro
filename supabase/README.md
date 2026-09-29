# Supabase production layer

The connected Supabase project wtcspnrmsoisroavojop is active and healthy in ap-northeast-1.

## Verified state on 2026-09-29

- Six public application tables have RLS enabled; all 14 exposed public application tables inspected have RLS enabled. FORCE ROW LEVEL SECURITY is off.
- Six application profiles exist, but there are zero Auth users and zero linked profiles.
- claim_aegispay_profile now requires a verified email and either a Supabase Auth invitation or server-controlled app metadata with aegispay_approved=true before linking an unclaimed profile.
- Four Edge Functions are active: verify-deposit, monitor-deposits, telegram-withdrawal and execute-payout. JWT verification is enabled for all except monitor-deposits, which checks the AEGIS_CRON_SECRET header in its body.
- execute-payout now atomically claims an approved withdrawal before sending. An uncertain chain result stays PROCESSING for manual reconciliation.
- No Storage buckets or Storage policies are configured.
- The repository app still uses its localStorage demo store. The Supabase client/service wrappers are loaded but are not yet connected to the app login or business-data workflows.
- The Netlify project has no environment variables configured. The browser Supabase URL and publishable key are public client settings, not server secrets.

## Important live boundary

execute-payout submits a TRON mainnet USDT transfer when its payout private key is configured. Secret values and their presence are not exposed through the current connected read tools. Do not treat this path as a demo or assume it is inactive.

## Remaining work

1. Provision approved Auth identities through Supabase invitation or server-controlled app metadata, then connect browser sign-in and profile loading.
2. Replace the demo localStorage business store with Supabase reads and authorized RPC/Edge Function writes before presenting the app as live.
3. Define a private Storage bucket and owner-scoped policies before storing deposit evidence.
4. Check in the source for the other three deployed Edge Functions and reconcile the repository's consolidated schema with the six live migrations.
5. Review the remaining authenticated SECURITY DEFINER advisor findings and the performance advisor findings before production use.
6. Verify required Supabase runtime secrets through the Supabase dashboard; the connected audit interface does not reveal their presence or values.

Keep all service-role keys, bot tokens and payout keys server-side. Never place them in browser configuration or Netlify client variables.
