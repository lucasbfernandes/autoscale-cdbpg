-- Panel

SELECT
    to_timestamp(trunc(extract(epoch from created_at))) as time,
    count as worker_count
FROM
    public.worker_count;

-- Alert

SELECT
    to_timestamp(trunc(extract(epoch from created_at))) as time,
    count as worker_count
FROM
    public.worker_count
WHERE
    created_at > now() - '5m'::interval;