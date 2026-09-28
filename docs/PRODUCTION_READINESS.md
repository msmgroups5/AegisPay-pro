# AegisPay Production Readiness

GitHub-side readiness now includes the demo control-center UI, repository checks, PostgreSQL schema, environment template, Netlify configuration, CI, and a production integration plan.

The remaining runtime work requires an active Supabase project, real Auth users, environment secrets, live data wiring, AI credentials, Telegram credentials, hosting/domain setup, security testing, and any applicable compliance review.

No real payment, blockchain, custody, or banking settlement is executed by the current implementation.


## Current scope update
The retired node feature has been removed from the application code, demo data, and database schema. An explicit migration is included for existing databases when the old node table should be removed.
