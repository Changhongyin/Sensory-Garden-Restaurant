"""Re-render the frozen final scene. Run: blender -b --python render_final.py -- --profile final
Profiles: verify=64x80/1 sample; original=1440x1800/96; final=2160x2700/256; ultra=3840x4800/512.
No source file is overwritten. Both display PNG and scene-linear EXR are written.
"""
import bpy,json,time,sys,argparse,hashlib
from pathlib import Path
from mathutils import Matrix
R=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['verify','original','final','ultra'],default='final');p.add_argument('--threads',type=int,default=8);p.add_argument('--out',default=str(R/'output'))
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);dest=Path(a.out);dest.mkdir(parents=True,exist_ok=True)
scene_file=R/'Garden_Final_Packed.blend';before=hashlib.sha256(scene_file.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(scene_file),load_ui=False);S=bpy.context.scene
missing=[im.name for im in bpy.data.images if im.source=='FILE' and (not im.packed_file or len(im.packed_file.data)==0)];assert not missing,missing;assert not bpy.data.libraries
# Native master camera, evaluated matrix from the verified C07r12 panorama manifest.
rows=[[.991422,-.044702,.122817,3.209],[.130699,.339086,-.931632,-37.657],[0,.939693,.34202,17.755],[0,0,0,1]]
cam=bpy.data.objects.new('FINAL_CAMERA',bpy.data.cameras.new('FINAL_CAMERA'));S.collection.objects.link(cam);cam.matrix_world=Matrix(rows);cam.data.lens=35;cam.data.sensor_width=36;cam.data.sensor_fit='AUTO';cam.data.dof.use_dof=False;S.camera=cam
w,h,samples={'verify':(64,80,1),'original':(1440,1800,96),'final':(2160,2700,256),'ultra':(3840,4800,512)}[a.profile]
S.render.engine='CYCLES';S.cycles.device='CPU';S.cycles.samples=samples;S.cycles.use_denoising=True;S.render.threads_mode='FIXED';S.render.threads=max(1,min(a.threads,10));S.render.resolution_x=w;S.render.resolution_y=h;S.render.resolution_percentage=100;S.render.use_simplify=True;S.render.simplify_subdivision_render=6;S.render.simplify_child_particles_render=1.;S.cycles.texture_limit_render='2048';S.render.use_persistent_data=False
bpy.context.view_layer.update();t=time.time();bpy.ops.render.render()
S.render.image_settings.file_format='OPEN_EXR';S.render.image_settings.color_depth='16';S.render.image_settings.exr_codec='ZIP';bpy.data.images['Render Result'].save_render(str(dest/(a.profile+'.exr')),scene=S)
S.render.image_settings.file_format='PNG';S.render.image_settings.color_depth='16';S.render.image_settings.color_mode='RGBA';bpy.data.images['Render Result'].save_render(str(dest/(a.profile+'.png')),scene=S)
rep={'status':'rendered','profile':a.profile,'width':w,'height':h,'samples':samples,'seconds':time.time()-t,'scene_sha256':before,'packed_images':len(bpy.data.images),'missing_images':missing,'blender':bpy.app.version_string,'view':S.view_settings.view_transform,'look':S.view_settings.look,'exposure':S.view_settings.exposure,'threads':S.render.threads,'note':'Ultra/final profiles are available configurations; a profile is verified only if its own rendered output and manifest are present.'}
(dest/(a.profile+'-manifest.json')).write_text(json.dumps(rep,indent=2));assert hashlib.sha256(scene_file.read_bytes()).hexdigest()==before;print(json.dumps(rep),flush=True)
