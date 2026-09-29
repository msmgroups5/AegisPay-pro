# AegisPay Production Readiness

## Verified deployment state — 2026-09-29

- GitHub repository: msmgroups5/AegisPay-pro, default branch main.
- Netlify project aegispay-pro has a ready HTTPS deployment. No Netlify environment variables are configured.
- Supabase project wtcspnrmsoisroavojop is active and healthy.
- Supabase has six application profiles and zero Auth users or linked profiles.
- All 14 public application tables inspected have RLS enabled; FORCE ROW LEVEL SECURITY is off.
- Four Supabase Edge Functions are active. monitor-deposits has platform JWT verification disabled but checks the AEGIS_CRON_SECRET header in its function code. The other three require JWT verification.
- No Storage buckets or Storage policies exist.
- The browser app uses localStorage demo data. Supabase client/service wrappers are loaded but are not used by the app's login or business-data flows.
- execute-payout is a live TRON mainnet USDT payout path when its private key is configured. The connected read interface does not expose whether that secret is set.
- A live migration now restricts profile claiming to verified, invited or server-approved Auth identities. The payout function now uses an atomic claim and keeps uncertain broadcasts locked for manual reconciliation.

## Remaining production work

- Provision approved Auth users and connect sign-in/profile mapping to the browser.
- Replace localStorage demo reads/writes with the Supabase business tables and protected server-side operations.
- Set and verify required Supabase Function secrets securely; do not put service-role or payout credentials in the browser or Netlify.
- Configure a private Storage bucket and owner-scoped policies if deposit evidence upload is required.
- Check in the source for the three remaining deployed Edge Functions and reconcile the full live migration history with repository SQL.
- Review the seven authenticated SECURITY DEFINER advisor warnings and outstanding performance findings. All exposed public application tables inspected have RLS enabled, but that alone does not complete role/security validation.
- Verify Auth provider, email-confirmation, and redirect settings in the Supabase dashboard; those settings were not exposed by the available project connection.
- Complete domain, monitoring, operational incident, security, and applicable compliance reviews.

## Financial scope

The browser UI and demo REST API display demonstration/system data and do not settle payments. The separate execute-payout Edge Function can broadcast a real mainnet USDT transfer when configured, so it must be governed as a money-moving operation.
