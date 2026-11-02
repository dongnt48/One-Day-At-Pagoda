"""Prepare a CC0 museum scan for the hall; see public/models/hall-statue-LICENSE.txt."""
import bpy
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];SOURCE=ROOT.parent/'art/altar'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE/'chinese-source.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
processed_images=set()
for o in objects:
    world=o.matrix_world.copy();o.parent=None
    for v in o.data.vertices:v.co=world@v.co
    o.matrix_world.identity()
coords=[v.co for o in objects for v in o.data.vertices]
low=Vector([min(v[i] for v in coords) for i in range(3)]);high=Vector([max(v[i] for v in coords) for i in range(3)])
print('STATUE_BOUNDS',list(low),list(high))
offset=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z));factor=3/(high.z-low.z)
for o in objects:
    for v in o.data.vertices:v.co=(v.co-offset)*factor
    for p in o.data.polygons:p.use_smooth=True
    bpy.context.view_layer.objects.active=o
    mod=o.modifiers.new('Mobile detail','DECIMATE');mod.ratio=min(1,26000/len(o.data.polygons));bpy.ops.object.modifier_apply(modifier=mod.name)
    for mat in o.data.materials:
        if not mat or not mat.use_nodes:continue
        p=mat.node_tree.nodes.get('Principled BSDF')
        for socket in ['Metallic','Roughness']:
            for link in list(p.inputs[socket].links):mat.node_tree.links.remove(link)
        p.inputs['Metallic'].default_value=.55;p.inputs['Roughness'].default_value=.4
        base=mat.node_tree.nodes.get('Image Texture')
        if base:
            mat.node_tree.links.new(base.outputs['Color'],p.inputs['Base Color'])
        for link in p.inputs['Base Color'].links:
            node=link.from_node
            if node.type=='TEX_IMAGE' and node.image and node.image.name not in processed_images:
                im=node.image;processed_images.add(im.name)
                a=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
                lum=a[:,:3]@np.array([.2126,.7152,.0722])
                a[:,:3]=np.clip((.13+lum[:,None]*1.15)*np.array([1.4,1.0,.38]),0,1)
                im.pixels.foreach_set(a.ravel());im.pack()
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/hall-statue.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'hall-statue.blend'))
# Store the generated wall painting as JPEG to reduce mobile transfer size.
im=bpy.data.images.load(str(SOURCE/'altar-mural-generated.png'))
bpy.context.scene.render.image_settings.file_format='JPEG'
bpy.context.scene.render.image_settings.quality=90
im.save_render(str(ROOT/'public/textures/altar-mural.jpg'),scene=bpy.context.scene)
