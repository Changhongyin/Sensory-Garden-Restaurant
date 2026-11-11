from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote,urlparse
import argparse,json,time
WEB=Path(__file__).resolve().parent
ROOT=WEB.parents[1]; ASSETS=ROOT/'assets/web/c09'
a=argparse.ArgumentParser();a.add_argument('--port',type=int,default=8809);a.add_argument('--host',default='127.0.0.1');a.add_argument('--open',action='store_true');args=a.parse_args()
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,p):
  p=unquote(urlparse(p).path); base=ASSETS if p.startswith('/assets/') else WEB;rel=p[8:] if p.startswith('/assets/') else p.lstrip('/') or 'index.html';q=(base/rel).resolve();return str(q) if q.is_relative_to(base) and q.is_file() else str(WEB/'__missing__')
 def guess_type(self,p):return {'.js':'text/javascript','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.json':'application/json','.wasm':'application/wasm'}.get(Path(p).suffix,super().guess_type(p))
 def do_POST(self):
  if self.path!='/bench-report':self.send_error(404);return
  n=int(self.headers.get('Content-Length',0))
  if n>32*1024*1024:self.send_error(413);return
  d=json.loads(self.rfile.read(n));dst=ROOT/'review/codex-c09/browser';dst.mkdir(parents=True,exist_ok=True)
  import base64
  name='run-'+time.strftime('%Y%m%d-%H%M%S')
  for k in ['screenshot','screenshot_detail','view_overview','view_landscape','view_courtyard','view_detail']:
   if k in d:
    im=d.pop(k);(dst/(name+'-'+k+'.png')).write_bytes(base64.b64decode(im.split(',')[1]))
  (dst/(name+'.json')).write_text(json.dumps(d,indent=2));self.send_response(200);self.end_headers();self.wfile.write(b'OK')
 def log_message(self,*a):pass
print(f'LOCAL http://127.0.0.1:{args.port}/',flush=True)
try:
 server=ThreadingHTTPServer((args.host,args.port),Handler)
except OSError as e:
 if args.open:
  import urllib.request,webbrowser
  try:
   page=urllib.request.urlopen(f'http://127.0.0.1:{args.port}/',timeout=2).read()
   if '栖光之间'.encode() in page:webbrowser.open(f'http://127.0.0.1:{args.port}/');raise SystemExit(0)
  except (OSError,ValueError):pass
 raise e
if args.open:
 import threading,webbrowser
 threading.Timer(.4,lambda:webbrowser.open(f'http://127.0.0.1:{args.port}/')).start()
server.serve_forever()
