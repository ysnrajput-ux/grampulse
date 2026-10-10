import {test} from 'node:test';
import assert from 'node:assert/strict';
const apiModulePath='../api/index.js';
const {default:handler}=await import(apiModulePath) as unknown as {default:(request:unknown,response:unknown)=>Promise<void>};
test('Vercel handler explains missing DATABASE_URL instead of using ephemeral PGlite',async()=>{
 const previousVercel=process.env.VERCEL,previousDatabase=process.env.DATABASE_URL;
 process.env.VERCEL='1';delete process.env.DATABASE_URL;
 const response={headersSent:false,statusCode:200,body:undefined as unknown,status(code:number){this.statusCode=code;return this},json(value:unknown){this.body=value;return this}};
 try{
  await handler({},response);
  assert.equal(response.statusCode,503);
  assert.deepEqual(response.body,{success:false,error:{code:'DATABASE_NOT_CONFIGURED',message:'Database is not configured. Set DATABASE_URL in Vercel Project Settings → Environment Variables, then redeploy.'}});
 }finally{
  if(previousVercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=previousVercel;
  if(previousDatabase===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previousDatabase;
 }
});
