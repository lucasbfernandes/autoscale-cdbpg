INSERT INTO public.companies(
    id, name, image_url, created_at, updated_at
)
SELECT
    nextval('public.companies_id_seq'::regclass),
    'Mock Company ' || generate_series(1, 10000000),
    'http://test-url.com/image',
    date(current_date - floor(random() * 365) * '1 day'::interval),
    now();

INSERT INTO public.campaigns(
    id, company_id, name, cost_model, state, monthly_budget, blacklisted_site_urls, created_at, updated_at
)
SELECT
    nextval('public.campaigns_id_seq'::regclass),
    floor(random() * 10000000 + 1),
    'Campaign #' || generate_series(1, 25000000),
    'Cost Model X',
    CASE
        WHEN (random() > 0.5) THEN 'active'
        ELSE 'finished'
    END,
    round((random() * 10000)::numeric, 1),
    array[]::varchar[],
    date(current_date - floor(random() * 365) * '1 day'::interval),
    now();

--

INSERT INTO public.ads(
    id, company_id, campaign_id, name, image_url, target_url, impressions_count, clicks_count, created_at, updated_at
)
SELECT
    nextval('public.ads_id_seq'::regclass),
    co.id,
    ca.id,
    'Ad ' || ca.id || ' #' || generate_series(1, 3),
    'http://demo-url.com/image',
    'http://demo-url.com/target',
    0,
    0,
    date(current_date - floor(random() * 365) * '1 day'::interval),
    now()
FROM
    public.campaigns ca
INNER JOIN
    public.companies co ON ca.company_id = co.id;