import type {ApiResult,Snapshot,User} from '../shared/models.js';
export class ApiError extends Error{constructor(public code:string,message:string,public status:number){super(message)}}
class Client{
 csrf='';user:User|null=null;
 private async fetchApi<T>(route:string,init:RequestInit={}):Promise<{response:Response;result:Extract<ApiResult<T>,{success:true}>}>{
  let response:Response;
  try{response=await fetch('/api'+route,{...init,credentials:'same-origin',signal:AbortSignal.timeout(30000)})}
  catch(error){const message=error instanceof Error&&error.name==='TimeoutError'?'GRAM-PULSE services timed out. Retry in a moment.':'Unable to reach the GRAM-PULSE API. Check the deployment and retry.';throw new ApiError(error instanceof Error&&error.name==='TimeoutError'?'TIMEOUT':'OFFLINE',message,0)}
  let result:ApiResult<T>;
  try{result=await response.json() as ApiResult<T>}
  catch{throw new ApiError('INVALID_RESPONSE',`The API returned an unreadable response (HTTP ${response.status}). Check the Vercel Function logs.`,response.status)}
  if(!response.ok||!result.success){const failure=result.success?undefined:result.error;throw new ApiError(failure?.code||'HTTP_ERROR',failure?.message||`GRAM-PULSE API request failed (HTTP ${response.status}).`,response.status)}
  return{response,result};
 }
 async request<T>(route:string,method='GET',body?:unknown):Promise<T>{
  const headers:Record<string,string>={};if(this.csrf)headers['X-CSRF-Token']=this.csrf;if(body!==undefined)headers['Content-Type']='application/json';
  const {result}=await this.fetchApi<T>(route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return result.data;
 }
 async page<T>(route:string):Promise<{data:T[];pagination:{page:number;pageSize:number;total:number}}>{const {result}=await this.fetchApi<T[]>(route);if(!result.pagination)throw new ApiError('INVALID_RESPONSE','The API response is missing pagination details.',502);return{data:result.data,pagination:result.pagination}}
 async authenticate(){const s=await this.request<{user:User;csrf:string}>('/auth/me');this.user=s.user;this.csrf=s.csrf;return s.user}
 async login(email:string,password:string){const s=await this.request<{user:User;csrf:string}>('/auth/login','POST',{email,password});this.user=s.user;this.csrf=s.csrf;return s.user}
 async logout(){await this.request('/auth/logout','POST');this.user=null;this.csrf=''}
 state(){return this.request<Snapshot>('/state')}
 async upload(file:File){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new ApiError('INVALID_IMAGE','Choose JPEG, PNG or WebP up to 8 MB.',400);const headers:Record<string,string>={'Content-Type':file.type};if(this.csrf)headers['X-CSRF-Token']=this.csrf;const {result}=await this.fetchApi<{id:string;url:string}>('/uploads',{method:'POST',headers,body:file});return result.data}
}
declare global{interface Window{api:Client}}
window.api=new Client();
