// Deterministic 4K/60fps H.264 export of actual three-dimensional frames.
async function exportDemo(){
 window.c09Exporting=true;for(const b of document.querySelectorAll('button'))b.disabled=true;const button=$('captureButton');button.disabled=true;stopTour();renderer.setAnimationLoop(null);controls.enabled=false;controls.enableDamping=false;
 const W=3840,H=2160,FPS=60,SECONDS=40;let codec=null,failure=null,bytes=0,parts=[],count=0,verifiedFrames=0;
 const config={width:W,height:H,bitrate:64000000,framerate:FPS,hardwareAcceleration:'prefer-hardware',latencyMode:'realtime',avc:{format:'annexb'}};
 try{
  if(!window.VideoEncoder)throw new Error('This browser does not provide VideoEncoder');
  for(const c of ['avc1.640034','avc1.640033','avc1.420034']){const r=await VideoEncoder.isConfigSupported({...config,codec:c});if(r.supported){codec=c;break;}}
  if(!codec)throw new Error('4K H.264 encoding is not supported');
  const enc=new VideoEncoder({output:chunk=>{const p=new Uint8Array(chunk.byteLength);chunk.copyTo(p);parts.push(p);bytes+=p.length;count++;},error:e=>{failure=e}});enc.configure({...config,codec});
  await fetch('/export-start',{method:'POST',body:JSON.stringify({width:W,height:H,fps:FPS,seconds:SECONDS,codec,bitrate:config.bitrate})});
  renderer.setPixelRatio(1);renderer.setSize(W,H,false);post.rt.setSize(W,H);camera.aspect=W/H;camera.fov=40;camera.updateProjectionMatrix();
  const beats=[
   {a:0,b:7,p:[22,5.6,35],q:[18,6.2,30],t:[0,2,5]},
   {a:7,b:16,p:[5,20,43],q:[-3,18.5,40],t:[0,1,-1]},
   {a:16,b:23,p:[4,14,59],q:[0,15,57],t:[0,3,-2]},
   {a:23,b:30,p:[8.2,2.5,-3.8],q:[7.8,2.7,-3.4],t:[0,1.1,-10]},
   {a:30,b:36,p:[4.8506,1.755,3.3984],q:[4.9,1.85,3.8],t:[4.6,1.05,-.4]},
   {a:36,b:40,p:[0,23,46],q:[3,25,48],t:[0,1,-1]}
  ];
  const overlay=document.createElement('canvas');overlay.width=W;overlay.height=H;const ctx=overlay.getContext('2d');const started=performance.now();
  for(let i=0;i<FPS*SECONDS;i++){
   const t=i/FPS,beat=beats.find(b=>t>=b.a&&t<b.b)||beats.at(-1),u=(t-beat.a)/(beat.b-beat.a),e=u*u*(3-2*u);
   camera.position.lerpVectors(new THREE.Vector3(...beat.p),new THREE.Vector3(...beat.q),e);controls.target.set(...beat.t);camera.lookAt(controls.target);camera.updateMatrixWorld(true);
   sunDirView.copy(sun.position).sub(sun.target.position).normalize().transformDirection(camera.matrixWorldInverse);
   if(i%3===0||i===0){updatePlants();updateTrees();updateGrass();}
   if(i%120===0)sun.shadow.needsUpdate=true;
   if(renderer.domElement.width!==W||renderer.domElement.height!==H)throw new Error('Native renderer size changed');
   renderFrame();
   let src=renderer.domElement;
   if(t<3||t>37){ctx.clearRect(0,0,W,H);ctx.drawImage(src,0,0);const alpha=t<3?Math.min(1,t*2,(3-t)*2):Math.min(1,(t-37)*2);ctx.globalAlpha=Math.max(0,alpha);ctx.fillStyle='rgba(12,24,18,.6)';ctx.fillRect(120,H-430,1450,300);ctx.fillStyle='#f4ead6';ctx.font='76px "Songti SC",serif';ctx.fillText('栖光之间',180,H-295);ctx.font='30px "PingFang SC",sans-serif';ctx.fillStyle='#e3cda3';ctx.fillText('自然共生的流动园境',185,H-220);ctx.globalAlpha=1;src=overlay;}
   if(src.width!==W||src.height!==H)throw new Error('Native input size changed: '+src.width+'x'+src.height);verifiedFrames++;const frame=new VideoFrame(src,{timestamp:Math.round(i*1000000/FPS),duration:Math.round(1000000/FPS)});enc.encode(frame,{keyFrame:i%120===0});frame.close();
   while(enc.encodeQueueSize>5){if(failure)throw failure;await new Promise(r=>setTimeout(r,1));}
   if(i%60===59){await enc.flush();if(parts.length){await fetch('/export-chunk',{method:'POST',body:new Blob(parts)});parts=[];}button.textContent=`制作 4K / 60帧 Demo · ${Math.round((i+1)/24)}%`;await fetch('/export-progress',{method:'POST',body:JSON.stringify({frame:i+1,total:FPS*SECONDS,elapsed_seconds:(performance.now()-started)/1000,bytes})});}
   if([0,480,1080,1560,1920,2399].includes(i)){const blob=await new Promise(r=>renderer.domElement.toBlob(r,'image/png'));await fetch('/export-snapshot/'+i+'.png',{method:'POST',body:blob});}
   if(failure)throw failure;
   if(i%6===0)await new Promise(r=>setTimeout(r,0));
  }
  await enc.flush();if(parts.length)await fetch('/export-chunk',{method:'POST',body:new Blob(parts)});enc.close();
  await fetch('/export-finish',{method:'POST',body:JSON.stringify({status:'complete',input_size_verified_frames:verifiedFrames,width:W,height:H,fps:FPS,frames:FPS*SECONDS,encoded_chunks:count,seconds:SECONDS,codec,bytes,render_seconds:(performance.now()-started)/1000,kind:'Deterministic real 3D frames; no frame interpolation; separate from live viewer FPS',beats})});
  button.textContent='4K / 60帧画面已制作完成';document.title='Demo 帧导出完成';
 }catch(e){console.error(e);button.textContent='Demo 导出失败：'+e.message;await fetch('/export-finish',{method:'POST',body:JSON.stringify({status:'failed',error:String(e)})});}
}
