-- Prevent client-side callers from bypassing the per-task purchase and completion workflow.
REVOKE EXECUTE ON FUNCTION public.complete_shop_cycle_checkout(uuid,uuid,uuid[]) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.complete_shop_cycle_checkout(uuid,uuid,uuid[]) TO service_role;
