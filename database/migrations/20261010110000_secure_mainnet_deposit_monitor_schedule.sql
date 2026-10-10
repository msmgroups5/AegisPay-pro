-- Keep the monitor token encrypted in Vault. It is never committed to source or
-- returned to the caller that applies this migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets
    WHERE name = 'aegispay_monitor_deposit_cron'
  ) THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'aegispay_monitor_deposit_cron',
      'Private caller token for the scheduled AegisPay deposit monitor'
    );
  END IF;
END;
$$;

-- The Edge Function calls this only with its service-role client. The RPC is
-- inaccessible to anon/authenticated roles, and the token itself stays in Vault.
CREATE OR REPLACE FUNCTION public.verify_deposit_monitor_cron_secret(p_token text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_token IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'aegispay_monitor_deposit_cron'
        AND decrypted_secret = p_token
    );
$$;

REVOKE ALL ON FUNCTION public.verify_deposit_monitor_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_deposit_monitor_cron_secret(text) TO service_role;

-- Run the already-deployed, custom-authenticated Edge Function once a minute.
SELECT cron.schedule(
  'aegispay-mainnet-deposit-monitor',
  '* * * * *',
  $job$
    SELECT net.http_post(
      url := 'https://wtcspnrmsoisroavojop.supabase.co/functions/v1/monitor-deposits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-aegis-cron-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'aegispay_monitor_deposit_cron'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);
