-- Panel

SELECT 
    pd.nodename,
    count(*) as shard_count,
    pg_size_pretty(sum(shard_size)) disk_usage
FROM
    pg_dist_node pd
LEFT JOIN
    citus_shards cs ON pd.nodename = cs.nodename
GROUP BY 1;