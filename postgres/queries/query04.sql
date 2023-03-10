BEGIN;
    SELECT
        co.name as company_name,
        co.id as company_id,
        count(*) as click_count
    FROM
        public.companies co
    INNER JOIN
        public.clicks cl ON co.id = cl.company_id
    WHERE
        cl.clicked_at > now() - '5 days'::interval

    GROUP BY 1, 2
    ORDER BY 3 DESC;
END;