-- Portable DuckDB/PostgreSQL SQL. Load raw_* and point_scale first.
CREATE TABLE dim_country (
 country_code VARCHAR(3) PRIMARY KEY, country_name VARCHAR NOT NULL, display_name VARCHAR NOT NULL
);
INSERT INTO dim_country
SELECT country_code, country_name, CASE country_name
 WHEN 'Netherlands, Kingdom of the' THEN 'Netherlands'
 WHEN 'United Kingdom of Great Britain and Northern Ireland' THEN 'United Kingdom'
 WHEN 'United States of America' THEN 'United States'
 ELSE country_name END FROM raw_country;
CREATE TABLE dim_team (
 team_name VARCHAR PRIMARY KEY, team_country VARCHAR(3) REFERENCES dim_country(country_code),
 team_country_name VARCHAR NOT NULL
);
INSERT INTO dim_team
SELECT t.team_name,t.team_country,c.display_name FROM raw_team t
JOIN dim_country c ON c.country_code=t.team_country;
CREATE TABLE dim_rider (
 bib_number INTEGER PRIMARY KEY, rider_name VARCHAR NOT NULL, dob DATE NOT NULL,
 age_at_start INTEGER NOT NULL, team_name VARCHAR REFERENCES dim_team(team_name),
 rider_country VARCHAR(3) REFERENCES dim_country(country_code), team_country VARCHAR(3),
 finished_race BOOLEAN NOT NULL, exit_stage INTEGER, exit_reason VARCHAR
);
INSERT INTO dim_rider
SELECT r.bib_number,r.rider_name,CAST(r.dob AS DATE),
 2025-CAST(EXTRACT(YEAR FROM CAST(r.dob AS DATE)) AS INTEGER)
 - CASE WHEN EXTRACT(MONTH FROM CAST(r.dob AS DATE))>7 OR
 (EXTRACT(MONTH FROM CAST(r.dob AS DATE))=7 AND EXTRACT(DAY FROM CAST(r.dob AS DATE))>5) THEN 1 ELSE 0 END,
 r.rider_team,r.rider_country,t.team_country,
 (SELECT COUNT(*) FROM raw_result f WHERE f.bib_number=r.bib_number)=21,
 e.exit_stage,e.reason
FROM raw_rider r JOIN dim_team t ON t.team_name=r.rider_team
LEFT JOIN raw_exit e ON e.bib_number=r.bib_number;
CREATE TABLE dim_stage (
 stage_id INTEGER PRIMARY KEY, date DATE NOT NULL, distance_km DOUBLE PRECISION NOT NULL,
 type VARCHAR NOT NULL, start_location VARCHAR NOT NULL, finish_location VARCHAR NOT NULL,
 is_loop BOOLEAN NOT NULL
);
INSERT INTO dim_stage SELECT stage_id,CAST(date AS DATE),distance,type,start_location,finish_location,
 start_location=finish_location FROM raw_stage;
CREATE TABLE fact_results (
 bib_number INTEGER REFERENCES dim_rider(bib_number), stage_id INTEGER REFERENCES dim_stage(stage_id),
 team_name VARCHAR REFERENCES dim_team(team_name), rider_country VARCHAR(3) REFERENCES dim_country(country_code),
 finish_time INTEGER NOT NULL, rank INTEGER NOT NULL CHECK(rank>=1), time_bonus INTEGER NOT NULL,
 time_penalty INTEGER NOT NULL, adjusted_time INTEGER NOT NULL, gap_to_winner INTEGER NOT NULL,
 is_winner INTEGER NOT NULL, is_podium INTEGER NOT NULL, is_top10 INTEGER NOT NULL, points_proxy INTEGER NOT NULL,
 PRIMARY KEY(bib_number,stage_id)
);
INSERT INTO fact_results
SELECT f.bib_number,f.stage_id,r.team_name,r.rider_country,f.finish_time,f.rank,f.time_bonus,f.time_penalty,
 f.finish_time-f.time_bonus+f.time_penalty,f.finish_time-w.finish_time,
 CASE WHEN f.rank=1 THEN 1 ELSE 0 END,CASE WHEN f.rank<=3 THEN 1 ELSE 0 END,
 CASE WHEN f.rank<=10 THEN 1 ELSE 0 END,COALESCE(p.points,0)
FROM raw_result f JOIN dim_rider r ON r.bib_number=f.bib_number
JOIN dim_stage s ON s.stage_id=f.stage_id JOIN raw_result w ON w.stage_id=f.stage_id AND w.rank=1
LEFT JOIN point_scale p ON p.type=s.type AND p.rank=f.rank;
