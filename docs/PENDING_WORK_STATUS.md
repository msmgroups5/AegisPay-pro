# AegisPay Pending Work Status

Last aligned: 2026-10-08

## Current status

### Completed / implemented
- Canonical client portal is wired to Supabase Auth and the AegisPay runtime.
- Client flows exist for login, signup, password reset, home, top-up/deposit, withdrawal, KYC, referral, activity/history, assets/profile, tasks, AI Bot and Shop.
- Master Admin portal source and protected admin runtime exist.
- Supabase production project is ACTIVE_HEALTHY.
- Public application tables are RLS-enabled.
- Required Edge Functions are deployed and active.
- Withdrawal wallet locking and Master Admin wallet-change flow exist.
- Shop is deployed as the separate `aegispay-shopping` Worker.
- AI Bot chat layout is implemented.
- Shop UI has Amazon-style visual treatment, touch horizontal category scrolling and the current product catalog pipeline.

### Verified in this work session
- Security hardening of exposed SECURITY DEFINER RPC grants.
- Added and applied migration:
  `database/migrations/20261005_security_rpc_grants_hardening.sql`
- Anonymous execution exposure for `admin_set_withdrawal_wallet` and `link_withdrawal_wallet` was removed.
- Live RPC drift was corrected: the canonical two-argument `link_withdrawal_wallet(text,text)` is now executable by `authenticated`, while the stale one-argument overload is no longer executable by client roles.
- Security Advisor now shows 8 intentional authenticated SECURITY DEFINER findings plus the leaked-password protection warning.
- Leaked-password protection is still disabled and remains a production security gate.
- Master Admin wallet changes were moved from direct RPC execution to the authenticated `admin-account-ops` Edge Function (v2).
- `admin_set_withdrawal_wallet(uuid,text)` EXECUTE was revoked from `authenticated`; direct client RPC access is now blocked.
- Authenticated client smoke-check confirmed the current user resolves to app role `USER`, sees only the expected RLS-scoped user row, and can read the Shop catalog/runtime settings.
- Leaked-password protection is deferred by operator decision because it is not available on the current plan; it is not being treated as an active Phase 1 task for now.
- Function-by-function review found the remaining 8 authenticated SECURITY DEFINER findings are intentionally used by client/admin workflows and have explicit role/authentication gates; no unauthenticated execution was retained for those reviewed functions.
- RPC/RLS privilege smoke-check confirmed: anonymous users cannot select client users or execute protected RPCs; authenticated users cannot directly insert into deposit/KYC/withdrawal tables; client task/withdrawal/profile helper RPCs remain available only to authenticated users.
- Read-only financial integrity audit confirmed zero unexplained balance for the two current profiles; the live financial tables are empty, so no state-transition E2E can truthfully be marked passed yet.
- Shop checkout business-rule bug was fixed: the canonical client now requires the exact assigned task set, calculates totals from `task_value`, and uses a server-side `complete-cycle-checkout` endpoint; direct client execution of the legacy single-task completion RPC was retired.
- Controlled Master Admin session check resolved the actor as MASTER ADMIN with admin-scoped row visibility. The operational queues are currently empty, so live KYC/deposit/withdrawal end-to-end state transitions still require TESTNET_DEMO fixture records or real test submissions before they can be marked passed.

## Pending sequence

### Phase 1 — Production-safe application foundation
1. Operator-side: enable Supabase leaked-password protection when available on the current plan.
2. Complete TESTNET_DEMO end-to-end auth/KYC/deposit/withdrawal/referral/task transition tests.
3. Complete controlled Master Admin queue/review/account-operation transition tests.
4. Run a final Security Advisor review after all production configuration is settled.

### Phase 2 — Financial workflows
- Code and privilege review is complete for verified-deposit credit, Telegram withdrawal decisions, admin dashboard totals, and cycle settlement; the remaining task is live TESTNET_DEMO state-transition verification.
- Cycle settlement cron is active every minute and `settle_due_cycles()` is not executable by anon/authenticated roles.
- TESTNET_DEMO is still enforced with live deposits and real payouts disabled.
- Automatic `monitor-deposits` scheduling remains blocked until its server-side cron authentication secret is securely configured; no live monitoring was enabled during this session.

1. Validate deposit evidence submission and review.
2. Validate deposit verification/monitoring and ledger crediting in TESTNET_DEMO.
3. Validate withdrawal request -> dual approval -> payout recovery flow in TESTNET_DEMO.
4. Validate referral and exact Shop task-set settlement calculations.


### Phase 3 — Complete (controlled production-readiness layer)
- Added an explicit PRE_PRODUCTION configuration with a fail-closed payout lock.
- Added Master Admin-only get_production_readiness() diagnostics with no secret values exposed.
- Master Admin Settings shows production environment, network, live-deposit state, real-payout state, go-live approval and payout lock.
- Mainnet payout execution now enforces the Phase 3 production gate server-side; testnet payout behavior remains unchanged.
- Production go-live remains intentionally disabled until the required server-side secrets, monitoring, operator approval and final end-to-end smoke tests are completed.

### Phase 3 — Production configuration
1. Replace TESTNET_DEMO configuration only after security gates pass.
2. Configure production TRON/USDT receiving address and payout secrets server-side.
3. Keep real payouts disabled until operator configuration and final smoke tests pass.
4. Enable live deposits/payouts only after explicit production go-live approval.

### Phase 4 — Shop
1. Finalize Shop integration experience inside AegisPay.
2. Finish real-product image/catalog behavior and review UX.
3. Verify cart, product details and checkout/task ticket behavior against the intended business model.

### Phase 5 — Android
1. Sync canonical web/runtime assets.
2. Validate client and admin Android flavors.
3. Build and test APK/AAB.
4. Finalize release configuration.

### Phase 6 — Final production QA
1. Mobile and desktop regression testing.
2. Auth/session/logout/reset testing.
3. Admin authorization testing.
4. Financial edge-case testing.
5. Performance/security advisor re-check.
6. Final deployment and release checklist.
