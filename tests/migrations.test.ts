import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import type {DB} from '../server/db.js';
import {migrate} from '../server/db.js';

test('migration repairs a database with a migration marker but missing application tables',async()=>{
 const pg=new PGlite();
 const db:DB={
  query:async<T=Record<string,unknown>>(sql:string,params:unknown[]=[])=> (await pg.query<T>(sql,params)).rows,
  transaction:fn=>pg.transaction(tx=>fn({query:async<T=Record<string,unknown>>(sql:string,params:unknown[]=[])=> (await tx.query<T>(sql,params)).rows,transaction:async nested=>nested(db),close:async()=>{}})),
  close:()=>pg.close(),
 };
 try{
  await pg.query('CREATE TABLE schema_migrations(version integer PRIMARY KEY,applied_at timestamptz DEFAULT now())');
  await pg.query('INSERT INTO schema_migrations(version) VALUES (1)');
  await migrate(db);
  const villages=await db.query<{table_name:string}>("SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='villages'");
  assert.equal(villages.length,1);
  await migrate(db);
  const version=await db.query<{version:number}>('SELECT version FROM schema_migrations WHERE version=1');
  assert.equal(version.length,1);
 }finally{await db.close()}
});
