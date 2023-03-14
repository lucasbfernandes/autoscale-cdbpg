-- Panel

WITH companies_shards_clicks AS (
    SELECT   
        DISTINCT cp.id as company_id,
        get_shard_id_for_distribution_column('public.clicks', cp.id) as shard_id,
        count(*) click_count
    FROM
        public.companies cp
    INNER JOIN
        public.clicks ck ON cp.id = ck.company_id
    GROUP BY 1
    ORDER BY click_count DESC
),
shards_clicks AS (
    SELECT
        shard_id,
        SUM(click_count) shard_click_count
    FROM 
        companies_shards_clicks
    GROUP BY 1
)
SELECT
    company_id::text,
    csc.shard_id::text,
    csc.click_count,
    (click_count / shard_click_count) * 100 as shard_percentage
FROM
    companies_shards_clicks csc
INNER JOIN
    shards_clicks sc ON csc.shard_id = sc.shard_id
ORDER BY shard_percentage DESC
LIMIT 10;

-- Alert

WITH companies_shards_clicks AS (
    SELECT   
        DISTINCT cp.id as company_id,
        get_shard_id_for_distribution_column('public.clicks', cp.id) as shard_id,
        count(*) click_count
    FROM
        public.companies cp
    INNER JOIN
        public.clicks ck ON cp.id = ck.company_id
    GROUP BY 1
    ORDER BY click_count DESC
),
shards_clicks AS (
    SELECT
        shard_id,
        SUM(click_count) shard_click_count
    FROM 
        companies_shards_clicks
    GROUP BY 1
)
SELECT
    company_id::text,
    csc.shard_id::text,
    (click_count / shard_click_count) * 100 as shard_percentage
FROM
    companies_shards_clicks csc
INNER JOIN
    shards_clicks sc ON csc.shard_id = sc.shard_id
ORDER BY shard_percentage DESC
LIMIT 10;