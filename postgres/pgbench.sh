pgbench 'postgres://citus:<password>@c.dev-cluster02.postgres.database.azure.com:5432/citus?sslmode=require' -j 32 -c 128 -f query01.sql -f query02.sql -f query03.sql -f query04.sql -T 600