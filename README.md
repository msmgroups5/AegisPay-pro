# AegisPay — Operatable Application Foundation

AegisPay client and Master Admin portals connected to Supabase Auth, private evidence storage, and role-checked financial workflows.

## Included UI
- Supabase Auth client signup, email verification, sign-in, password recovery, and profile claim
- Device-language detection and an English / Urdu choice
- Client deposit screenshot submission, review status, balance, KYC, and withdrawal flows
- Private owner-scoped deposit and identity image storage
- Separate Master Admin portal with protected review queues
- Separate Android Client and Master Admin app variants
- USER, ADMIN and MASTER ADMIN roles
- Operations Dashboard
- Balance, referral, task and withdrawal metrics
- Liquidity & Reserve Dashboard with gauge, reserves/liabilities, timestamp, data source and audit status
- Global activity stream
- Multi-tier referral dashboard and referral tree
- Task cards, progress, rewards and completion workflow
- AI Strategy Assistant with suggested questions and informational disclaimer
- Withdrawal request form, validation, risk score and history
- Master Admin Approval Center
- Conceptual Telegram approval payload preview
- Notifications
- Profile
- Admin Dashboard
- User Management
- Task Management
- Referral Management
- Audit Logs
- Settings
- System Operations
- Search and pagination on administrative tables
- Responsive desktop/tablet/mobile navigation
- Offline service-worker shell for served web deployments
- Footer and visible platform/data-only status messaging

## Repository layers
- Client portal: index.html + styles.css + client-auth.js
- Master Admin portal: master-admin.html + admin-auth.js
- Legacy prototype components: app.js + aegis-core.js (not loaded by either live portal)
- Demo REST API: backend/server.js
- Demo API data: backend/data.json
- PostgreSQL schema with pgcrypto: database/schema.sql (node domain removed)
- Supabase production integration notes: supabase/README.md
- Production environment template: .env.example
- Production readiness checklist: docs/PRODUCTION_READINESS.md
- Repository validation: scripts/validate-static.js
- API smoke tests: scripts/smoke-api.js
- CI: .github/workflows/ci.yml
- GitHub Pages-ready packaging workflow: .github/workflows/pages.yml
- Netlify static deployment configuration: netlify.toml
- Offline service worker: service-worker.js
- Repository secret/build ignores: .gitignore

## Client access

Client signup creates only a USER profile. Supabase email verification must be completed before the account can sign in. Master Admin access requires a separately provisioned Supabase Auth account with a server-authorized MASTER ADMIN profile; the repository contains no shared/default administrator password.

## Run locally

UI only:
Open index.html directly in a browser.

API demo:
node backend/server.js

Repository checks:
npm run check

## Mobile web
When served from HTTPS or localhost, the service worker caches the application shell for offline reloads. The standalone offline HTML artifact remains available for direct browser inspection.

## Netlify
The AegisPay Netlify project is aegispay-pro and currently has a ready HTTPS deployment at https://aegispay-pro.netlify.app.

The latest environment audit found no Netlify environment variables configured. The Supabase URL and publishable key in supabase-client.js are public browser settings; service-role credentials and payout private keys must remain in Supabase Function secrets.

The client portal reads balances and histories from Supabase. Deposits require a private screenshot, AI evidence precheck, and confirmed TRON transfer before credit. Withdrawals require verified KYC. Identity review uses an OpenAI-compatible vision endpoint configured only with server-side Supabase Function secrets; until those are set, submitted cases remain in manual review and balances are not credited automatically.

## GitHub Pages
The repository has a manual Pages-ready packaging workflow. The current GitHub connection can run CI and commit code, but the Pages site itself still requires repository Pages enablement with the necessary owner/admin-level repository access.

## Production boundary
The old REST demo remains separate from the connected Supabase application. The payout Edge Function is guarded by explicit MAINNET mode and payout settings and still requires a privately configured key. Deposit verification supports TRON testnet and mainnet configuration; the current project remains in test mode and needs a real test receiving address before a deposit can be credited.
