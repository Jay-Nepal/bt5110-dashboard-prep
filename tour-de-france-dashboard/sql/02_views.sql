-- All business metrics are SQL; views preserve full-race ranks before display filters.
CREATE VIEW v_results AS
SELECT f.*,r.rider_name,r.dob,r.age_at_start,r.team_country,r.finished_race,
 s.date,s.distance_km,s.type,s.start_location,s.finish_location,
 c.display_name AS nation_name,t.team_country_name
FROM fact_results f JOIN dim_rider r USING(bib_number)
JOIN dim_stage s USING(stage_id) JOIN dim_country c ON c.country_code=f.rider_country
JOIN dim_team t ON t.team_name=f.team_name;
CREATE VIEW v_gc_progress AS
WITH totals AS (
 SELECT bib_number,stage_id,
 SUM(adjusted_time) OVER (PARTITION BY bib_number ORDER BY stage_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total_time,
 COUNT(*) OVER (PARTITION BY bib_number ORDER BY stage_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS stages_ridden
 FROM fact_results
), eligible AS (SELECT * FROM totals WHERE stages_ridden=stage_id)
SELECT *,RANK() OVER(PARTITION BY stage_id ORDER BY total_time) AS gc_rank,
 total_time-MIN(total_time) OVER(PARTITION BY stage_id) AS gap,
 COUNT(*) OVER(PARTITION BY stage_id,total_time) AS tie_count
FROM eligible;
CREATE VIEW v_final_gc AS SELECT g.*,r.rider_name,r.team_name,r.rider_country,r.dob
FROM v_gc_progress g JOIN dim_rider r USING(bib_number) WHERE g.stage_id=21;
CREATE VIEW v_points AS
WITH p AS (SELECT bib_number,SUM(points_proxy) AS points FROM fact_results GROUP BY bib_number)
SELECT p.*,RANK() OVER(ORDER BY points DESC,COALESCE(g.gc_rank,99999)) AS points_rank
FROM p LEFT JOIN v_final_gc g USING(bib_number);
CREATE VIEW v_kom AS
WITH k AS (SELECT f.bib_number,SUM(f.adjusted_time) AS total_time,COUNT(*) AS stages_ridden,
 SUM(f.is_podium) AS podiums,AVG(CAST(f.gap_to_winner AS DOUBLE PRECISION)) AS mean_gap
 FROM fact_results f JOIN dim_stage s USING(stage_id) WHERE s.type='mountain' GROUP BY f.bib_number
 HAVING COUNT(*)=(SELECT COUNT(*) FROM dim_stage WHERE type='mountain'))
SELECT *,RANK() OVER(ORDER BY total_time) AS kom_rank,total_time-MIN(total_time) OVER() AS gap FROM k;
CREATE VIEW v_young AS
SELECT *,RANK() OVER(ORDER BY total_time) AS young_rank FROM v_final_gc WHERE dob>CAST('1999-07-05' AS DATE);
CREATE VIEW v_young_calendar AS
SELECT *,RANK() OVER(ORDER BY total_time) AS young_rank FROM v_final_gc WHERE dob>=CAST('2000-01-01' AS DATE);
CREATE VIEW v_team_contributions AS
SELECT *,ROW_NUMBER() OVER(PARTITION BY team_name,stage_id ORDER BY finish_time,bib_number) AS team_slot
FROM fact_results;
CREATE VIEW v_team_stages AS
SELECT team_name,stage_id,SUM(finish_time) AS team_time,COUNT(*) AS riders_counted
FROM v_team_contributions WHERE team_slot<=3 GROUP BY team_name,stage_id HAVING COUNT(*)=3;
CREATE VIEW v_team_classification AS
WITH t AS (SELECT team_name,SUM(team_time) AS total_time FROM v_team_stages
 GROUP BY team_name HAVING COUNT(*)=21)
SELECT *,RANK() OVER(ORDER BY total_time) AS team_rank,total_time-MIN(total_time) OVER() AS gap FROM t;
CREATE VIEW v_team_final_three AS
WITH r AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY team_name ORDER BY total_time,bib_number) AS team_slot FROM v_final_gc),
 t AS (SELECT team_name,SUM(total_time) AS total_time FROM r WHERE team_slot<=3 GROUP BY team_name HAVING COUNT(*)=3)
SELECT *,RANK() OVER(ORDER BY total_time) AS team_rank,total_time-MIN(total_time) OVER() AS gap FROM t;
-- Portable median using the middle one/two ordered rows, including even-sized groups.
CREATE VIEW v_top10_benchmark AS
WITH ordered AS (
 SELECT f.stage_id,f.adjusted_time,
 ROW_NUMBER() OVER(PARTITION BY f.stage_id ORDER BY f.adjusted_time,f.bib_number) AS rn,
 COUNT(*) OVER(PARTITION BY f.stage_id) AS n
 FROM fact_results f JOIN v_final_gc g USING(bib_number) WHERE g.gc_rank<=10)
SELECT stage_id,AVG(CAST(adjusted_time AS DOUBLE PRECISION)) AS median_time
FROM ordered WHERE rn IN (FLOOR((n+1)/2.0),FLOOR((n+2)/2.0)) GROUP BY stage_id;
CREATE VIEW v_pivotal AS
WITH d AS (SELECT f.bib_number,f.stage_id,f.adjusted_time-b.median_time AS delta,
 ROW_NUMBER() OVER(PARTITION BY f.bib_number ORDER BY ABS(f.adjusted_time-b.median_time) DESC,f.stage_id) AS importance
 FROM fact_results f JOIN v_top10_benchmark b USING(stage_id)) SELECT * FROM d;
CREATE VIEW v_speed_rider AS
SELECT f.bib_number,s.type,SUM(s.distance_km)*3600.0/NULLIF(SUM(f.finish_time),0) AS speed,
 SUM(s.distance_km) AS distance_km,SUM(f.finish_time) AS finish_time,COUNT(*) AS stages_ridden
FROM fact_results f JOIN dim_stage s USING(stage_id) GROUP BY f.bib_number,s.type;
CREATE VIEW v_speed_medians AS
WITH o AS (SELECT s.*,ROW_NUMBER() OVER(PARTITION BY type ORDER BY speed,bib_number) AS rn,
 COUNT(*) OVER(PARTITION BY type) AS n FROM v_speed_rider s JOIN dim_rider r USING(bib_number) WHERE r.finished_race)
SELECT type,AVG(speed) AS median_speed FROM o WHERE rn IN(FLOOR((n+1)/2.0),FLOOR((n+2)/2.0)) GROUP BY type;
CREATE VIEW v_speed_index AS SELECT s.*,s.speed/m.median_speed AS terrain_index
FROM v_speed_rider s JOIN v_speed_medians m USING(type);
CREATE VIEW v_national_outcomes AS
WITH outcomes AS (SELECT rider_country,SUM(is_winner) AS wins,SUM(is_podium) AS podiums FROM fact_results GROUP BY rider_country),
 gc AS (SELECT rider_country,MIN(gc_rank) AS best_gc_rank FROM v_final_gc GROUP BY rider_country)
SELECT c.country_code,c.display_name,g.best_gc_rank,COALESCE(o.wins,0) AS wins,COALESCE(o.podiums,0) AS podiums
FROM dim_country c LEFT JOIN outcomes o ON o.rider_country=c.country_code LEFT JOIN gc g ON g.rider_country=c.country_code;
CREATE VIEW v_participation AS
SELECT c.country_code,c.display_name,
 (SELECT COUNT(*) FROM dim_rider r WHERE r.rider_country=c.country_code) AS riders,
 (SELECT COUNT(*) FROM dim_team t WHERE t.team_country=c.country_code) AS teams
FROM dim_country c;
-- Demonstrates native ROLLUP for Task 4; the interactive explorer builds further ROLLUPs.
CREATE VIEW v_nation_team_rollup AS
SELECT rider_country,team_name,SUM(adjusted_time) AS total_time,COUNT(*) AS stage_results,
 GROUPING(rider_country) AS nation_total,GROUPING(team_name) AS team_total
FROM fact_results GROUP BY ROLLUP(rider_country,team_name);
