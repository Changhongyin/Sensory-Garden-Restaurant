import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const asset=f=>'/assets/'+f+'?v=C09-1111-delivery';
const $=id=>document.getElementById(id),Q=new URLSearchParams(location.search),T0=performance.now();
const errors=[];addEventListener('error',e=>errors.push(e.message));addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('stage'),antialias:true,powerPreference:'high-performance'});}catch(e){$('msg').textContent='当前浏览器暂不支持 3D';$('loadNote').textContent='已为你保留黄昏渲染原图，请使用支持 WebGL 2 的浏览器。';$('bar').style.display='none';throw e;}
$('stage').addEventListener('webglcontextlost',e=>{e.preventDefault();$('cover').classList.remove('gone');$('load').style.display='block';$('msg').textContent='3D 已暂停';$('loadNote').textContent='当前显示黄昏原图，刷新页面可重新载入。';});
const SOFTWARE=/swiftshader|software|llvmpipe/i.test(renderer.getContext().getParameter(renderer.getContext().RENDERER));
let quality=1;renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.08,5000),controls=new OrbitControls(camera,$('stage'));
controls.enableDamping=true;controls.dampingFactor=.07;controls.screenSpacePanning=false;controls.minDistance=3;controls.maxDistance=135;controls.maxPolarAngle=Math.PI*.49;
let M,post=null,model=null,ready=false,still=false,motion=null,last=0,frames=[],loadSeconds=0,sunDirView=new THREE.Vector3();const sun=new THREE.DirectionalLight(0xffffff,24),frameInfo={calls:0,triangles:0};
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),progress={};
function resize(){drawBudget=3;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth/innerHeight<.9?53:40;camera.updateProjectionMatrix();if(post){const s=renderer.getDrawingBufferSize(new THREE.Vector2());post.rt.setSize(s.x,s.y)}}
function progressSet(k,l,t){progress[k]=[l,t||progress[k]?.[1]||l];const vals=Object.values(progress),a=vals.reduce((n,z)=>n+z[0],0),b=vals.reduce((n,z)=>n+z[1],0);$('bar').firstElementChild.style.width=`${Math.max(4,Math.min(98,a/b*100))}%`;$('msg').textContent=`正在构建园境 · ${(a/1048576).toFixed(1)} MB`;}
function loadGLB(file){return new Promise((yes,no)=>loader.load(asset(file),yes,e=>progressSet(file,e.loaded,e.total),no))}
function hdr(file){return new Promise((yes,no)=>new HDRLoader().load(asset(file),yes,undefined,no))}
function lin(c){return new THREE.Color().setRGB(...c.slice(0,3),THREE.LinearSRGBColorSpace)}
// Full-scene materials use metric world grain; the pilot UV atlas only covers its cropped bay.
function metricSurface(m,kind){
 m.onBeforeCompile=sh=>{
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 c09World;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 c09p=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nc09p=instanceMatrix*c09p;\n#endif\nc09World=(modelMatrix*c09p).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 c09World;
 float c09hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float c09noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(c09hash(i),c09hash(i+vec2(1,0)),f.x),mix(c09hash(i+vec2(0,1)),c09hash(i+vec2(1,1)),f.x),f.y);}
 `).replace('#include <color_fragment>',`#include <color_fragment>
 ${kind==='wood'?`
 vec2 p=c09World.xz;
 float grain=c09noise(vec2(p.x*95.,p.y*2.5))+0.45*c09noise(vec2(p.x*330.,p.y*11.));
 float board=c09hash(vec2(floor(p.x/0.14),floor(p.y/2.6)));
 diffuseColor.rgb *= 0.72+grain*0.25+board*0.16;
 `:`
 vec2 p=c09World.xz;
 float blades=c09noise(p*38.);
 float patchy=c09noise(p*.7);
 diffuseColor.rgb *= mix(vec3(.54,.69,.34),vec3(1.03,1.12,.68),patchy)*(.7+.5*blades);
 `}`);
 };
 m.customProgramCacheKey=()=>kind+'-metric-v1';m.needsUpdate=true;
}
function patch(m,role){
 if(m.userData.c09patched)return;m.userData.c09patched=true;
 if(m.isMeshPhysicalMaterial)m.transmission=0;
 const orig=m.name.replace(/^C09_/,'');const cfg=M.web_materials[orig]||Object.entries(M.web_materials).find(([k])=>orig.startsWith(k))?.[1];
 m.side=THREE.DoubleSide;
 if(/LivingGround|DistantMeadow|Turf/.test(m.name)){m.roughness=1;m.metalness=0;m.envMapIntensity=.25;m.color.setRGB(.34,.53,.11);metricSurface(m,'grass');}
 if(/DistantMeadow/.test(m.name))m.color.setRGB(.055,.07,.014);
 if(/Deck_Cumaru|Boardwalk_Cumaru|Oak_Top|Oak_EndGrain/.test(m.name)){m.map=m.normalMap=m.roughnessMap=null;m.roughness=.72;m.envMapIntensity=.7;m.color.setRGB(.18,.095,.040);metricSurface(m,'wood');}
 if(/FineGrass|IVY_Mat_Leaf/.test(m.name)){m.color.setRGB(.028,.085,.012);m.roughness=.9;m.envMapIntensity=.4;}
 if(/searsia.*leaves|shrub_01|grass_medium/.test(m.name)){m.alphaTest=.4;m.transparent=false;m.roughness=.9;m.envMapIntensity=.5;}
 if(/Concrete_WarmLight/.test(m.name)){m.color.setRGB(.27,.235,.18);m.roughness=.95;}
 if(/River_Water/.test(m.name)){m.roughness=.13;m.metalness=.35;m.color.setRGB(.10,.19,.14);}

 if(cfg?.kind==='glass'||/Glass|Water|Glazing/.test(orig)){if(m.isMeshPhysicalMaterial)m.transmission=0;m.opacity=/Glazing|LowIron/.test(orig)?.13:.36;m.color.setRGB(.42,.52,.55);m.transparent=true;m.depthWrite=false;m.roughness=.08;m.envMapIntensity=.5;m.metalness=.15;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= .08+.92*pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),2.5);');};m.customProgramCacheKey=()=>"c09-thin-glass";}
 if(role==='plant'&&!/Water|Stem|Petiole|rock/.test(orig)){m.color.multiply(new THREE.Color(.48,.68,.24));m.metalness=0;m.roughness=.95;}
 if(cfg?.alpha_test!=null){m.alphaTest=cfg.alpha_test;m.transparent=false}
 for(const k of ['map','normalMap','roughnessMap'])if(m[k])m[k].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 if(/Membrane.*(?:PVC|Doubler)/.test(orig)){
  m.color.setRGB(.95,.92,.85);m.transmission=0;m.transparent=true;m.opacity=.80;m.depthWrite=false;m.roughness=.32;
  m.onBeforeCompile=sh=>{sh.uniforms.c09Sun={value:sunDirView};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 c09Sun;').replace('#include <opaque_fragment>','outgoingLight += diffuseColor.rgb * vec3(1.0,.72,.45) * max(0.0,-dot(normal,c09Sun)) * 3.4;\n#include <opaque_fragment>');};
 }
}
function prepare(root){root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;let mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)patch(m,o.userData.c09_role);o.castShadow=!/TerrainNear/.test(o.name)&&!mats.some(m=>/Glass|Water/.test(m.name));o.receiveShadow=true;if(o.geometry.attributes.normal){const a=o.geometry.attributes.normal;let bad=false;for(let i=0;i<a.count;i++){const z=a.getX(i)**2+a.getY(i)**2+a.getZ(i)**2;if(!Number.isFinite(z)||z<.01){bad=true;break}}if(bad)o.geometry.computeVertexNormals();}});}
// Merge static, unique meshes per material while retaining metadata on the source nodes.
function batchStatic(root){
 root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.geometry.groups.length>1)return;if(/TerrainNear/.test(o.name))return;const m=o.material;if(m.transmission>.1||m.transparent)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g.setIndex(g.index.clone());for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=m.uuid;if(!buckets.has(key))buckets.set(key,{m,geos:[],obs:[]});const b=buckets.get(key);b.geos.push(g.index?g.toNonIndexed():g);b.obs.push(o)});
 for(const b of buckets.values()){if(b.obs.length<2)continue;const geo=mergeGeometries(b.geos,false);if(!geo)continue;const mesh=new THREE.Mesh(geo,b.m);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='C09_batch';scene.add(mesh);for(const o of b.obs)o.visible=false;for(const g of b.geos)g.dispose();}
}
const C=new THREE.Matrix4().set(1,0,0,0,0,0,1,0,0,-1,0,0,0,0,0,1),Ci=C.clone().invert();
const plantGroups=[],treeGroups=[],workMatrix=new THREE.Matrix4(),v=new THREE.Vector3();let planted=0,treeCount=0;
function toWorld(a){return new THREE.Matrix4().set(...a).premultiply(C).multiply(Ci)}
async function landscape(info,lib){
 function archetypeMeshes(root){const out=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;let owner=o;while(owner&&!owner.userData.asset_key)owner=owner.parent;const key=owner?.userData.asset_key;if(key){if(!out.has(key))out.set(key,[]);out.get(key).push(o);}});return out;}
 const lookup=archetypeMeshes(lib.scene);
 for(const entry of info.library){const sources=lookup.get(entry.key);if(!sources){errors.push('Missing plant archetype '+entry.key);continue;}const data=info.placements[entry.key]||[];for(const source of sources){const im=new THREE.InstancedMesh(source.geometry,source.material,data.length);im.name='植栽_'+entry.key;im.frustumCulled=false;im.castShadow=false;im.receiveShadow=true;for(const m of Array.isArray(im.material)?im.material:[im.material])patch(m,'plant');const bases=data.map(p=>toWorld(p.matrix).multiply(source.matrixWorld));source.geometry.computeBoundingSphere();const sphere=source.geometry.boundingSphere;plantGroups.push({im,bases,positions:bases.map(m=>sphere.center.clone().applyMatrix4(m)),radius:sphere.radius*Math.max(new THREE.Vector3().setFromMatrixScale(bases[0]||new THREE.Matrix4()).length(),1),limit:/fern|Ivy|LIB_Lux/i.test(entry.key)?65:140});scene.add(im);}planted+=data.length;}
 const near=await loadGLB('near-trees.glb');const nearMap=archetypeMeshes(near.scene);
 const textureLoader=new THREE.TextureLoader();
 for(const entry of info.treecards){const tex=await textureLoader.loadAsync(asset(entry.file));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const mat=new THREE.MeshBasicMaterial({map:tex,alphaTest:.25,side:THREE.DoubleSide,fog:true});const geo=new THREE.PlaneGeometry(1,1);const data=info.placements[entry.key]||[];const im=new THREE.InstancedMesh(geo,mat,data.length);im.frustumCulled=false;im.name='远景林带_'+entry.key;const center=new THREE.Vector3(entry.center[0],entry.center[2],-entry.center[1]);const pts=data.map(p=>{const m=toWorld(p.matrix);return{pos:center.clone().applyMatrix4(m),scale:new THREE.Vector3().setFromMatrixScale(m)}});const sources=nearMap.get(entry.key)||[],nearParts=[];for(const src of sources){for(const m of Array.isArray(src.material)?src.material:[src.material])patch(m,'plant');const ni=new THREE.InstancedMesh(src.geometry,src.material,data.length);ni.frustumCulled=false;ni.name='近景真三维树_'+entry.key;ni.castShadow=false;ni.receiveShadow=true;nearParts.push({im:ni,bases:data.map(p=>toWorld(p.matrix).multiply(src.matrixWorld))});scene.add(ni);}treeGroups.push({im,pts,size:entry.size,nearParts,nearCount:0});scene.add(im);treeCount+=data.length;}
 updatePlants();updateTrees();
}
const rot=new THREE.Quaternion(),sc=new THREE.Vector3();
const frustum=new THREE.Frustum(),clip=new THREE.Matrix4(),bound=new THREE.Sphere();
function updatePlants(){camera.updateMatrixWorld(true);frustum.setFromProjectionMatrix(clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));for(const g of plantGroups){let n=0;for(let i=0;i<g.bases.length;i++)if(g.positions[i].distanceTo(camera.position)<g.limit&&frustum.intersectsSphere(bound.set(g.positions[i],g.radius)))g.im.setMatrixAt(n++,g.bases[i]);g.im.count=n;g.im.instanceMatrix.needsUpdate=true;}}
function updateTrees(){
 const angle=Math.atan2(camera.position.x,camera.position.z);rot.setFromAxisAngle(new THREE.Vector3(0,1,0),angle);
 for(const g of treeGroups){let n=0,nn=0;for(let i=0;i<g.pts.length;i++){const p=g.pts[i];if(g.nearParts.length&&p.pos.distanceTo(camera.position)<12&&frustum.intersectsSphere(bound.set(p.pos,g.size[1]*p.scale.y*.6))){for(const part of g.nearParts)part.im.setMatrixAt(nn,part.bases[i]);nn++;continue;}sc.set(g.size[0]*Math.max(p.scale.x,p.scale.z),g.size[1]*p.scale.y,1);workMatrix.compose(p.pos,rot,sc);g.im.setMatrixAt(n++,workMatrix);}g.im.count=n;g.im.instanceMatrix.needsUpdate=true;g.nearCount=nn;for(const part of g.nearParts){part.im.count=nn;part.im.instanceMatrix.needsUpdate=true;}}
}


let grass=null,grassPts=[];const heightCells=new Map();
function eyeFloor(x,z){let h=-Infinity;const i=Math.floor(x),j=Math.floor(z);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)h=Math.max(h,heightCells.get((i+a)+','+(j+b))??-Infinity);return Number.isFinite(h)?h+1.3:1.3;}
async function addGrass(){grassPts=await(await fetch(asset('grass-points.json'))).json();for(const p of grassPts){const k=Math.floor(p[0])+','+Math.floor(p[2]);heightCells.set(k,Math.max(heightCells.get(k)??-Infinity,p[1]));}const pos=[],col=[];let seed=11;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<80;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*.27,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.035+rnd()*.065,w=.0025+rnd()*.0025,b=rnd()*6.28,dx=Math.cos(b)*w,dz=Math.sin(b)*w;pos.push(x-dx,0,z-dz,x+dx,0,z+dz,x+.02,h,z+.01);col.push(.10,.17,.025,.10,.17,.025,.27,.36,.07)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();const m=new THREE.MeshStandardMaterial({color:new THREE.Color(.34,.4,.22),vertexColors:true,roughness:1,side:THREE.DoubleSide});grass=new THREE.InstancedMesh(g,m,18000);grass.frustumCulled=false;grass.receiveShadow=true;scene.add(grass);updateGrass();}
function updateGrass(){if(!grass)return;let n=0;for(const p of grassPts){if(n>=18000)break;if(Math.hypot(p[0]-camera.position.x,p[2]-camera.position.z)<38){workMatrix.makeRotationY((p[0]*23+p[2]*11)%6.28);workMatrix.setPosition(p[0],p[1]-.015,p[2]);grass.setMatrixAt(n++,workMatrix)}}grass.count=n;grass.instanceMatrix.needsUpdate=true;}

const views={overview:{p:[3.209,20,43],t:[0,1,-1]},landscape:{p:[4,14,59],t:[0,3,-2]},courtyard:{p:[8.2,2.5,-3.8],t:[0,1.1,-10]},sweep:{p:[1,6.8,10],t:[0,1,-5]},detail:{p:[4.8506,1.755,3.3984],t:[4.6,1.05,-.4]},arrival:{p:[20,5,33],t:[2,2,8]}};
let fadeTimer=null;
function transition(key,duration=650){
 const w=views[key];if(!w)return;stopTour();clearTimeout(fadeTimer);
 const place=()=>{drawBudget=3;camera.position.set(...w.p);controls.target.set(...w.t);controls.update();updatePlants();updateTrees();updateGrass();$('stage').style.opacity='1';};
 if(duration<=1)place();else{$('stage').style.opacity='0';fadeTimer=setTimeout(place,260);}
 document.querySelectorAll('nav button').forEach(b=>(b.classList.toggle('active',b.id===key),b.setAttribute('aria-pressed',String(b.id===key))));
}
function stopTour(){motion=null;clearTimeout(fadeTimer);$('stage').style.opacity='1';$('tour').classList.remove('active');$('tour').setAttribute('aria-pressed','false')}
function tour(){if(motion?.tour){stopTour();return}stopTour();$('stage').style.opacity='0';$('tour').classList.add('active');$('tour').setAttribute('aria-pressed','true');fadeTimer=setTimeout(()=>{camera.position.set(...views.arrival.p);controls.target.set(...views.arrival.t);controls.update();$('stage').style.opacity='1';motion={start:performance.now(),duration:32000,keys:[views.arrival,views.landscape,views.overview,views.sweep,views.overview],tour:true};},260)}
for(const key of ['overview','landscape','courtyard','detail'])$(key).onclick=()=>{if(still)toggleStill();transition(key)};
$('tour').onclick=()=>{if(still)toggleStill();tour()};
function toggleStill(){stopTour();drawBudget=3;still=!still;$('cover').classList.toggle('gone',!still);$('stillNote').style.display=still?'block':'none';$('still').classList.toggle('active',still);$('still').setAttribute('aria-pressed',String(still));}
$('still').onclick=toggleStill;
$('quality').onclick=()=>{quality=quality===1?1.5:quality===1.5?.75:1;renderer.setPixelRatio(Math.min(devicePixelRatio,quality));$('quality').textContent='画质 · '+(quality===1?'标准':quality>1?'精细':'流畅');resize();};
for(const ev of ['pointerdown','wheel'])$('stage').addEventListener(ev,stopTour,{passive:true});
addEventListener('keydown',e=>{if(e.key==='Escape')stopTour();if(e.key.toLowerCase()==='s'){$('stats').style.display=$('stats').style.display==='block'?'none':'block'}});
let tickN=0,drawBudget=3,lodDirty=true;
function tick(now){if(still)return;const moving=!!motion;
 if(motion){const q=Math.max(0,Math.min(1,(now-motion.start)/motion.duration)),ss=q*(motion.keys.length-1),i=Math.min(motion.keys.length-2,Math.floor(ss)),u=ss-i,e=u*u*(3-2*u);camera.position.lerpVectors(new THREE.Vector3(...motion.keys[i].p),new THREE.Vector3(...motion.keys[i+1].p),e);controls.target.lerpVectors(new THREE.Vector3(...motion.keys[i].t),new THREE.Vector3(...motion.keys[i+1].t),e);if(q===1)stopTour();}
 const changed=controls.update();if(changed||moving){drawBudget=3;lodDirty=true;}camera.position.y=Math.max(eyeFloor(camera.position.x,camera.position.z),camera.position.y);controls.target.clamp(new THREE.Vector3(-45,.4,-70),new THREE.Vector3(45,12,48));camera.updateMatrixWorld();sunDirView.copy(sun.position).sub(sun.target.position).normalize().transformDirection(camera.matrixWorldInverse);
 if(tickN++%20===0){if(lodDirty){updatePlants();updateTrees();updateGrass();drawBudget=Math.max(drawBudget,1);lodDirty=false;}$('stats').textContent=`${(1000/(frames.slice(-60).reduce((a,b)=>a+b,0)/Math.max(1,Math.min(60,frames.length)))).toFixed(0)} 交互 FPS\n${frameInfo.calls} draws · ${(frameInfo.triangles/1e6).toFixed(2)} M tris\n${planted} 植栽 · ${treeCount} 远景树木\n25 桌 / 70 座位`}
 if(Q.has('bench')||drawBudget-->0){if(last&&(Q.has('bench')||now-last<120)){frames.push(now-last);if(frames.length>5000)frames.shift()}last=now;renderFrame();}}
for(const b of document.querySelectorAll('nav button,#quality'))b.disabled=true;
async function main(){M=await(await fetch(asset('settings.json'))).json();const [arch,env,light,info]=await Promise.all([loadGLB('architecture.glb'),hdr(M.environment.file),hdr(M.environment.lighting_file),fetch(asset('scene.json')).then(r=>r.json())]);await setupLUT(M.display);env.mapping=light.mapping=THREE.EquirectangularReflectionMapping;scene.background=env;scene.environment=light;scene.backgroundRotation.y=scene.environmentRotation.y=M.environment.rotation_y;scene.environmentIntensity=.65;sun.intensity=10;scene.backgroundIntensity=1;scene.fog=new THREE.FogExp2(lin([.55,.40,.23]),.0012);sun.color.copy(lin(M.sun.color_linear));sun.position.set(...M.sun.direction_to_sun).multiplyScalar(110);sun.target.position.set(0,1,0);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:230});sun.shadow.mapSize.set(4096,4096);sun.shadow.bias=-.0012;sun.shadow.normalBias=.06;scene.add(sun,sun.target);model=arch.scene;scene.add(model);prepare(model);if(!Q.has("nobatch"))batchStatic(model);camera.position.set(...views.overview.p);controls.target.set(...views.overview.t);controls.update();resize();
 const veg=await loadGLB('vegetation.glb');await landscape(info,veg);
 try{if(!Q.has('noland')){const land=await loadGLB('distant-land.glb');land.scene.position.y=-.3;scene.add(land.scene);prepare(land.scene);land.scene.traverse(o=>{o.castShadow=false;o.receiveShadow=false;})}}catch(e){errors.push('distant land pending')}
 await addGrass();for(const b of document.querySelectorAll('nav button,#quality'))b.disabled=false;ready=true;loadSeconds=performance.now()/1000;renderer.setAnimationLoop(tick);$('load').style.display='none';$('cover').classList.add('gone');setTimeout(()=>{sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true},3000);if(Q.has('view')&&views[Q.get('view')])transition(Q.get('view'),1);if(Q.has('bench'))benchmark();}
async function benchmark(){await new Promise(r=>setTimeout(r,3000));frames=[];last=0;const probe=[];const shots={};const start=performance.now();const wait=ms=>new Promise(r=>setTimeout(r,ms));for(const k of (Q.has('shot')?[Q.get('shot')]:['overview','landscape','courtyard','detail','overview'])){transition(k,2200);await wait(6500);probe.push({view:k,calls:frameInfo.calls,triangles:frameInfo.triangles});renderFrame();shots['view_'+k]=renderer.domElement.toDataURL('image/png');}const a=frames.slice(5).sort((a,b)=>a-b);transition('overview',1);await wait(1000);renderFrame();const screenshot=renderer.domElement.toDataURL('image/png');transition('detail',1);await wait(1000);renderFrame();const screenshot_detail=renderer.domElement.toDataURL('image/png');transition('overview',1000);const d={...shots,status:'ok',first_complete_3d_seconds:loadSeconds,one_percent_low_fps:1000/a[Math.floor(a.length*.99)],pixel_ratio:renderer.getPixelRatio(),renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER),lod:treeGroups.map(g=>({total:g.pts.length,near:g.nearCount||0,far:g.im.count,exclusive:g.pts.length===(g.nearCount||0)+g.im.count})),resource_bytes:performance.getEntriesByType('resource').reduce((n,r)=>n+(r.transferSize||0),0),duration_s:(performance.now()-start)/1000,viewport:[innerWidth,innerHeight],buffer:[renderer.domElement.width,renderer.domElement.height],frames:a.length,fps:1000/(a.reduce((x,y)=>x+y,0)/a.length),p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],console:errors,probes:probe,plants:planted,trees:treeCount,visible:document.visibilityState,focus:document.hasFocus(),screenshot,screenshot_detail};await fetch('/bench-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});document.title='验收完成 · 栖光之间';}
addEventListener('resize',resize);
main().catch(e=>{console.error(e);$('msg').textContent='三维加载暂未完成';$('loadNote').textContent=e.message+' · 当前显示渲染原图';$('cover').classList.remove('gone')});

async function setupLUT(d) {
  const blob = await (await fetch(asset(d.lut_file))).blob();
  const bmp = await createImageBitmap(blob, {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
  const N = d.N, cv = document.createElement('canvas'); cv.width = N * N; cv.height = N;
  const c2 = cv.getContext('2d', {willReadFrequently: true}); c2.drawImage(bmp, 0, 0);
  const px = c2.getImageData(0, 0, N * N, N).data;               // row b, x = r + g*N  ==  r + N*(g + N*b)
  const lut = new THREE.Data3DTexture(new Uint8Array(px.buffer.slice(0)), N, N, N);
  lut.format = THREE.RGBAFormat; lut.type = THREE.UnsignedByteType; lut.minFilter = lut.magFilter = THREE.LinearFilter;
  lut.wrapS = lut.wrapT = lut.wrapR = THREE.ClampToEdgeWrapping; lut.unpackAlignment = 1; lut.colorSpace = THREE.NoColorSpace; lut.needsUpdate = true;
  const s = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(s.x, s.y, {type: THREE.HalfFloatType, samples: SOFTWARE ? 0 : 4, depthBuffer: true});
  const mat = new THREE.ShaderMaterial({
    uniforms: {tSrc: {value: rt.texture}, tLut: {value: lut}, uN: {value: N}, uMin: {value: d.minEv}, uMax: {value: d.maxEv}},
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `precision highp sampler3D;
      uniform sampler2D tSrc; uniform sampler3D tLut; uniform float uN, uMin, uMax; varying vec2 vUv;
      void main() {
        vec3 c = max(texture2D(tSrc, vUv).rgb, vec3(0.0));
        vec3 e = clamp((log2(max(c, vec3(1e-9))) - uMin) / (uMax - uMin), 0.0, 1.0);
        gl_FragColor = vec4(texture(tLut, (e * (uN - 1.0) + 0.5) / uN).rgb, 1.0);
      }`,
    depthTest: false, depthWrite: false, toneMapped: false});
  const ps = new THREE.Scene(); ps.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  post = {rt, mat, scene: ps, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), lut};
  renderer.toneMapping = THREE.NoToneMapping;
}
function renderFrame() {
  renderer.info.reset();
  if (post) {
    renderer.setRenderTarget(post.rt); renderer.render(scene, camera);
    const calls = renderer.info.render.calls, tris = renderer.info.render.triangles;
    renderer.setRenderTarget(null); renderer.render(post.scene, post.cam);
    frameInfo.calls = calls + 1; frameInfo.triangles = tris + 2;
  } else { renderer.render(scene, camera); frameInfo.calls = renderer.info.render.calls; frameInfo.triangles = renderer.info.render.triangles; }
}
