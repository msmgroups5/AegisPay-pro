# AegisPay — Operatable Application Foundation

A professional, responsive AegisPay demo/system-data application built from the Complete A-to-Z Master Application Specification.

## Included UI
- Professional login and role-aware access
- USER, ADMIN and MASTER ADMIN roles
- Operations Dashboard
- Current balance, active nodes, total yield, referrals, tasks and withdrawals metrics
- Liquidity & Reserve Dashboard with gauge, reserve/liability data, timestamp, data-source and audit status
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
- Search and pagination for administrative tables
- Responsive desktop/tablet/mobile navigation
- Footer and visible platform/data-only status messaging

## Repository layers
- Browser UI: index.html + styles.css + app.js
- Demo REST API: backend/server.js
- Demo API data: backend/data.json
- PostgreSQL schema: database/schema.sql
- Repository validation: scripts/validate-static.js
- API smoke tests: scripts/smoke-api.js
- CI: .github/workflows/ci.yml
- GitHub Pages: .github/workflows/pages.yml
- Netlify static deployment configuration: netlify.toml
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

## Production boundary
This repository is a demonstration/system-data layer. It does not execute real payments, blockchain transfers, custody, banking transfers or live settlement. Approval actions update application status and audit records only.

Displayed balances, yields, liquidity figures, rewards and risk scores are demonstration/system data and are not an independent financial audit.

A production deployment still requires separately configured database/authentication infrastructure, server-side authorization, secrets/environment variables, external AI credentials if used, domain/hosting configuration, security testing, monitoring and any applicable compliance/legal work.
