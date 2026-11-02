"""Reference-inspired novice: original geometry, existing eight-clip game rig.
Run from any directory with Blender --background --python this_file.
Keeps the previous .blend sources and female avatar; installs novice as male.
"""
import sys, math, shutil
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_characters as base
import bpy
from mathutils import Vector

def seamless_robe(objects, long_robe=False):
    """Weld body, shoulders and sleeves; blend skin weights across each shoulder."""
    if long_robe:
        # A complete torso under overlapping shoulder caps prevents the sleeve
        # from pulling an open web out of the side when both arms are raised.
        for side, pair in [('Left',objects[1:3]),('Right',objects[3:5])]:
            seamless_robe(pair)
            sleeve=pair[0]
            sleeve.vertex_groups.clear()
            sleeve.vertex_groups.new(name=side+'Arm').add(list(range(len(sleeve.data.vertices))),1,'REPLACE')
        return
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    merged=objects[0]
    bpy.context.view_layer.objects.active=merged
    for obj in objects[1:]:base.parts.remove(obj)
    bpy.ops.object.join()
    merged.name='Continuous robe and sleeves'
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    remesh=merged.modifiers.new('Weld shoulder seams','REMESH')
    remesh.mode='VOXEL';remesh.voxel_size=.016;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=merged.modifiers.new('Relax cloth junctions','SMOOTH')
    smooth.factor=.8;smooth.iterations=5
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    decimate=merged.modifiers.new('Game mesh budget','DECIMATE');decimate.ratio=.55
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    merged.vertex_groups.clear()
    groups={name:merged.vertex_groups.new(name=name) for name in ['Body','LeftArm','RightArm']}
    for v in merged.data.vertices:
        x,y,z=v.co
        # Keep the torso fixed below the armpit; smoothly attach upper shoulders.
        shoulder=max(0,min(1,(z-1.08)/.20))
        inner=.255-.095*shoulder
        t=max(0,min(1,(abs(x)-inner)/(.35-inner)))
        weight=t*t*(3-2*t)
        if weight<1:groups['Body'].add([v.index],1-weight,'REPLACE')
        if weight>0:groups['LeftArm' if x<0 else 'RightArm'].add([v.index],weight,'REPLACE')
    # Topology regression: the robe must be one connected surface, not joined islands.
    adjacency=[[] for _ in merged.data.vertices]
    for edge in merged.data.edges:
        a,b=edge.vertices;adjacency[a].append(b);adjacency[b].append(a)
    seen={0};pending=[0]
    while pending:
        for neighbor in adjacency[pending.pop()]:
            if neighbor not in seen:seen.add(neighbor);pending.append(neighbor)
    assert len(seen)==len(adjacency), 'Robe/sleeves must form one connected mesh'
    print('Continuous robe verified:',len(seen),'vertices, blended shoulder weights')

def ribbon(name, points, width, mat, bone='Body'):
    vertices=[]
    for x,y,z in points:
        vertices.extend([(x-width/2,y,z),(x+width/2,y,z)])
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    base.finish(obj,name,mat,bone)
    bpy.context.view_layer.objects.active=obj
    solid=obj.modifiers.new('Cloth thickness','SOLIDIFY');solid.thickness=.008
    bpy.ops.object.modifier_apply(modifier=solid.name)
    bevel=obj.modifiers.new('Rounded seams','BEVEL');bevel.width=.006;bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)

def novice_geometry(long_robe=False):
    mat=base.material;ball=base.ellipsoid;cloth=base.garment;line=base.tube
    robe=mat('Novice - lavender grey linen',(.32,.34,.44),.93)
    trim=mat('Folded linen edges',(.25,.27,.36),.96)
    skin=mat('Peach skin',(.76,.48,.33),.60)
    pink=mat('Inner ears and blush',(.73,.32,.23),.86)
    whites=mat('Warm eye whites',(.92,.87,.78),.3)
    iris=mat('Warm brown iris',(.105,.052,.028),.28)
    pupil=mat('Deep pupils',(.012,.008,.006),.2)
    glint=mat('Eye reflections',(.98,.98,.94),.16)
    brow=mat('Fine brown brows',(.14,.065,.035),.85)
    mouth=mat('Smile',(.32,.085,.045),.7)
    beads=mat('Polished wooden prayer beads',(.18,.075,.027),.4)
    bag=mat('Brown canvas bag',(.09,.07,.056),.95)
    leather=mat('Dark sandal straps',(.035,.027,.023),.75)
    # Subtle woven bump in the editable source; glTF uses the same base colour.
    nodes=robe.node_tree.nodes;noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.14;bump.inputs['Distance'].default_value=.008
    robe.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height'])
    robe.node_tree.links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
    ball('Neck',(0,0,1.40),(.105,.095,.14),skin,'Body')
    torso=[(.69,.27,.165,0,0),(.75,.275,.17,0,0),(.98,.24,.155,0,0),(1.18,.25,.16,0,0),(1.30,.25,.14,0,0),(1.36,.15,.11,0,0)]
    if long_robe:
        # Shape the skirt BEFORE welding and skinning. Stretching selected
        # weighted vertices afterwards produced spikes below the armpits.
        torso=[(.36,.315,.177,0,0),(.46,.32,.18,0,0),(.72,.29,.17,0,0),(.98,.24,.155,0,0),*torso[3:]]
    robe_parts=[cloth('Wrap robe',torso,robe,'Body',40)]
    # Two crossing lapels meet below a V neckline; no standing collar/buttons.
    ribbon('Under lapel',[(.095,-.09,1.40),(.06,-.145,1.31),(-.02,-.17,1.20),(-.13,-.174,1.08)],.065,trim)
    ribbon('Overlap lapel',[(-.095,-.095,1.40),(-.055,-.15,1.31),(.025,-.184,1.20),(.14,-.18,1.05)],.074,robe)
    ribbon('Front overlapping panel',[(.08,-.178,1.06),(.075,-.181,.94),(.08,-.182,.80),(.06,-.183,.68)],.27,robe)
    cloth('Waist sash',[(.995,.248,.169,0,0),(1.05,.25,.169,0,0)],trim,'Body',40)
    ball('Sash knot',(-.18,-.18,1.025),(.052,.031,.037),robe,'Body')
    ribbon('Sash tail left',[(-.18,-.194,1.02),(-.19,-.198,.87),(-.23,-.192,.72)],.065,trim)
    ribbon('Sash tail right',[(-.14,-.20,1.01),(-.10,-.202,.88),(-.12,-.195,.77)],.055,robe)
    for sign in [-1,1]:
        side='Left' if sign<0 else 'Right';arm=side+'Arm';leg=side+'Leg'
        robe_parts.append(ball(side+' soft shoulder',(sign*.25,0,1.28),(.13,.125,.13),robe,arm))
        robe_parts.append(cloth(side+' wide sleeve',[(.82,.14,.125,sign*.40,0),(.88,.14,.125,sign*.395,0),(1.09,.125,.125,sign*.38,0),(1.23,.12,.12,sign*.31,0),(1.31,.10,.11,sign*.27,0)],robe,arm,32))
        cloth(side+' sleeve hem',[(.815,.141,.126,sign*.40,0),(.84,.141,.126,sign*.40,0)],trim,arm,32)
        ball(side+' palm',(sign*.40,-.008,.765),(.065,.045,.09),skin,arm)
        for j in range(4):
            ball(side+f' finger {j}',(sign*(.358+j*.026),-.016,.712-((j+1)%3)*.006),(.015,.033,.045),skin,arm,12,8)
        ball(side+' thumb',(sign*.343,-.025,.767),(.025,.034,.054),skin,arm,16,10)
        cloth(side+' gathered trousers',[(.14,.083,.085,sign*.13,0),(.20,.115,.115,sign*.13,0),(.29,.148,.14,sign*.14,0),(.47,.15,.14,sign*.14,0),(.65,.145,.135,sign*.13,0),(.81,.14,.13,sign*.13,0)],robe,leg,32)
        cloth(side+' ankle gathering',[(.14,.085,.086,sign*.13,0),(.19,.09,.09,sign*.13,0)],trim,leg,24)
        ball(side+' foot',(sign*.13,-.055,.10),(.10,.16,.06),skin,leg)
        ball(side+' sandal sole',(sign*.13,-.06,.04),(.115,.18,.035),leather,leg)
        for j in range(5):ball(side+f' toe {j}',(sign*.13-.07+j*.035,-.18,.093),(.022,.036,.024),skin,leg,12,8)
        line(side+' front sandal strap',[(sign*.13-.095,-.09,.075),(sign*.13-.05,-.11,.15),(sign*.13+.05,-.11,.15),(sign*.13+.095,-.09,.075)],.019,leather,leg)
        line(side+' ankle strap',[(sign*.13-.085,.02,.08),(sign*.13-.065,.07,.15),(sign*.13+.065,.07,.15),(sign*.13+.085,.02,.08)],.017,leather,leg)
    seamless_robe(robe_parts,long_robe=long_robe)
    # Large bald cranium with a lower, softly tapered face, approximately 1:3 proportions.
    skull=ball('Bald rounded head',(0,.006,1.74),(.355,.29,.365),skin,'Head',48,32)
    face=ball('Soft lower face',(0,-.055,1.56),(.27,.245,.19),skin,'Head',40,24)
    # Fuse the volumes so the cheeks and cranium have no intersecting seam.
    bpy.ops.object.select_all(action='DESELECT');skull.select_set(True);face.select_set(True)
    bpy.context.view_layer.objects.active=skull;bpy.ops.object.join();base.parts.remove(face)
    remesh=skull.modifiers.new('Unified face volume','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.012;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=skull.modifiers.new('Soft facial transitions','SMOOTH');smooth.factor=1.1;smooth.iterations=6
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    skull.vertex_groups.clear();skull.vertex_groups.new(name='Head').add(list(range(len(skull.data.vertices))),1,'REPLACE')
    for sign in [-1,1]:
        ball('Ear',(sign*.34,-.005,1.60),(.075,.047,.095),skin,'Head',24,16)
        ball('Ear concha',(sign*.371,-.039,1.605),(.035,.012,.055),pink,'Head',20,12)
        # Eye volumes follow the face surface instead of floating ahead of it.
        x=sign*.137
        ball('Eye white',(x,-.258,1.68),(.084,.023,.094),whites,'Head',32,20)
        ball('Brown iris',(x,-.277,1.675),(.061,.013,.075),iris,'Head',32,20)
        ball('Pupil',(x,-.288,1.678),(.039,.008,.052),pupil,'Head',24,16)
        ball('Large eye glint',(x-.018,-.297,1.708),(.014,.004,.016),glint,'Head',16,10)
        ball('Small eye glint',(x+.022,-.295,1.651),(.006,.003,.007),glint,'Head',12,8)
        line('Upper eyelid',[(x-.076,-.266,1.703),(x-.045,-.271,1.756),(x+.025,-.270,1.768),(x+.073,-.259,1.722)],.005,brow,'Head')
        line('Gentle eyebrow',[(x-.06,-.244,1.824),(x-.015,-.261,1.849),(x+.035,-.251,1.846),(x+.066,-.233,1.828)],.006,brow,'Head')
    ball('Tiny nose',(0,-.307,1.59),(.028,.026,.026),skin,'Head',24,16)
    line('Small curved smile',[(-.062,-.289,1.521),(-.025,-.299,1.510),(.025,-.299,1.511),(.064,-.288,1.532)],.0055,mouth,'Head')
    # A closed 3D necklace: across the nape, around the neck, down the robe.
    # Front is -Y. The old planar oval never passed behind the neck.
    right=[(0,.127,1.385),(.115,.10,1.385),(.16,.015,1.385),
           (.175,-.145,1.32),(.15,-.173,1.235),(.13,-.207,1.12),
           (.09,-.209,1.005),(0,-.217,.945)]
    anchors=[Vector(p) for p in right+ [(-x,y,z) for x,y,z in right[-2:0:-1]]]
    path=[]
    for i,p1 in enumerate(anchors):
        p0,p2,p3=anchors[i-1],anchors[(i+1)%len(anchors)],anchors[(i+2)%len(anchors)]
        for j in range(20):
            t=j/20
            path.append((2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)*.5)
    path.append(path[0])
    lengths=[0]
    for a,b in zip(path,path[1:]):lengths.append(lengths[-1]+(b-a).length)
    count=round(lengths[-1]/.050)
    cursor=0
    for i in range(count):
        distance=i*lengths[-1]/count
        while lengths[cursor+1]<distance:cursor+=1
        t=(distance-lengths[cursor])/(lengths[cursor+1]-lengths[cursor])
        point=path[cursor].lerp(path[cursor+1],t)
        ball(f'Prayer bead {i}',point,(.024,.024,.024),beads,'Body',12,10)
    line('Closed necklace cord',[tuple(p) for p in anchors]+[tuple(anchors[0])],.003,beads,'Body')
    ball('Guru bead',(0,-.217,.906),(.030,.027,.034),beads,'Body',20,12)
    for i in range(9):
        x=(i-4)*.006
        line('Tassel strand',[(x,-.217,.878),(x*1.3,-.218,.81),(x*1.6,-.216,.75)],.0045,beads,'Body')
    # Side satchel and strap wrap around the torso, leaving the neckline visible.
    ball('Canvas satchel',(.32,.06,.78),(.16,.115,.21),bag,'Body',32,20)
    ribbon('Front bag strap',[(-.20,-.055,1.33),(-.14,-.18,1.23),(.02,-.204,1.08),(.20,-.17,.94),(.34,-.04,.83)],.057,bag)
    ribbon('Back bag strap',[(-.20,.06,1.33),(-.10,.16,1.20),(.07,.178,1.02),(.25,.16,.88),(.34,.11,.83)],.057,bag)
    line('Satchel flap seam',[(.22,-.045,.84),(.30,-.058,.80),(.41,-.025,.84)],.005,trim,'Body')

if __name__ == '__main__':
    base.build(False, geometry=novice_geometry, filename='novice')
    # Preserve the old male GLB exactly once before changing the game's fixed slot.
    backup=base.SOURCE/'previous-male_lam.glb'
    if not backup.exists():shutil.copy2(base.OUT/'male_lam.glb',backup)
    shutil.copy2(base.OUT/'novice.glb',base.OUT/'male_lam.glb')
    print('Novice installed in the male avatar slot; female and original .blend sources preserved.')
