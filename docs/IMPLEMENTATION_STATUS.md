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
- The old demo login identities and displayed demo credentials have been removed from the client and admin entry points. All six unlinked live profile rows are now anonymized and marked DELETED; linked withdrawal, referral, task, notification, and audit history remains intact.
- Three additive migrations are live: public USER signup and private KYC/evidence controls; network-aware deposit credit; and explicit authenticated read policies plus foreign-key indexes.
- Seven Edge Functions are deployed and ACTIVE: submit-deposit, submit-kyc, admin-queues, admin-review, verify-deposit, monitor-deposits, and execute-payout. Payout approval is blocked in test mode and the admin approval flow calls the payout function only when live settings permit it.
- The live Supabase mode is TESTNET_DEMO, real payouts are disabled, and deposit verification is pinned to the TRON test network.

## Runtime configuration still required

- Supabase Auth email confirmation, allowed redirect URLs, and outbound email delivery must be verified in project settings.
- A new Supabase Auth Master Admin identity must be created and its profile role set by the project owner. The old seed Master Admin row was anonymized with the other five; no shared password is embedded or generated.
- AI_REVIEW_ENDPOINT, AI_REVIEW_API_KEY, and AI_REVIEW_MODEL must be configured as Supabase Edge Function secrets. Until then, deposits and KYC remain pending/manual review; balances are never credited by AI alone.
- The project needs a verified TRON testnet receiving wallet and test tokens to complete an end-to-end chain test. No real deposit or payout has been sent.
- Language auto-selection and translations currently cover English and Urdu; other locales fall back to English and need translated copy before broader language coverage.
- Netlify deploy-preview status must be checked on the updated pull request. The prior attempt was blocked because the repository contributor was unverified in Netlify.
- GitHub Actions must finish the updated repository checks and two Android APK builds before the APKs are ready to install.

## Verification

Local verification passed: JavaScript syntax checks, core Auth/RBAC tests, Supabase service tests, static repository validation, API smoke tests, and manifest JSON validation. The live database migration and function deployments succeeded. GitHub Actions still needs to build the final commit's Android artifacts. No live-chain transfer or payout was used as a test.
