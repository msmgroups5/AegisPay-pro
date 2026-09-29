# AegisPay production readiness

## Delivered in the implementation branch

- Supabase Auth signup/profile creation is constrained to USER for public signup.
- Private evidence storage and server-side deposit, KYC, and withdrawal gates are implemented as an additive migration and Supabase Edge Functions.
- All six formerly unlinked application profiles are anonymized and marked DELETED, preserving their connected audit, withdrawal, referral, notification, and task rows.
- Thirteen migrations have been applied to the connected Supabase project, including the signup referral fix and the global runtime switch.
- All eight operational Edge Functions are deployed and ACTIVE, including Telegram withdrawal alerts; runtime checks stop user operations when the Master Admin switch is OFF.
- The connected database is in TESTNET_DEMO mode and cannot issue real payouts. Deposit-credit metadata records the network and token contract used for verification.
- Deposit balance credits require an approved screenshot review and a confirmed matching TRON transfer.
- KYC must reach VERIFIED before the authenticated withdrawal RPC accepts a request.
- Mainnet payouts require explicit MAINNET settings and a server-held payout key. No transfer was initiated in this work.
- Client and Master Admin Android flavors are configured as separate APK artifacts.
- Master Admin ON/OFF runtime control is stored in Supabase and enforced by RLS, table triggers, and Edge Function checks; the Admin portal remains available only to resume service.
- Signup referral-code generation now uses the PostgreSQL UUID generator. The previous Auth trigger called an unavailable pgcrypto function and rolled back signup.
- The sign-in screen now gives visible progress and credential/email-verification feedback. The connected Auth logs showed signup had rolled back before creating an identity, so users affected by that failure must sign up again after installing the updated app.

## Required before live use

- Verify Supabase Auth email confirmation, SMTP delivery, and allowed redirect URLs; then create a new Auth account and set its profile role to MASTER ADMIN through a project-owner-controlled operation. Do not use a shared default password.
- Set AI_REVIEW_ENDPOINT, AI_REVIEW_API_KEY, and AI_REVIEW_MODEL as Supabase Function secrets. Only use a provider approved to process identity images. No document image or customer record was sent to an AI provider during implementation.
- Configure and verify a TRON testnet receiving wallet address and test tokens. Mainnet remains disabled.
- Recheck Supabase advisors after application traffic; authenticated SECURITY DEFINER RPC warnings remain for functions that check the caller's account/role, and low-traffic unused-index notices are informational.
- Resolve the Netlify private-repository deploy-preview contributor gate before deploying the branch.
- Provision an active Master Admin Auth identity and verify the separate Admin APK can pause and resume the client app.

## Operational notes

AI review checks image readability and visible matching fields, and ambiguous submissions go to the Master Admin queue. It does not validate government databases or prove that an ID is genuine. Withdrawals remain blocked unless the stored KYC state is VERIFIED.
