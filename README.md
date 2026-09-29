# AegisPay — Operatable Application Foundation

A professional, responsive AegisPay demo/system-data application built from the Complete A-to-Z Master Application Specification.

## Included UI
- Invitation-only Supabase Auth and approved-profile sign-in in the client portal
- Separate legacy Master Admin demonstration portal
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
- Master Admin demonstration portal: master-admin.html + app.js + aegis-core.js
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

The client portal is invitation-only. Public signup is disabled; a user must have an approved Supabase Auth identity and a matching AegisPay profile. Legacy local demo credentials do not sign in to the client portal.

## Legacy local demo accounts

These credentials are only for the legacy local demo and test harness; they do not grant Supabase client access.

USER: user@aegispay.demo / AP10023  
ADMIN: admin@aegispay.demo / APADMIN  
MASTER ADMIN: master@aegispay.demo / APMASTER

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

The client entry now uses Supabase Auth and the approved-profile claim RPC. It shows the verified identity/profile only; balances and transaction controls remain unavailable until their reads and writes are connected to Supabase. The separate Master Admin demonstration portal and its core still use local demo state.

## GitHub Pages
The repository has a manual Pages-ready packaging workflow. The current GitHub connection can run CI and commit code, but the Pages site itself still requires repository Pages enablement with the necessary owner/admin-level repository access.

## Production boundary
The browser UI and demo REST API remain demonstration/system-data layers. A separate active Supabase Edge Function, execute-payout, targets TRON mainnet USDT and can move real funds when its payout private key is configured. The connected service read tools do not expose whether that secret is present, and the current UI does not call this function. Treat the function as a live money-movement path.

The displayed balances, yields, liquidity figures, rewards and risk scores remain demonstration data. No banking settlement or custody service is connected.
