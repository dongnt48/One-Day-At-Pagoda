"""Original pagoda companions. Run with Blender --background --python this_file.
Blender Z-up, forward -Y; glTF export produces Y-up, forward +Z.
No external model dependencies. Meshes carry bone weights; eight NLA clips.
"""
import bpy, math, os
from mathutils import Vector
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public'/'models'
SOURCE=ROOT.parent/'art'/'characters'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)

def material(name,color,roughness=.6):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
    return m

def finish(obj,name,mat,bone):
    obj.name=name;obj.data.materials.append(mat)
    for f in obj.data.polygons:f.use_smooth=True
    if bone:obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))),1,'REPLACE')
    parts.append(obj);return obj

def ellipsoid(name,loc,scale,mat,bone,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
    o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,bone)

def tube(name,points,radius,mat,bone):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=8;curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj=bpy.context.object
    bpy.ops.object.select_all(action='DESELECT')
    return finish(obj,name,mat,bone)

def garment(name,rings,mat,bone,n=32):
    vertices=[];faces=[]
    for z,rx,ry,cx,cy in rings:
        for j in range(n):
            a=2*math.pi*j/n;fold=1+.018*math.cos(a*8)+.009*math.sin(a*13)
            vertices.append((cx+rx*math.cos(a)*fold,cy+ry*math.sin(a)*fold,z))
    for k in range(len(rings)-1):
        for j in range(n):a=k*n+j;b=k*n+(j+1)%n;faces.append((a,b,b+n,a+n))
    faces.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+j for j in range(n))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    finish(obj,name,mat,bone)
    bevel=obj.modifiers.new('Soft cloth edges','BEVEL');bevel.width=.012;bevel.segments=2
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj

def build(female, geometry=None, filename=None, bone_transform=None, pose_override=None, extra_bones=None):
    global parts
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);parts=[]
    if geometry:
        geometry()
    else:
        cloth=material('Lam · blue grey linen',(.28,.38,.43),.92)
        edge=material('Lam · seams and collar',(.22,.30,.34),.95)
        skin=material('Warm porcelain skin',(.68,.43,.29),.65)
        blush=material('Soft cheek blush',(.72,.32,.27),.85)
        dark=material('Dark chestnut hair',(.045,.029,.024),.72)
        eye=material('Chocolate eyes',(.025,.018,.015),.22)
        white=material('Eye catchlights',(.95,.94,.86),.2)
        sole=material('Sandal sole',(.09,.075,.052),.9)
        strap=material('Sandal leather',(.20,.15,.10),.72)
        # Torso has a curved, loose fabric silhouette rather than a straight cone.
        garment('Loose long sleeved tunic',[(.77,.245,.145,0,0),(.80,.26,.16,0,0),(.95,.235,.155,0,0),(1.15,.245,.16,0,0),(1.30,.24,.145,0,0),(1.35,.18,.125,0,0),(1.37,.10,.105,0,0)],cloth,'Body')
        ellipsoid('Neck',(0,0,1.40),(.105,.10,.12),skin,'Body')
        garment('Standing collar',[(1.34,.12,.115,0,0),(1.42,.115,.105,0,0)],edge,'Body')
        tube('Front placket',[(.035,-.112,1.40),(.045,-.161,1.23),(.045,-.166,1.05),(.045,-.158,.81)],.009,edge,'Body')
        for z in [1.28,1.17,1.06]:
            ellipsoid('Cloth knot',(0.045,-.17,z),(.015,.012,.012),edge,'Body',12,8)
            tube('Loop fastening',[(.05,-.17,z),(.085,-.17,z+.006),(.10,-.166,z)],.0045,edge,'Body')
        for s in [-1,1]:
            side='Left' if s<0 else 'Right'
            x=s*.285
            ellipsoid(side+' rounded shoulder',(s*.25,0,1.285),(.13,.12,.115),cloth,side+'Arm')
            garment(side+' sleeve',[(.91,.083,.083,s*.34,0),(1.02,.105,.105,s*.33,0),(1.19,.115,.12,s*.30,0),(1.30,.11,.115,x,0)],cloth,side+'Arm',24)
            garment(side+' cuff',[(.91,.085,.086,s*.34,0),(.955,.09,.09,s*.338,0)],edge,side+'Arm',24)
            ellipsoid(side+' mitten hand',(s*.343,-.005,.865),(.072,.06,.095),skin,side+'Arm')
            ellipsoid(side+' thumb',(s*.288,-.035,.88),(.031,.037,.05),skin,side+'Arm',16,10)
            garment(side+' trouser leg',[(.13,.105,.10,s*.13,0),(.19,.12,.11,s*.13,0),(.40,.125,.12,s*.13,0),(.65,.13,.125,s*.13,0),(.83,.14,.13,s*.13,0)],cloth,side+'Leg',24)
            tube(side+' trouser seam',[(s*.24,0,.18),(s*.25,.015,.42),(s*.25,0,.72)],.004,edge,side+'Leg')
            ellipsoid(side+' foot',(s*.13,-.055,.105),(.103,.17,.065),skin,side+'Leg')
            ellipsoid(side+' sole',(s*.13,-.06,.055),(.12,.19,.045),sole,side+'Leg')
            tube(side+' sandal strap',[(s*.13-.095,-.07,.09),(s*.13-.05,-.09,.16),(s*.13+.05,-.09,.16),(s*.13+.095,-.07,.09)],.022,strap,side+'Leg')
        # Rounded stylized head, eyes and cheek volumes, all bound to Head.
        ellipsoid('Soft round face',(0,-.005,1.66),(.285,.245,.30),skin,'Head',32,24)
        ellipsoid('Chin',(0,-.085,1.49),(.18,.16,.12),skin,'Head')
        for s in [-1,1]:
            ellipsoid('Ear',(s*.278,-.005,1.64),(.055,.043,.073),skin,'Head',20,12)
            ellipsoid('Ear inset',(s*.307,-.025,1.64),(.015,.025,.038),blush,'Head',12,10)
            ellipsoid('Cheek',(s*.17,-.205,1.565),(.055,.012,.025),blush,'Head',20,12)
            ellipsoid('Eye',(s*.105,-.233,1.665),(.039,.025,.052),eye,'Head')
            ellipsoid('Eye glint',(s*.105-.011,-.256,1.685),(.011,.006,.014),white,'Head',12,10)
            tube('Eyebrow',[(s*.105-.035,-.218,1.75),(s*.105,-.229,1.764),(s*.105+.033,-.218,1.753)],.008,dark,'Head')
        ellipsoid('Button nose',(0,-.251,1.602),(.027,.025,.027),skin,'Head',16,12)
        tube('Quiet smile',[(-.039,-.235,1.535),(0,-.249,1.523),(.039,-.235,1.535)],.0055,strap,'Head')
        # Custom hair cap stops at the forehead; no oversized sphere over the eyes.
        vertices=[];faces=[];n=40;rows=12
        for i in range(rows+1):
            for j in range(n):
                a=j/n*math.tau
                front=(1-math.sin(a))/2
                end=1.85-.62*front
                theta=.025+i/rows*end
                vertices.append((.292*math.sin(theta)*math.cos(a),.252*math.sin(theta)*math.sin(a),1.68+.30*math.cos(theta)))
        for i in range(rows):
            for j in range(n):a=i*n+j;b=i*n+(j+1)%n;faces.append((a,b,b+n,a+n))
        mesh=bpy.data.meshes.new('Hair cap');mesh.from_pydata(vertices,[],faces);mesh.update()
        obj=bpy.data.objects.new('Tidy hair',mesh);bpy.context.collection.objects.link(obj);finish(obj,'Tidy hair',dark,'Head')
        for i in range(5 if female else 4):
            x=-.18+i*.075
            lock=ellipsoid('Soft swept fringe',(x,-.19,1.84-abs(x)*.2),(.085,.074,.13),dark,'Head',20,12);lock.rotation_euler.y=-.35
        if female:
            ellipsoid('Low hair bun',(0,.235,1.65),(.14,.11,.14),dark,'Head')
            for s in [-1,1]:ellipsoid('Side hair',(s*.25,.005,1.70),(.045,.15,.16),dark,'Head')
    # Join material islands into a single deformable mesh with bone vertex groups.
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name='FemaleLamMesh' if female else 'MaleLamMesh'
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    armature=bpy.data.armatures.new('PagodaRig');rig=bpy.data.objects.new('PagodaCompanion',armature);bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;body.select_set(False);rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    bones={
        'Root':((0,0,0),(0,0,.2),None),
        'Body':((0,0,.80),(0,0,1.4),'Root'),
        'Head':((0,0,1.43),(0,0,1.9),'Body'),
        'LeftArm':((-.27,0,1.3),(-.34,0,.87),'Body'),
        'RightArm':((.27,0,1.3),(.34,0,.87),'Body'),
        'LeftLeg':((-.13,0,.8),(-.13,0,.13),'Root'),
        'RightLeg':((.13,0,.8),(.13,0,.13),'Root')}
    if extra_bones:bones.update(extra_bones)
    for name,(head,tail,parent) in bones.items():
        b=armature.edit_bones.new(name);b.head=bone_transform(head) if bone_transform else head;b.tail=bone_transform(tail) if bone_transform else tail
        if parent:b.parent=armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT');body.parent=rig;modifier=body.modifiers.new('Soft character rig','ARMATURE');modifier.object=rig
    scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=90
    # Eight self-contained clips key every bone, preventing stale poses on transitions.
    lengths={'idle':90,'walk':24,'wave':66,'bow':66,'sit':30,'incense':181,'sweep':45,'water':60,'meditate':90,'eat':90,'carry':90,'carry_walk':24}
    for name,length in lengths.items():
        rig.animation_data_create();rig.animation_data.action=None
        frames=list(range(1,length+1,3))
        if frames[-1]!=length:frames.append(length)
        for frame in frames:
            t=(frame-1)/(length-1);scene.frame_set(frame)
            for p in rig.pose.bones:p.rotation_mode='XYZ';p.rotation_euler=(0,0,0);p.location=(0,0,0)
            p=rig.pose.bones;beat=math.sin(t*math.tau);ease=math.sin(t*math.pi)
            if name=='idle':p['Body'].location.y=beat*.009;p['Head'].rotation_euler.z=beat*.018
            elif name in ['walk','carry_walk']:
                p['LeftLeg'].rotation_euler.x=beat*.42;p['RightLeg'].rotation_euler.x=-beat*.42
                p['LeftArm'].rotation_euler.x=-beat*.32;p['RightArm'].rotation_euler.x=beat*.32;p['Body'].location.y=abs(beat)*.025
            elif name=='wave':p['RightArm'].rotation_euler.z=-2.35*min(1,t*6,(1-t)*6);p['RightArm'].rotation_euler.x=math.sin(t*math.tau*3)*.25;p['Head'].rotation_euler.z=ease*.08
            elif name=='bow':p['Body'].rotation_euler.x=ease*.48;p['LeftArm'].rotation_euler.x=-ease*.8;p['RightArm'].rotation_euler.x=-ease*.8
            elif name=='sit':p['Root'].location.y=-.65;p['LeftLeg'].rotation_euler.x=-1.48;p['RightLeg'].rotation_euler.x=-1.48;p['LeftArm'].rotation_euler.x=-.35;p['RightArm'].rotation_euler.x=-.35
            elif name=='incense':p['LeftArm'].rotation_euler.x=-1.15*ease;p['RightArm'].rotation_euler.x=-1.15*ease;p['Head'].rotation_euler.x=ease*.16
            elif name=='sweep':p['Body'].rotation_euler.x=.16;p['Body'].rotation_euler.z=beat*.12;p['LeftArm'].rotation_euler.x=-.5+beat*.25;p['RightArm'].rotation_euler.x=-.7+beat*.25
            elif name=='water':p['Body'].rotation_euler.x=.12;p['RightArm'].rotation_euler.x=-.9+beat*.12;p['RightArm'].rotation_euler.z=-.25
            if pose_override:pose_override(name,t,rig)
            for bone in rig.pose.bones:bone.keyframe_insert('rotation_euler',frame=frame,group=bone.name);bone.keyframe_insert('location',frame=frame,group=bone.name)
        action=rig.animation_data.action;action.name=name
        track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
    rig.animation_data.action=None
    for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
    scene.frame_set(1)
    rig['asset_author']='One Day At Pagoda original procedural Blender artwork'
    bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
    filename=filename or ('female_lam' if female else 'male_lam')
    # Muted NLA tracks are enabled only for export; NLA mode samples each separately.
    for track in rig.animation_data.nla_tracks:track.mute=False
    bpy.ops.export_scene.gltf(filepath=str(OUT/(filename+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_nla_strips=True,export_yup=True,export_skins=True,export_extras=True)
    for track in rig.animation_data.nla_tracks:track.mute=True
    for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
    scene.frame_set(1)
    # Editable source includes a portrait studio setup, excluded from GLB.
    floor=material('Preview backdrop',(.75,.77,.69),1)
    bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.data.materials.append(floor)
    def area(loc,power,size):
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
    area((3,-4,6),450,5);area((-3,-1,3),200,4);area((0,3,4),350,3)
    bpy.ops.object.camera_add(location=(2.3,-5,2.6));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.02))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.6;scene.camera=camera
    scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=640;scene.render.resolution_y=800;scene.render.resolution_percentage=100
    scene.world.color=(.3,.3,.3);scene.render.image_settings.file_format='PNG';scene.render.filepath=str(SOURCE/(filename+'-preview.png'))
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(filename+'.blend')))
    bpy.ops.render.render(write_still=True)

if __name__ == '__main__':
    for female in [False,True]:build(female)
