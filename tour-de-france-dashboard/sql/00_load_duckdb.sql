-- DuckDB-only CSV ingestion. Files are registered under these names in WASM.
CREATE TABLE raw_country AS SELECT * FROM read_csv_auto('country.csv');
CREATE TABLE raw_team AS SELECT * FROM read_csv_auto('team.csv');
CREATE TABLE raw_rider AS SELECT * FROM read_csv_auto('rider.csv');
CREATE TABLE raw_location AS SELECT * FROM read_csv_auto('location.csv');
CREATE TABLE raw_stage AS SELECT * FROM read_csv_auto('stage.csv');
CREATE TABLE raw_result AS SELECT * FROM read_csv_auto('result.csv');
CREATE TABLE raw_exit AS SELECT * FROM read_csv_auto('exit.csv');
CREATE TABLE point_scale AS SELECT * FROM read_csv_auto('points.csv');
CREATE TABLE official_classifications (
 classification VARCHAR, rank INTEGER, bib_number INTEGER,
 team_name VARCHAR, value DOUBLE, source_url VARCHAR
);
COPY official_classifications FROM 'official_classifications.csv' (HEADER, DELIMITER ',');
