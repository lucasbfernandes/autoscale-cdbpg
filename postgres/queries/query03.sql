\set company_id random(1, 2000)
\set ad_id random(1, 75000000)
BEGIN;
    INSERT INTO public.clicks(
        id, company_id, ad_id, clicked_at, site_url, cost_per_click_usd, user_ip, user_data
    )
    VALUES ( 
        nextval('public.clicks_id_seq'::regclass),
        :company_id,
        :ad_id,
        date(current_date - floor(random() * 365) * '1 day'::interval),
        'http://test.com/mock',
        round((random() * 10)::numeric, 1),
        CASE
            WHEN (random() > 0.5) THEN '191.85.109.179'::inet
            ELSE '213.11.150.45'::inet
        END,
        CASE
            WHEN (random() > 0.5) THEN '{"location": "TEST", "is_mobile": true}'::jsonb
            ELSE '{"location": "TEST", "is_mobile": false}'::jsonb
        END
    );
END;