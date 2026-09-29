# AegisPay production readiness

## Delivered in the implementation branch

- Supabase Auth signup/profile creation is constrained to USER for public signup.
- Private evidence storage and server-side deposit, KYC, and withdrawal gates are implemented as an additive migration and Supabase Edge Functions.
- All six formerly unlinked application profiles are anonymized and marked DELETED, preserving their connected audit, withdrawal, referral, notification, and task rows.
- The additive signup/KYC, network-aware credit, and RLS/index migrations have been applied to the connected Supabase project.
- The deposit, KYC, admin-review, chain-verification, monitor, and payout Edge Functions have been deployed and are ACTIVE.
- The connected database is in TESTNET_DEMO mode and cannot issue real payouts. Deposit-credit metadata records the network and token contract used for verification.
- Deposit balance credits require an approved screenshot review and a confirmed matching TRON transfer.
- KYC must reach VERIFIED before the authenticated withdrawal RPC accepts a request.
- Mainnet payouts require explicit MAINNET settings and a server-held payout key. No transfer was initiated in this work.
- Client and Master Admin Android flavors are configured as separate APK artifacts.

## Required before live use

- Verify Supabase Auth email confirmation, SMTP delivery, and allowed redirect URLs; then create a new Auth account and set its profile role to MASTER ADMIN through a project-owner-controlled operation. Do not use a shared default password.
- Set AI_REVIEW_ENDPOINT, AI_REVIEW_API_KEY, and AI_REVIEW_MODEL as Supabase Function secrets. Only use a provider approved to process identity images. No document image or customer record was sent to an AI provider during implementation.
- Configure and verify a TRON testnet receiving wallet address and test tokens. Mainnet remains disabled.
- Recheck Supabase advisors after application traffic; authenticated SECURITY DEFINER RPC warnings remain for functions that check the caller's account/role, and low-traffic unused-index notices are informational.
- Resolve the Netlify private-repository deploy-preview contributor gate before deploying the branch.

## Operational notes

AI review checks image readability and visible matching fields, and ambiguous submissions go to the Master Admin queue. It does not validate government databases or prove that an ID is genuine. Withdrawals remain blocked unless the stored KYC state is VERIFIED.
