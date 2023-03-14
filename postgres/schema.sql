CREATE SCHEMA public;

CREATE TABLE public.companies (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.campaigns (
  id bigserial,
  company_id bigint REFERENCES public.companies (id),
  name text NOT NULL,
  cost_model text NOT NULL,
  state text NOT NULL,
  monthly_budget bigint,
  blacklisted_site_urls text[],
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  PRIMARY KEY (company_id, id)
);

CREATE TABLE public.ads (
  id bigserial,
  company_id bigint,
  campaign_id bigint,
  name text NOT NULL,
  image_url text,
  target_url text,
  impressions_count bigint DEFAULT 0,
  clicks_count bigint DEFAULT 0,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  PRIMARY KEY (company_id, id),
  FOREIGN KEY (company_id, campaign_id)
    REFERENCES public.campaigns (company_id, id)
);

CREATE TABLE public.clicks (
  id bigserial,
  company_id bigint,
  ad_id bigint,
  clicked_at timestamp with time zone NOT NULL,
  site_url text NOT NULL,
  cost_per_click_usd numeric(20,10),
  user_ip inet NOT NULL,
  user_data jsonb NOT NULL,
  PRIMARY KEY (company_id, id)
);

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

--

SELECT create_distributed_table('public.companies', 'id');
SELECT create_distributed_table('public.campaigns', 'company_id');
SELECT create_distributed_table('public.ads', 'company_id');
SELECT create_distributed_table('public.clicks', 'company_id');
