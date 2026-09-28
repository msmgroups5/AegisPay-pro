# Supabase production layer

The repository contains the PostgreSQL data model and a production integration plan.

Before production, the Supabase project must be active and intentionally selected. Then configure Auth, map approved Auth users to application user profiles, enable row-level security policies, and keep service-role secrets server-side.

The current repository does not execute real payments, blockchain transfers, custody, or banking settlement.

See .env.example and docs/PRODUCTION_READINESS.md for the deployment requirements.

The retired node domain is no longer part of the AegisPay application schema. See database/migrations/20260928_remove_nodes.sql for the optional existing-database cleanup migration.
