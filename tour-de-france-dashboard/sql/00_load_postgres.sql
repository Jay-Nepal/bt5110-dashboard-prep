-- Run with psql from the repository root, in an EMPTY database/schema.
-- No DuckDB-only read_csv or median functions are used in 01/02.
CREATE TABLE raw_country(country_code VARCHAR,country_name VARCHAR);
CREATE TABLE raw_team(team_name VARCHAR,team_country VARCHAR);
CREATE TABLE raw_rider(bib_number INTEGER,rider_name VARCHAR,dob DATE,rider_team VARCHAR,rider_country VARCHAR);
CREATE TABLE raw_location(location_name VARCHAR,location_country VARCHAR);
CREATE TABLE raw_stage(stage_id INTEGER,date DATE,distance DOUBLE PRECISION,type VARCHAR,start_location VARCHAR,finish_location VARCHAR);
CREATE TABLE raw_result(bib_number INTEGER,stage_id INTEGER,finish_time INTEGER,rank INTEGER,time_bonus INTEGER,time_penalty INTEGER);
CREATE TABLE raw_exit(bib_number INTEGER,exit_stage INTEGER,reason VARCHAR);
CREATE TABLE point_scale(type VARCHAR,rank INTEGER,points INTEGER);
\copy raw_country FROM 'public/data/country.csv' WITH (FORMAT csv,HEADER true)
\copy raw_team FROM 'public/data/team.csv' WITH (FORMAT csv,HEADER true)
\copy raw_rider FROM 'public/data/rider.csv' WITH (FORMAT csv,HEADER true)
\copy raw_location FROM 'public/data/location.csv' WITH (FORMAT csv,HEADER true)
\copy raw_stage FROM 'public/data/stage.csv' WITH (FORMAT csv,HEADER true)
\copy raw_result FROM 'public/data/result.csv' WITH (FORMAT csv,HEADER true)
\copy raw_exit FROM 'public/data/exit.csv' WITH (FORMAT csv,HEADER true)
\copy point_scale FROM 'config/points.csv' WITH (FORMAT csv,HEADER true)
\i sql/01_star_schema.sql
\i sql/02_views.sql
