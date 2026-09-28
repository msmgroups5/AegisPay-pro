# AegisPay — Operatable Application Foundation

A professional, responsive AegisPay demo/system-data application built from the Complete A-to-Z Master Application Specification.

## Included UI
- Professional login and role-aware access
- USER, ADMIN and MASTER ADMIN roles
- Operations Dashboard
- Balance, active node, yield, referral, task and withdrawal metrics
- Liquidity & Reserve Dashboard with gauge, reserves/liabilities, timestamp, data source and audit status
- Global node map
- Global activity heatmap
- Global activity stream
- Hardware/node cards and node detail history
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
- Node Management
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
- PostgreSQL schema with pgcrypto: database/schema.sql
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
The AegisPay Netlify project has been created as `aegispay-pro`. Production Supabase environment variables are configured. The current project URL is `http://aegispay-pro.netlify.app`; a deploy is still required to publish the current repository source to that URL.

## GitHub Pages
The repository has a manual Pages-ready packaging workflow. The current GitHub connection can run CI and commit code, but the Pages site itself still requires repository Pages enablement with the necessary owner/admin-level repository access.

## Production boundary
This repository is a demonstration/system-data layer. It does not execute real payments, blockchain transfers, custody, banking transfers or live settlement. Approval actions update application status and audit records only.

Displayed balances, yields, liquidity figures, rewards and risk scores are demonstration/system data and are not an independent financial audit.

A production deployment still requires separately configured database/authentication infrastructure, server-side authorization, secrets/environment variables, external AI credentials if used, domain/hosting configuration, security testing, monitoring and any applicable compliance/legal work.
