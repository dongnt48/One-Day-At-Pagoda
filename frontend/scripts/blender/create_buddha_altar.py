"""Original static bronze altar. Blender Z up, front -Y. No downloaded assets.
Run: blender --background --python frontend/scripts/blender/create_buddha_altar.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models'
SOURCE = ROOT.parent / 'art/altar'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metal=.65, rough=.38):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal; p.inputs['Roughness'].default_value = rough
    return m

gold = material('Warm aged gilt bronze', (.61,.32,.085))
robe = material('Saffron bronze drapery', (.39,.16,.035))
dark = material('Recessed bronze details', (.065,.029,.012), .5)
edge = material('Polished raised edges', (.82,.51,.18))
parts = []

def finish(o, name, mat):
    o.name = name; o.data.materials.append(mat)
    if o.type == 'MESH':
        for p in o.data.polygons: p.use_smooth = True
    parts.append(o)
    return o

def ell(name, p, s, mat=gold, seg=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=p)
    o=bpy.context.object; o.scale=s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o,name,mat)

def line(name, points, radius, mat=edge):
    c=bpy.data.curves.new(name,'CURVE'); c.dimensions='3D'; c.resolution_u=5
    c.bevel_depth=radius; c.bevel_resolution=2
    sp=c.splines.new('BEZIER'); sp.bezier_points.add(len(points)-1)
    for b,p in zip(sp.bezier_points,points):
        b.co=p; b.handle_left_type='AUTO'; b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o)
    return finish(o,name,mat)

def cylinder(name,p,r,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=p)
    o=finish(bpy.context.object,name,mat)
    mod=o.modifiers.new('Soft cast rim','BEVEL'); mod.width=.025; mod.segments=2
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def petal(angle,z,radius,upper):
    # Closed pointed petal, curved outwards at its belly and drawn in at the tip.
    verts=[]; faces=[]; n=10; m=10
    for j in range(n+1):
        t=j/n; width=.20*math.sin(math.pi*t)**.7+.002
        radial=radius+.16*math.sin(math.pi*t)-.13*t
        for k in range(m):
            a=2*math.pi*k/m
            v=Vector((radial+.045*math.sin(a)*math.sin(math.pi*t),width*math.cos(a),z+(.39*t if upper else -.30*t)))
            verts.append((v.x*math.cos(angle)-v.y*math.sin(angle),v.x*math.sin(angle)+v.y*math.cos(angle),v.z))
    for j in range(n):
        for k in range(m):
            a=j*m+k; b=j*m+(k+1)%m; faces.append((a,b,b+m,a+m))
    faces.extend([tuple(reversed(range(m))),tuple(n*m+k for k in range(m))])
    mesh=bpy.data.meshes.new('Lotus petal'); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new('Lotus petal',mesh); bpy.context.collection.objects.link(o); finish(o,o.name,gold)

def statue(name, x, scale, lift, attendant=False, book=False):
    start=len(parts)
    cylinder('Lotus foot',(0,0,.075),1.02,.15,robe)
    cylinder('Lotus rim',(0,0,.19),1.10,.10,edge)
    cylinder('Lotus core',(0,0,.38),.96,.34,robe)
    for j in range(20):
        petal(j*math.tau/20,.48,1.0,False)
        petal((j+.5)*math.tau/20,.30,1.0,True)
    cylinder('Seat',(0,0,.62),.87,.12,gold)
    # Folded knees and layered robe, separate silhouette from the face and hands.
    ell('Crossed left knee',(-.47,-.07,.86),(.60,.48,.25),robe)
    ell('Crossed right knee',(.47,-.07,.86),(.60,.48,.25),robe)
    ell('Seated body',(0,.15,1.32),(.48,.33,.67),robe)
    ell('Chest',(0,.07,1.72),(.51,.29,.46),gold)
    ell('Neck',(0,.025,2.12),(.17,.17,.27))
    # Draped left shoulder with sculpted hem running diagonally across chest.
    ell('Shoulder drape',(-.32,.03,1.82),(.28,.32,.38),robe)
    line('Robe neckline',[(-.43,-.16,2.00),(-.15,-.29,1.72),(.20,-.25,1.46),(.39,-.14,1.27)],.045,edge)
    for i in range(5):
        z=1.62-i*.105
        line('Torso cloth fold',[(-.41,-.16,z+.15),(-.23,-.29,z),(.05,-.29,z-.12),(.32,-.19,z-.18)],.018,robe)
    for side in [-1,1]:
        # Connected shoulders -> elbows -> wrists -> overlapping palms in lap.
        line('Upper arm',[(side*.43,.02,1.88),(side*.60,-.01,1.60),(side*.59,-.12,1.25)],.145,robe if side<0 or attendant else gold)
        line('Forearm',[(side*.59,-.12,1.25),(side*.43,-.37,1.11),(side*.17,-.45,1.08)],.115,gold)
        ell('Elbow',(side*.59,-.12,1.25),(.12,.12,.13),gold,16,12)
        palm=ell('Meditation palm',(side*.07,-.46,1.08+(.055 if side>0 else 0)),(.23,.115,.065))
        for f in range(3):
            line('Subtle finger engraving',[(side*.05,-.55+f*.037,1.12),(side*.23,-.54+f*.037,1.12)],.007,robe)
        ell('Thumb',(side*.07,-.42,1.19),(.065,.055,.09))
        for f in range(5):
            line('Knee robe fold',[(side*.17,-.38,.91+f*.025),(side*.45,-.53,.84+f*.035),(side*.88,-.32,.83+f*.032)],.014,edge)
        ell('Elongated ear',(side*.30,.01,2.43),(.085,.075,.19))
        ell('Ear recess',(side*.315,-.059,2.44),(.037,.018,.115),robe,16,12)
    # Adult, gently tapered face, smaller than a chibi avatar's head.
    ell('Head',(0,.01,2.49),(.30,.255,.39))
    ell('Jaw',(0,-.045,2.33),(.235,.20,.20))
    ell('Nose bridge',(0,-.237,2.46),(.042,.052,.12))
    ell('Nose tip',(0,-.28,2.40),(.062,.044,.042))
    for side in [-1,1]:
        line('Downcast eyelid',[(side*.055,-.252,2.49),(side*.13,-.244,2.47),(side*.215,-.203,2.49)],.011,dark)
        line('Brow',[(side*.055,-.246,2.57),(side*.13,-.247,2.59),(side*.215,-.203,2.56)],.014,robe)
    line('Quiet smile',[(-.10,-.229,2.30),(0,-.256,2.285),(.10,-.229,2.30)],.009,dark)
    ell('Lower lip',(0,-.241,2.27),(.074,.016,.016),gold,16,10)
    ell('Urna',(0,-.251,2.63),(.019,.014,.019),edge,12,8)
    ell('Hair cap',(0,.035,2.71),(.305,.255,.22),dark)
    ell('Ushnisha',(0,.05,2.94),(.13,.13,.15),dark)
    for row in range(5):
        theta=.25+row*.24
        count=max(8,round(28*math.sin(theta)))
        for j in range(count):
            a=j*math.tau/count
            ell('Hair curl',(.307*math.sin(theta)*math.cos(a),.035+.259*math.sin(theta)*math.sin(a),2.70+.225*math.cos(theta)),(.037,.037,.035),dark,8,6)
    # Halo has an open centre: no opaque disc hiding the temple interior.
    line('Aureole',[(.64*math.cos(a),.35,2.42+.72*math.sin(a)) for a in [i*math.tau/64 for i in range(65)]],.028,edge)
    if attendant:
        cylinder('Crown band',(0,.035,2.79),.29,.075,edge)
        for j in range(5):
            a=-math.pi/2+(j-2)*.48
            ell('Crown leaf',(.28*math.cos(a),.035+.25*math.sin(a),2.89),(.065,.045,.17 if j==2 else .12),edge,16,10)
        line('Pectoral',[(-.3,-.22,1.98),(0,-.30,1.67),(.3,-.22,1.98)],.025,edge)
        # Lotus at the shoulder; Prajnaparamita book distinguishes Manjushri.
        line('Lotus stem',[(.24,-.38,1.13),(.75,-.12,1.55),(.76,-.06,2.08)],.018,edge)
        for j in range(8):
            a=j*math.tau/8
            ell('Lotus blossom',(.76+.10*math.cos(a),-.06+.10*math.sin(a),2.10),(.07,.07,.13),edge,12,8)
        if book:
            bpy.ops.mesh.primitive_cube_add(size=1,location=(.76,-.06,2.27))
            o=bpy.context.object; o.scale=(.32,.22,.07); finish(o,'Wisdom scripture',robe)
    for o in parts[start:]:
        o.location=Vector((x,0,lift))+o.location*scale
        o.scale*=scale
        o.name=name+' / '+o.name

# Coordinates as seen by the visitor facing the altar.
statue('Van Thu',-2.45,.80,0,True,True)
statue('Thich Ca',0,1.0,.18)
statue('Pho Hien',2.45,.80,0,True,False)

# Bake static objects into four material batches for mobile rendering.
for mat in [gold,robe,dark,edge]:
    bpy.ops.object.select_all(action='DESELECT')
    selected=[o for o in bpy.context.scene.objects if o.type in {'MESH','CURVE'} and o.data.materials[0]==mat]
    for o in selected:o.select_set(True)
    bpy.context.view_layer.objects.active=selected[0]
    bpy.ops.object.convert(target='MESH'); bpy.ops.object.join()
    o=bpy.context.object; o.name=mat.name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    # Apply triangulation so asset statistics reflect the exported GPU workload.
    mod=o.modifiers.new('Export triangles','TRIANGULATE'); bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Mobile geometry budget','DECIMATE'); mod.ratio=.48
    bpy.ops.object.modifier_apply(modifier=mod.name)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'buddha-altar.glb'),export_format='GLB',use_selection=True)
stats={'triangles':sum(len(o.data.polygons) for o in meshes),'meshes':len(meshes),'bytes':(OUT/'buddha-altar.glb').stat().st_size}
(SOURCE/'stats.json').write_text(json.dumps(stats,indent=2))

# Studio preview is saved separately; camera and lights are not exported to GLB.
world=bpy.context.scene.world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.18,.22,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5
for p,power,size in [((-4,-6,7),1500,5),((5,-2,5),1000,4),((0,4,6),1800,3)]:
    bpy.ops.object.light_add(type='AREA',location=p); o=bpy.context.object; o.data.energy=power; o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector((0,0,1.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4,-12,5))
cam=bpy.context.object; cam.rotation_euler=(Vector((0,0,1.55))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=8.5
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1400;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(SOURCE/'altar-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'buddha-altar.blend'))
bpy.ops.render.render(write_still=True)
print('ALTAR_STATS',json.dumps(stats))
