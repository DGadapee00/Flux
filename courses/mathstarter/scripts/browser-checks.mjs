// Serve a production build without depending on a separately running dev server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=path.resolve(root,`.${pathname}`);
 if(!file.startsWith(`${root}${path.sep}`)&&file!==root){res.writeHead(403).end();return;}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{const status=await new Promise(resolve=>{const child=spawn(process.execPath,['scripts/layout.mjs'],{stdio:'inherit',env:{...process.env,LAYOUT_URL:`http://127.0.0.1:${server.address().port}/`}});child.on('exit',resolve);child.on('error',()=>resolve(1));});if(status!==0)process.exitCode=1;}finally{server.close();}
