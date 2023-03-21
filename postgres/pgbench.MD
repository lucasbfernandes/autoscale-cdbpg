<!-- DEMO #1 - Autoscaling -->
`pgbench 'postgres://citus:123test!@c.cituscon-cluster-04.postgres.database.azure.com:5432/citus?sslmode=require' -j 4 -c 16 -f query01.sql -f query02.sql -T 2000 --progress=1`

<!-- DEMO #2 - Tenant isolation -->
`pgbench 'postgres://citus:123test!@c.cituscon-cluster-04.postgres.database.azure.com:5432/citus?sslmode=require' -j 4 -c 24 -f query03.sql -T 2000 --progress=1`
