-- Enable cron and net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cron job to process contract recurrences daily at 2 AM
SELECT cron.schedule(
  'process-contract-recurrences-daily',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://zpskukvdzlurrbqlgtuu.supabase.co/functions/v1/process-contract-recurrences',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwc2t1a3Zkemx1cnJicWxndHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNjY4ODcsImV4cCI6MjA3MDg0Mjg4N30.g0AcsB-0_uY55uoJz5zvkegC86PnAYxTPuUJy9MkID4"}'::jsonb,
        body:=concat('{"target_month": "', date_trunc('month', now())::date, '"}')::jsonb
    ) as request_id;
  $$
);