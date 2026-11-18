import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
registerHooks({resolve(specifier,context,next){
  if(specifier==='@/lib/supabase'||specifier==='@/lib/supabase/server') return {url:'mock:'+specifier,shortCircuit:true};
  if(specifier.startsWith('@/')) return {url:pathToFileURL(path.join(root,'src',specifier.slice(2)+'.ts')).href,shortCircuit:true};
  if(specifier==='next/server')return next('next/server.js',context);
  if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')){
    const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return {url:url.href,shortCircuit:true};
  }
  return next(specifier,context);
},load(url,context,next){
  if(url==='mock:@/lib/supabase')return {format:'module',source:'export const supabaseAdmin = globalThis.testDatabase;',shortCircuit:true};
  if(url==='mock:@/lib/supabase/server')return {format:'module',source:'export const createClient = async () => ({auth:{getUser:async()=>({data:{user:globalThis.testUser}})}});',shortCircuit:true};
  return next(url,context);
}});
