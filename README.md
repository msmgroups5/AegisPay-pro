# AegisPay — Operatable Application Foundation

A professional, responsive AegisPay demo/system-data application built from the Complete A-to-Z Master Application Specification.

## Included UI
- Professional login and role-aware access
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
- Browser UI: index.html + styles.css + app.js
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

## Demo accounts
USER
user@aegispay.demo / demo123

ADMIN
admin@aegispay.demo / demo123

MASTER ADMIN
master@aegispay.demo / demo123

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

The current browser UI still reads and writes demo state in localStorage. supabase-service.js is loaded, but app.js and aegis-core.js do not yet use it for login or business data.

## GitHub Pages
The repository has a manual Pages-ready packaging workflow. The current GitHub connection can run CI and commit code, but the Pages site itself still requires repository Pages enablement with the necessary owner/admin-level repository access.

## Production boundary
The browser UI and demo REST API remain demonstration/system-data layers. A separate active Supabase Edge Function, execute-payout, targets TRON mainnet USDT and can move real funds when its payout private key is configured. The connected service read tools do not expose whether that secret is present, and the current UI does not call this function. Treat the function as a live money-movement path.

The displayed balances, yields, liquidity figures, rewards and risk scores remain demonstration data. No banking settlement or custody service is connected.
