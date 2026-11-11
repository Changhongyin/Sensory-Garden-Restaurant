from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse,unquote
import json,re
import argparse
p=argparse.ArgumentParser();p.add_argument('--out',default='recordings');args=p.parse_args()
R=Path(__file__).resolve().parents[1];W=Path(args.out).resolve();W.mkdir(parents=True,exist_ok=True);WEB=R/'web/website-source/c09-viewer';A=R/'web/assets/web/c09'
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,p):
  p=unquote(urlparse(p).path);base=A if p.startswith('/assets/') else WEB;rel=p[8:] if p.startswith('/assets/') else p.lstrip('/') or 'index.html';q=(base/rel).resolve();return str(q) if q.is_relative_to(base) and q.is_file() else str(WEB/'__missing__')
 def do_GET(self):
  if urlparse(self.path).path=='/app.js':
   s=(WEB/'app.js').read_text();s=s.replace('function resize(){','function resize(){if(window.c09Exporting)return;');s=s.replace("if(Q.has('bench'))benchmark();","if(Q.has('bench'))benchmark();if(Q.has('export')){const b=document.createElement('button');b.id='captureButton';b.textContent='Export 4K / 60fps Demo';b.style='position:fixed;top:100px;left:30px;z-index:100;padding:18px';b.onclick=exportDemo;document.body.append(b);}");b=(s+'\n'+(R/'tools/demo-export.js').read_text()).encode();self.send_response(200);self.send_header('Content-Type','text/javascript');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b);return
  super().do_GET()
 def guess_type(self,p):return {'.js':'text/javascript','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.json':'application/json'}.get(Path(p).suffix,super().guess_type(p))
 def do_POST(self):
  n=int(self.headers.get('Content-Length',0));
  if n>80*1024*1024:self.send_error(413);return
  b=self.rfile.read(n)
  if self.path=='/export-start':(W/'demo_native4k.h264').write_bytes(b'');(W/'demo-settings.json').write_bytes(b)
  elif self.path=='/export-chunk':
   with (W/'demo_native4k.h264').open('ab') as f:f.write(b)
  elif self.path=='/export-progress':(W/'demo-progress.json').write_bytes(b)
  elif self.path=='/export-finish':(W/'demo-result.json').write_bytes(b)
  elif re.fullmatch(r'/export-snapshot/\d+\.png',self.path):
   out=W/'demo-frames';out.mkdir(exist_ok=True);(out/self.path.rsplit('/',1)[-1]).write_bytes(b)
  else:self.send_error(404);return
  self.send_response(200);self.end_headers();self.wfile.write(b'OK')
 def log_message(self,*a):pass
print('CAPTURE http://127.0.0.1:8811/?export=1',flush=True)
ThreadingHTTPServer(('127.0.0.1',8811),Handler).serve_forever()
