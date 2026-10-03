import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist'), port=Number(process.env.PORT||4173);
const types={'.mp3':'audio/mpeg','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch{res.writeHead(400);return res.end();}if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(file===root)file=path.join(root,'index.html');fs.readFile(file,(err,b)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(b);});}).listen(port,'0.0.0.0',()=>console.log(`Local: http://127.0.0.1:${port}`));

