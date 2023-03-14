\set company_id1 random(1, 2000)
\set company_id2 random(1, 2000)
\set company_id3 random(1, 2000)
BEGIN;
    SELECT
        ads.company_id,
        ads.id,
        count(*)
    FROM
        public.ads ad
    INNER JOIN
        public.campaigns ca ON ad.campaign_id = ca.id AND ad.company_id = ca.company_id
    WHERE
        ads.company_id IN (
            :company_id1,
            :company_id2,
            :company_id3
        )
    GROUP BY
        1, 2;
END;