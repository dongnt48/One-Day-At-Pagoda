import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[3]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'art/altar/long-son-source.glb'))
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  coords=[o.matrix_world@Vector(c) for c in o.bound_box]
  print('SCAN',o.name,len(o.data.polygons),[[min(v[i] for v in coords),max(v[i] for v in coords)] for i in range(3)])
bpy.ops.wm.save_as_mainfile(filepath=str(root/'art/altar/scan-inspect.blend'))
