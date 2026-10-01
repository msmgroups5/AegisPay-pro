# AegisPay Production Handoff

## Current technical baseline

- Repository: `msmgroups5/AegisPay-pro`
- Supabase project: `wtcspnrmsoisroavojop`
- Netlify site: `aegispay-client1`
- Production version baseline: Android versionCode 21 / versionName 2.1.0
- Client entry: `/app/`
- Public website: `/`
- Client APK path: `/downloads/aegispay-client.apk`
- Update manifest: `/app-version.json`

## Completed by engineering

- Remote-first Android WebView shell with offline bundled fallback.
- In-app native update detection, HTTPS download, SHA-256 verification and Android installer hand-off.
- Client and Master Admin portal split.
- Premium public AegisPay website with direct Client APK distribution flow.
- “SINCE 2023 — 2026” branding in the public site and application portals.
- Server-side Shop cycle creation after verified deposits.
- Controlled task completion with runtime/account-state guards.
- Referral, notification and secure AI support flows.
- Master Admin users, balance adjustment, Shop, settings, referrals and audit views.
- Legacy 3-argument withdrawal RPC disabled for API/client roles.
- Withdrawal and Shop task operations now respect app runtime and active-account gates.
- CI validation and Android build workflows.
- Production website workflow is intentionally blocked unless release-signing secrets exist.

## Required production configuration

### 1. Supabase Auth URL Configuration

Set the production Site URL to:

`https://aegispay-client1.netlify.app`

Add these exact Redirect URLs:

`https://aegispay-client1.netlify.app/app/auth/callback`

`com.aegispay.app.client://auth/callback`

`com.aegispay.app.admin://auth/callback`

### 2. Supabase Auth security

Enable leaked-password protection in Auth password security settings.

### 3. Master Admin identity

Provision the real Master Admin Auth account and ensure its linked AegisPay profile has role `MASTER ADMIN` and an active status.

Do not create a fake Auth user through SQL.

### 4. AI support

Configure the Supabase Edge Function secrets/variables:

- `AI_REVIEW_ENDPOINT`
- `AI_REVIEW_API_KEY`
- `AI_REVIEW_MODEL`

The function is intentionally informational only and must not approve or execute financial actions.

### 5. Telegram withdrawal approval

Configure the Telegram bot secret/configuration and authorized numeric approver IDs.

Use the existing withdrawal approval design: panel decision + Telegram decision before payout.

### 6. Testnet payout

Configure a controlled Shasta payout wallet and server-side:

- `TRON_TESTNET_PAYOUT_PRIVATE_KEY`

Keep the private key server-side only. Fund only the required test amount.

### 7. Android production signing

Add GitHub Actions repository secrets:

- `AEGIS_RELEASE_KEYSTORE_B64`
- `AEGIS_RELEASE_STORE_PASSWORD`
- `AEGIS_RELEASE_KEY_ALIAS`
- `AEGIS_RELEASE_KEY_PASSWORD`

Use the existing production signing key for the installed AegisPay app. Future APK updates must keep the same signing identity.

### 8. Netlify production deployment

Add the GitHub Actions secret:

- `NETLIFY_AUTH_TOKEN`

The production workflow already knows the existing site ID:

`0aa38615-c9e6-4129-bc08-cd28739606d0`

The workflow refuses to publish debug APKs as production downloads.

## Physical verification order

1. Open the public website on desktop and Android.
2. Download the Client APK from the website.
3. Install the Client APK.
4. Verify email confirmation returns to `/app/auth/callback`.
5. Log in and verify dashboard/Shop/referrals/notifications.
6. Submit a controlled test deposit and verify Admin review.
7. Verify the server-side Shop cycle and task completion flow.
8. Verify the 18-hour settlement state.
9. Complete KYC test flow.
10. Link a controlled Shasta test wallet.
11. Create a test withdrawal and verify dual approval.
12. Verify testnet payout reconciliation.
13. Push a harmless UI change to `main`.
14. Reopen/reconnect the installed Client and verify the remote UI changed without downloading a new APK.
15. Increase Android versionCode/versionName, publish a signed release, and verify the installed APK detects/downloads/verifies the new APK and opens Android's installer flow.

## Do not treat the app as real-market production until

- Production signing is configured.
- Auth redirect configuration is verified on a real device.
- Master Admin identity is verified.
- Telegram approval delivery is verified.
- Testnet payout is verified end-to-end.
- AI provider configuration is verified.
- Website direct APK download is verified.
- Remote UI update is verified on an installed device.
- No unresolved critical CI/build errors remain.
