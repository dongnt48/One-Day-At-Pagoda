"""Render model turnarounds from the editable source without changing it."""
import bpy, math
from pathlib import Path
from mathutils import Vector
folder=Path(__file__).resolve().parents[3]/'art'/'characters'
bpy.ops.wm.open_mainfile(filepath=str(folder/'novice.blend'))
scene=bpy.context.scene
scene.render.resolution_x=640;scene.render.resolution_y=800
for name,location in [('front',(0,-5,2.05)),('side',(5,0,2.05)),('back',(0,5,2.05))]:
    scene.camera.location=location
    scene.camera.rotation_euler=(Vector((0,0,1.04))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(folder/f'novice-{name}.png')
    bpy.ops.render.render(write_still=True)
rig=bpy.data.objects['PagodaCompanion']
scene.camera.location=(0,-5,2.05)
scene.camera.rotation_euler=(Vector((0,0,1.04))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
for action,frame in [('wave',33),('incense',60)]:
    for track in rig.animation_data.nla_tracks:track.mute=track.name!=action
    scene.frame_set(frame)
    scene.render.filepath=str(folder/f'novice-{action}.png')
    bpy.ops.render.render(write_still=True)
