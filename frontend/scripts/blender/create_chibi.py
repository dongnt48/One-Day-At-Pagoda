"""Two smiling chibi companions with balanced facial placement and plain robes.
Reuses the seamless robe and eight action names, keeps earlier sources intact.
"""
import sys, math, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import bpy
from mathutils import Vector, Matrix, Euler
import create_characters as base
import create_novice as novice

def transform(point):
    x,y,z=point
    return (x,y*1.45,z*.70)

def geometry(female):
    novice.novice_geometry(long_robe=True)
    # Keep only clothing/limbs. Rebuild the face rather than hiding old eye meshes.
    remove=[]
    for obj in base.parts:
        if any(word in obj.name for word in [' palm',' finger',' thumb']):
            side='Left' if obj.name.startswith('Left') else 'Right'
            obj.vertex_groups.clear()
            obj.vertex_groups.new(name=side+'Hand').add(list(range(len(obj.data.vertices))),1,'REPLACE')
        if any(word in obj.name for word in [' foot',' sole',' sandal',' ankle strap']):
            side='Left' if obj.name.startswith('Left') else 'Right'
            obj.vertex_groups.clear()
            obj.vertex_groups.new(name=side+'Foot').add(list(range(len(obj.data.vertices))),1,'REPLACE')
        head=any(g.name=='Head' for g in obj.vertex_groups)
        accessory=any(word in obj.name for word in ['Prayer bead','necklace','Guru bead','Tassel','satchel','Satchel','bag strap','Front overlapping panel','Sash knot','Sash tail','sleeve hem',' finger',' thumb',' toe ','Under lapel','Overlap lapel','Waist sash'])
        if head or accessory:remove.append(obj)
    for obj in remove:
        base.parts.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
    for obj in base.parts:
        # Work in world space so spheres, curves and garments all shrink equally.
        matrix=obj.matrix_world.copy()
        for vertex in obj.data.vertices:
            point=matrix @ vertex.co
            if 'gathered trousers' in obj.name:
                # Taper the hidden waist into the tunic, so the top rim cannot
                # protrude when Body bows independently of the leg bones.
                taper=max(0,min(1,(point.z-.29)/.40))
                center=-.13 if obj.name.startswith('Left') else .13
                point.x=center+(point.x-center)*(1-.65*taper)
                point.y*=1-.65*taper
                if point.z>.47:point.z=.47+(point.z-.47)*.20
            for side in ['Left','Right']:
                leg=obj.vertex_groups.get(side+'Leg')
                if leg and any(g.group==leg.index for g in vertex.groups):
                    shin=obj.vertex_groups.get(side+'Shin') or obj.vertex_groups.new(name=side+'Shin')
                    weight=max(0,min(1,(.44-point.z)/.08))
                    if weight>0:shin.add([vertex.index],weight,'REPLACE')
                    leg.add([vertex.index],1-weight,'REPLACE')
            vertex.co=transform(point)
        obj.matrix_world.identity()
    skin=base.material('Chibi peach skin',(.88,.52,.32),.72)
    smile=base.material('Warm smiling eyes',(.055,.024,.014),.85)
    lip=base.material('Small terracotta smile',(.40,.09,.035),.85)
    blush=base.material('Soft peach cheeks',(.89,.36,.23),.9)
    collar=base.material('Plain round collar',(.30,.32,.42),.95)
    base.garment('Simple round neckline',[(.925,.112,.137,0,0),(.972,.108,.131,0,0)],collar,'Body',32)
    # Single smooth head, enlarged sideways, tiny body: reference ~two heads tall.
    head=base.ellipsoid('Chibi round head',(0,0,1.29),(.46,.42,.43),skin,'Head',48,32)
    for sign in [-1,1]:
        base.ellipsoid('Little ear',(sign*.438,-.005,1.19),(.055,.045,.072),skin,'Head',24,16)
        # Place the smiling eyes around the head's equator, facing forward.
        points=[]
        for j in range(9):
            u=j/8;x=sign*.18+(u-.5)*.135;z=1.27+.033*math.sin(u*math.pi)
            y=-.42*math.sqrt(max(.01,1-(x/.46)**2-((z-1.29)/.43)**2))-.004
            points.append((x,y,z))
        base.tube('Closed smiling eye',points,.010,smile,'Head')
        if female:
            outer=points[0 if sign<0 else -1]
            base.tube('Outer eyelash',[outer,(outer[0]+sign*.023,outer[1]+.006,outer[2]+.016)],.006,smile,'Head')
        # Flush, softly shaded cheek patches instead of raised cheek spheres.
        # Blush is a skin colour gradient on the head, not an attached disc.
    head.data.materials.append(blush)
    colors=head.data.color_attributes.new(name='Blush',type='FLOAT_COLOR',domain='POINT')
    for vertex in head.data.vertices:
        x,y,z=vertex.co
        amount=math.exp(-((abs(x)-.245)/.065)**2-((z+.10)/.045)**2)*max(0,min(1,-y/.20))*.50
        colors.data[vertex.index].color=(.88+(.89-.88)*amount,.52+(.36-.52)*amount,.32+(.23-.32)*amount,1)
    nodes=skin.node_tree.nodes;attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='Blush'
    skin.node_tree.links.new(attr.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
    # Other skin objects need the same base colour when sharing the vertex material.
    for obj in base.parts:
        if obj==head or skin not in list(obj.data.materials):continue
        layer=obj.data.color_attributes.new(name='Blush',type='FLOAT_COLOR',domain='POINT')
        for item in layer.data:item.color=(.88,.52,.32,1)
    points=[]
    for j in range(9):
        u=j/8;x=(u-.5)*.08;z=1.17-.010*math.sin(u*math.pi)
        y=-.42*math.sqrt(max(.01,1-(x/.46)**2-((z-1.29)/.43)**2))-.004
        points.append((x,y,z))
    base.tube('Quiet chibi smile',points,.0035,lip,'Head')

def pose(action,t,rig):
    if action in ['meditate','eat']:
        p=rig.pose.bones
        p['Root'].location.y=-.37 if action=='meditate' else .04
        for sign,side in [(-1,'Left'),(1,'Right')]:
            p[side+'Leg'].rotation_euler.x=-1.45
            p[side+'Leg'].rotation_euler.y=sign*.7 if action=='meditate' else 0
            p[side+'Shin'].rotation_euler.x=1.65 if action=='meditate' else 1.45
            p[side+'Arm'].rotation_euler.x=-.6
        if action=='eat':
            lift=.5-.5*math.cos(t*math.tau)
            bone=p['RightArm'];rest=bone.bone.matrix_local.to_3x3()
            target=Vector((.26-.15*lift,-.45,.77+.29*lift))
            palm=Vector(transform((.40,-.008,.765)))
            original=(rest.inverted() @ (palm-bone.bone.head_local)).normalized()
            direction=rest.inverted() @ (target-bone.bone.head_local).normalized()
            bone.rotation_euler=original.rotation_difference(direction).to_euler('XYZ')
    if action in ['carry','carry_walk']:
        for side in ['Left','Right']:
            rig.pose.bones[side+'Arm'].rotation_euler.x=-.9
            rig.pose.bones[side+'Arm'].rotation_euler.z=0
    if action=='meditate':
        # Aim knees outward and fold the shins inward, rather than lifting knees.
        for sign,side in [(-1,'Left'),(1,'Right')]:
            for suffix,target in [('Leg',(sign*.30,-.18,.12)),('Shin',(sign*.06,-.19,.10))]:
                bpy.context.view_layer.update()
                bone=rig.pose.bones[side+suffix]
                basis=bone.parent.matrix.to_3x3() @ bone.parent.bone.matrix_local.to_3x3().inverted() @ bone.bone.matrix_local.to_3x3()
                direction=basis.inverted() @ (Vector(target)-bone.head).normalized()
                bone.rotation_euler=Vector((0,1,0)).rotation_difference(direction).to_euler('XYZ')
            bpy.context.view_layer.update()
            foot=rig.pose.bones[side+'Foot']
            basis=foot.parent.matrix.to_3x3() @ foot.parent.bone.matrix_local.to_3x3().inverted() @ foot.bone.matrix_local.to_3x3()
            foot.rotation_euler=(basis.inverted() @ foot.bone.matrix_local.to_3x3()).to_euler('XYZ')
    if action=='sit':
        rig.pose.bones['Root'].location.y=-.19
        for side in ['Left','Right']:
            rig.pose.bones[side+'Leg'].rotation_euler.x=-.38
            rig.pose.bones[side+'Shin'].rotation_euler.x=1.95
            rig.pose.bones[side+'Foot'].rotation_euler.x=-1.57
            rig.pose.bones[side+'Arm'].rotation_euler.x=-.20
    if action not in ['bow','incense']:return
    # Aim arms inward/upward from the shoulders to meet at the chest.
    amount=math.sin(math.pi*t)
    if action=='incense':
        # Raise the incense, keep both hands together for three bows, then lower.
        amount=min(1,t/.12,(1-t)/.12)
        phase=max(0,min(1,(t-.15)/.70))
        bow=math.sin(phase*3*math.pi)**2
        rig.pose.bones['Body'].rotation_euler.x=.32*bow
        rig.pose.bones['Head'].rotation_euler.x=.10*bow
    for sign,side in [(-1,'Left'),(1,'Right')]:
        bone=rig.pose.bones[side+'Arm']
        rest=bone.bone.matrix_local.to_3x3()
        target=Vector((sign*.025,-.35,.83))
        direction=(target-bone.bone.head_local).normalized()
        palm=Vector(transform((sign*.40,-.008,.765)))
        original=(rest.inverted() @ (palm-bone.bone.head_local)).normalized()
        local=rest.inverted() @ direction
        bone.rotation_euler=original.rotation_difference(local).to_euler('XYZ')
        bone.rotation_euler=tuple(v*amount for v in bone.rotation_euler)
        bpy.context.view_layer.update()
        hand=rig.pose.bones[side+'Hand']
        desired=Euler((0,math.pi,math.pi/2),'XYZ').to_matrix()
        parent=bone.matrix.to_3x3()
        relative=bone.bone.matrix_local.to_3x3().inverted() @ hand.bone.matrix_local.to_3x3()
        hand.rotation_euler=(relative.inverted() @ parent.inverted() @ desired @ hand.bone.matrix_local.to_3x3()).to_euler('XYZ')
        hand.rotation_euler=tuple(v*amount for v in hand.rotation_euler)

for female in [False,True]:
    slot='female_lam' if female else 'male_lam'
    backup=base.SOURCE/('before-chibi-'+slot+'.glb')
    if not backup.exists():shutil.copy2(base.OUT/(slot+'.glb'),backup)
    name='chibi_female' if female else 'chibi_male'
    hands={side+'Hand':((sign*.40,-.008,.765),(sign*.40,-.008,.825),side+'Arm') for sign,side in [(-1,'Left'),(1,'Right')]}
    for sign,side in [(-1,'Left'),(1,'Right')]:
        hands[side+'Leg']=((sign*.13,0,.8),(sign*.13,0,.4),'Root')
        hands[side+'Shin']=((sign*.13,0,.4),(sign*.13,0,.13),side+'Leg')
        hands[side+'Foot']=((sign*.13,0,.13),(sign*.13,-.10,.13),side+'Shin')
    base.build(female,geometry=lambda:geometry(female),filename=name,bone_transform=transform,pose_override=pose,extra_bones=hands)
    shutil.copy2(base.OUT/(name+'.glb'),base.OUT/(slot+'.glb'))
    # Idle portraits show relaxed arms; greeting is rendered separately.
    rig=bpy.data.objects['PagodaCompanion']
    camera=bpy.context.scene.camera
    for track in rig.animation_data.nla_tracks:track.mute=track.name!='idle'
    bpy.context.scene.frame_set(1)
    bpy.context.scene.render.filepath=str(base.SOURCE/(name+'-idle.png'))
    bpy.ops.render.render(write_still=True)
    for track in rig.animation_data.nla_tracks:track.mute=track.name!='incense'
    bpy.context.scene.frame_set(33)
    camera.location=(5,-2,1.4)
    camera.rotation_euler=(Vector((0,0,.86))-camera.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.scene.render.filepath=str(base.SOURCE/(name+'-incense-side.png'))
    bpy.ops.render.render(write_still=True)
    camera=bpy.context.scene.camera
    for track in rig.animation_data.nla_tracks:track.mute=track.name!='sit'
    bpy.context.scene.frame_set(15)
    camera.location=(3,-4,1.8)
    camera.rotation_euler=(Vector((0,0,.65))-camera.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.scene.render.filepath=str(base.SOURCE/(name+'-kneeling.png'))
    bpy.ops.render.render(write_still=True)
    for track in rig.animation_data.nla_tracks:track.mute=track.name!='idle'
    bpy.context.scene.frame_set(1)
    for angle,location in [('side',(5,0,1.4)),('front',(0,-5,1.4))]:
        camera.location=location
        camera.rotation_euler=(Vector((0,0,.86))-camera.location).to_track_quat('-Z','Y').to_euler()
        bpy.context.scene.render.filepath=str(base.SOURCE/(name+'-'+angle+'.png'))
        bpy.ops.render.render(write_still=True)
    for track in rig.animation_data.nla_tracks:track.mute=track.name!='bow'
    bpy.context.scene.frame_set(33)
    bpy.context.scene.render.filepath=str(base.SOURCE/(name+'-greeting.png'))
    bpy.ops.render.render(write_still=True)
