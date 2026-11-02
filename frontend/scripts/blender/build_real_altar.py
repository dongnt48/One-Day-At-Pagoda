"""Licensed scan adaptations; source and changes: art/altar/ATTRIBUTION.md."""
from pathlib import Path
helpers=Path(__file__).with_name('create_buddha_altar.py')
exec(compile(helpers.read_text().split('# Coordinates as seen')[0],str(helpers),'exec'))
import bmesh
import numpy as np

def scanned(filename,center,zcut,radius,scale,name):
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE/filename))
    scans=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
    for o in scans:
        world=o.matrix_world.copy();bm=bmesh.new();bm.from_mesh(o.data)
        for v in bm.verts:v.co=world@v.co
        remove=[v for v in bm.verts if v.co.z<zcut or abs(v.co.x-center[0])>radius or abs(v.co.y-center[1])>radius]
        bmesh.ops.delete(bm,geom=remove,context='VERTS')
        bm.to_mesh(o.data);bm.free();o.parent=None;o.matrix_world.identity()
    scans=[o for o in scans if len(o.data.vertices)]
    bpy.ops.object.select_all(action='DESELECT')
    for o in scans:o.select_set(True)
    bpy.context.view_layer.objects.active=scans[0];bpy.ops.object.join();body=bpy.context.object
    body.name=name
    for v in body.data.vertices:v.co=(v.co-Vector((*center,zcut)))*scale
    seen=set()
    for mat in body.data.materials:
        if mat in seen:continue
        seen.add(mat)
        p=mat.node_tree.nodes.get('Principled BSDF')
        for socket in ['Metallic','Roughness']:
            for link in list(p.inputs[socket].links):mat.node_tree.links.remove(link)
        p.inputs['Metallic'].default_value=.58;p.inputs['Roughness'].default_value=.37
        for node in [link.from_node for link in p.inputs['Base Color'].links]:
            if node.type=='TEX_IMAGE' and node.image:
                im=node.image;im.scale(min(2048,im.size[0]),min(2048,im.size[1]))
                a=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
                lum=a[:,:3]@np.array([.2126,.7152,.0722])
                a[:,:3]=np.clip((.14+lum[:,None]*.86)*np.array([1.2,.80,.30]),0,1)
                im.pixels.foreach_set(a.ravel());im.pack()
    for p in body.data.polygons:p.use_smooth=True
    mod=body.modifiers.new('Mobile scan','DECIMATE');mod.ratio=min(1,18000/len(body.data.polygons))
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return body

center=scanned('long-son-source.glb',(26.75,16.7),63.5,5.8,.29,'Long Son meditation statue')
center.location.z=.26
side=scanned('tian-tan-source.glb',(0,-.37),3.2,3.2,.49,'Tian Tan seated statue left')
side.location.x=-2.55
other=side.copy();other.name='Tian Tan seated statue right';bpy.context.collection.objects.link(other);other.location.x=2.55

def backplate(x,s):
    start=len(parts)
    outline=[]
    for j in range(97):
        a=j*math.tau/96
        outline.append((1.27*math.sin(a)*(.88+.12*math.cos(a)),.78,1.78+1.76*math.cos(a)))
    verts=[(0,.82,1.78)]+outline
    faces=[(0,j+1,j+2) for j in range(96)]
    mesh=bpy.data.meshes.new('Mandorla backing');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Mandorla backing',mesh);bpy.context.collection.objects.link(o);finish(o,o.name,robe)
    solid=o.modifiers.new('Cast bronze thickness','SOLIDIFY');solid.thickness=.055
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
    for radius in [1,.92,.81]:
        line('Mandorla moulding',[(p[0]*radius,.72,1.78+(p[2]-1.78)*radius) for p in outline],.025,edge)
    for j in range(36):
        a=j*math.tau/36
        x0=1.23*math.sin(a)*(.88+.12*math.cos(a));z0=1.78+1.70*math.cos(a)
        line('Flame carving',[(x0,.71,z0),(x0+.10*math.cos(a),.67,z0+.10*math.sin(a)),(x0*1.09,.70,1.78+(z0-1.78)*1.09)],.025,gold)
        ell('Raised floral boss',(x0*.86,.69,1.78+(z0-1.78)*.86),(.035,.025,.045),edge,10,8)
    for j in range(24):
        a=j*math.tau/24
        line('Head halo rays',[(.42*math.cos(a),.69,2.48+.42*math.sin(a)),(.64*math.cos(a),.69,2.48+.64*math.sin(a))],.012,edge)
    line('Inner halo',[(.65*math.cos(j*math.tau/64),.68,2.48+.65*math.sin(j*math.tau/64)) for j in range(65)],.022,edge)
    cylinder('Pedestal foot',(0,0,.06),1.16,.12,robe)
    cylinder('Pedestal rim',(0,0,.15),1.12,.08,edge)
    for o in parts[start:]:o.location=Vector((x,0,0))+o.location*s;o.scale*=s

backplate(0,1.05);backplate(-2.55,.92);backplate(2.55,.92)
for mat in [gold,robe,edge]:
    selected=[o for o in parts if o.data.materials[0]==mat]
    bpy.ops.object.select_all(action='DESELECT')
    for o in selected:o.select_set(True)
    bpy.context.view_layer.objects.active=selected[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
    parts=[o for o in bpy.context.scene.objects if o.type in {'MESH','CURVE'} and o not in [center,side,other] and o.data.materials and o.data.materials[0] in [gold,robe,edge]]
    bpy.context.object.name=mat.name
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.polygons)]
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(SOURCE/'scanned-altar-draft.glb'),export_format='GLB',use_selection=True)
stats={'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'meshes':len(meshes),'bytes':(SOURCE/'scanned-altar-draft.glb').stat().st_size}
(SOURCE/'scanned-draft-stats.json').write_text(json.dumps(stats,indent=2))
bpy.ops.object.camera_add(location=(.8,-12,4.7));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8.7
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.world.color=(.32,.32,.32)
for pos,power in [((-4,-5,7),1500),((4,-4,5),1600),((0,3,6),1800)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=5
    o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.filepath=str(SOURCE/'scanned-altar-draft.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'scanned-altar-draft.blend'));bpy.ops.render.render(write_still=True)
print('ALTAR_STATS',json.dumps(stats))
