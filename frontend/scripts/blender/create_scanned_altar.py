"""Adapt CC BY 4.0 Long Son scan by garrryman; see art/altar/ATTRIBUTION.md.
Original scan is kept outside the web build. Extract statue, simplify, recolor gilt.
"""
from pathlib import Path
helpers=Path(__file__).with_name('create_buddha_altar.py')
exec(compile(helpers.read_text().split('# Coordinates as seen')[0],str(helpers),'exec'))
import bmesh
bpy.ops.import_scene.gltf(filepath=str(SOURCE/'tian-tan-source.glb'))
scans=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in scans:
    world=o.matrix_world.copy()
    bm=bmesh.new();bm.from_mesh(o.data)
    for v in bm.verts:v.co=world@v.co
    remove=[v for v in bm.verts if v.co.z<3.2 or abs(v.co.x)>3.2 or abs(v.co.y+.37)>3.2]
    bmesh.ops.delete(bm,geom=remove,context='VERTS')
    bm.to_mesh(o.data);bm.free();o.parent=None;o.matrix_world.identity()
    if not len(o.data.vertices):bpy.data.objects.remove(o,do_unlink=True)
scans=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in scans:o.select_set(True)
bpy.context.view_layer.objects.active=scans[0];bpy.ops.object.join();body=bpy.context.object
body.name='Scanned seated Buddha'
for v in body.data.vertices:v.co=(v.co-Vector((0,-.37,3.2)))*.56
import numpy as np
for mat in body.data.materials:
    p=mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Metallic'].default_value=.68;p.inputs['Roughness'].default_value=.32
    base_nodes=[link.from_node for link in p.inputs['Base Color'].links]
    for node in base_nodes:
        if node.type=='TEX_IMAGE' and node.image:
            im=node.image; im.scale(min(2048,im.size[0]),min(2048,im.size[1]))
            a=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
            lum=a[:,:3]@np.array([.2126,.7152,.0722])
            a[:,:3]=np.clip(lum[:,None]*np.array([1.6,1.05,.38]),0,1)
            im.pixels.foreach_set(a.ravel());im.pack()
for p in body.data.polygons:p.use_smooth=True
mod=body.modifiers.new('Mobile scan','DECIMATE');mod.ratio=min(1,24000/len(body.data.polygons))
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.object.camera_add(location=(4,-8,4))
cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.world.color=(.3,.3,.3)
for pos in [(-3,-4,6),(4,2,5)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=1200;o.data.size=5;o.rotation_euler=(Vector((0,0,1.4))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.filepath=str(SOURCE/'scan-crop.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'scan-crop.blend'))
