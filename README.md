# AegisPay — Operatable Application Foundation

This repository contains the GitHub-side implementation foundation for the AegisPay Complete A-to-Z Operatable Application Specification.

Included:
- Authentication screen and role-aware access
- USER / ADMIN / MASTER ADMIN navigation
- Operations dashboard
- Node cards and node detail view
- Liquidity and reserve system-data visualization
- Global node network visualization
- Activity stream
- Task workflow and completion
- Referral dashboard and tree
- AI assistant with informational responses
- Withdrawal request workflow
- Master Admin approval workflow
- Withdrawal history
- User, node, task and referral administration
- Activity and audit records
- Platform settings
- Responsive/mobile layout
- Validation and temporary disabled-action states
- LocalStorage persistence
- GitHub Pages deployment workflow

Operating boundary:
This implementation is intentionally a demo/system-data application. It does not execute real payments, blockchain transfers, USDT transfers, custody operations, or bank transfers. Approval actions update application status and audit records only.

Displayed balances, yields, liquidity figures, referral rewards and risk scores are demonstration/system data and are not an independent financial audit.

Demo credentials:
User: user@aegispay.demo / demo123
Admin: admin@aegispay.demo / demo123
Master Admin: master@aegispay.demo / demo123

Local run:
Open index.html directly in a browser, or serve the repository with a static HTTP server.
Example:
python -m http.server 8080

GitHub Pages:
The workflow at .github/workflows/pages.yml publishes the static app. GitHub Pages may still need to be enabled in repository settings.

Next backend layer:
The current UI can later be connected to a real authenticated backend, persistent database, server-side authorization, AI provider and production deployment environment without changing the core navigation.
