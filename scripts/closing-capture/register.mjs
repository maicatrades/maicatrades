// Production resolver: intentionally contains no test database or auth mocks.
import {registerHooks, createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(import.meta.url);
registerHooks({resolve(specifier,context,next){
  if(specifier.startsWith('@/')) return {url:pathToFileURL(path.join(root,'src',specifier.slice(2)+'.ts')).href,shortCircuit:true};
  if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')){
    const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return {url:url.href,shortCircuit:true};
  }
  if (specifier==='next/server') specifier='next/server.js';
  try {return next(specifier,context);} catch(error) {
    if (!process.env.CLOSING_CAPTURE_NODE_MODULES || specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) throw error;
    return {url:pathToFileURL(require.resolve(specifier,{paths:[process.env.CLOSING_CAPTURE_NODE_MODULES]})).href,shortCircuit:true};
  }
}});
