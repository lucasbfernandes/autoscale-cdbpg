CREATE TABLE public.worker_count(
  id bigserial PRIMARY KEY,
  created_at timestamp with time zone NOT NULL,
  count bigint
);

--

SELECT cron.schedule(
    'worker-count',
    '5 seconds',
    $$
        INSERT INTO worker_count(created_at, count)
        SELECT 
            now(),
            (select
                count(*) as worker_count
            from
                pg_dist_node
            where
                nodename ilike 'private-w%' limit 1);
    $$
); 
