-- The client uses complete_shop_task, which enforces confirmed purchase and balance checks.
-- Retire the legacy RPC from client roles because it bypasses that workflow.
REVOKE EXECUTE ON FUNCTION public.complete_task(uuid) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.complete_task(uuid) TO service_role;
