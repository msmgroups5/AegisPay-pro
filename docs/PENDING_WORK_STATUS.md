# AegisPay Pending Work Status

Last aligned: 2026-10-05

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

### Started in this work session
- Security hardening of exposed SECURITY DEFINER RPC grants.
- Added and applied migration:
  `database/migrations/20261005_security_rpc_grants_hardening.sql`
- Anonymous execution exposure for `admin_set_withdrawal_wallet` and `link_withdrawal_wallet` was removed.
- Legacy two-argument `link_withdrawal_wallet` was removed from PUBLIC/anon/authenticated API execution.
- Security advisor findings decreased accordingly; remaining authenticated SECURITY DEFINER findings require function-by-function review.
- Leaked-password protection is still disabled and remains a production security gate.
- Master Admin wallet changes were moved from direct RPC execution to the authenticated `admin-account-ops` Edge Function (v2).
- `admin_set_withdrawal_wallet(uuid,text)` EXECUTE was revoked from `authenticated`; direct client RPC access is now blocked.
- Post-change Security Advisor count is 8 authenticated SECURITY DEFINER warnings plus the leaked-password protection warning.
- Authenticated client smoke-check confirmed the current user resolves to app role `USER`, sees only the expected RLS-scoped user row, and can read the Shop catalog/runtime settings.
- Leaked-password protection is deferred by operator decision because it is not available on the current plan; it is not being treated as an active Phase 1 task for now.
- Function-by-function review found the remaining 8 authenticated SECURITY DEFINER findings are intentionally used by client/admin workflows and have explicit role/authentication gates; no unauthenticated execution was retained for those reviewed functions.
- RPC/RLS privilege smoke-check confirmed: anonymous users cannot select client users or execute protected RPCs; authenticated users cannot directly insert into deposit/KYC/withdrawal tables; client task/withdrawal/profile helper RPCs remain available only to authenticated users.
- Controlled Master Admin session check resolved the actor as MASTER ADMIN with admin-scoped row visibility. The operational queues are currently empty, so live KYC/deposit/withdrawal end-to-end state transitions still require TESTNET_DEMO fixture records or real test submissions before they can be marked passed.

## Pending sequence

### Phase 1 — Production-safe application foundation
1. Finish SECURITY DEFINER review function-by-function.
2. Enable Supabase leaked-password protection.
3. Verify RLS and RPC grants against each client/admin workflow.
4. Run end-to-end auth, KYC, deposit, withdrawal, referral and task-flow tests in TESTNET_DEMO.
5. Verify Master Admin queue/review/account-operation paths with a controlled admin session.

### Phase 2 — Financial workflows
1. Validate deposit evidence submission and review.
2. Validate deposit verification/monitoring and ledger crediting in TESTNET_DEMO.
3. Validate withdrawal request -> dual approval -> payout recovery flow in TESTNET_DEMO.
4. Validate referral and task settlement calculations.

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
