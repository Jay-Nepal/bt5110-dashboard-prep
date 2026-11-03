import sqlite3,pandas as pd,pathlib,re,json,statistics
root=pathlib.Path(__file__).resolve().parents[1];conn=sqlite3.connect(':memory:');conn.row_factory=sqlite3.Row
class Median:
 def __init__(self):self.a=[]
 def step(self,v):
  if v is not None:self.a.append(v)
 def finalize(self):return statistics.median(self.a) if self.a else None
conn.create_aggregate('MEDIAN',1,Median)
for file in ['country','team','rider','location','stage','result','exit']:
 pd.read_csv(root/'public/data'/f'{file}.csv').to_sql('raw_'+file,conn,index=False)
pd.read_csv(root/'config/points.csv').to_sql('point_scale',conn,index=False)
conn.execute('CREATE TABLE official_classifications(classification TEXT,rank INTEGER,bib_number INTEGER,team_name TEXT,value REAL,source_url TEXT)')
def adapt(s):
 s=re.sub(r'EXTRACT\(YEAR FROM CAST\(r.dob AS DATE\)\)',"CAST(strftime('%Y',r.dob) AS INTEGER)",s)
 s=re.sub(r'EXTRACT\(MONTH FROM CAST\(r.dob AS DATE\)\)',"CAST(strftime('%m',r.dob) AS INTEGER)",s)
 s=re.sub(r'EXTRACT\(DAY FROM CAST\(r.dob AS DATE\)\)',"CAST(strftime('%d',r.dob) AS INTEGER)",s)
 s=re.sub(r'CAST\(([^()]+) AS DATE\)',r'\1',s)
 s=s.replace("STRING_AGG(CAST(bib_number AS VARCHAR),',' ORDER BY bib_number)","GROUP_CONCAT(CAST(bib_number AS VARCHAR),',')")
 return s
conn.executescript(adapt((root/'sql/01_star_schema.sql').read_text()))
s=(root/'sql/02_views.sql').read_text().split('-- Demonstrates native ROLLUP')[0];conn.executescript(adapt(s))
passed=[];failed=[];skipped=[]
for q in json.loads((root/'docs/qa-queries.json').read_text()):
 if q['id']=='pivot':skipped.append({'case':q['case'],'id':q['id'],'reason':'SQLite lacks ROLLUP; needs DuckDB test'});continue
 try:
  rows=conn.execute(adapt(q['sql'])).fetchall();passed.append({'case':q['case'],'id':q['id'],'rows':len(rows)})
 except Exception as e:failed.append({'case':q['case'],'id':q['id'],'error':str(e)});print('FAIL',q['case'],q['id'],e)
print('Supplemental SQLite smoke:',len(passed),'passed',len(failed),'failed',len(skipped),'skipped')
(root/'docs/sqlite-smoke.json').write_text(json.dumps({'method':'Supplemental SQLite execution of application SQL after date-syntax and string-aggregate adaptation; NOT DuckDB/Vitest validation. ROLLUP not tested.','passed':passed,'failed':failed,'skipped':skipped},indent=2))
assert not failed
