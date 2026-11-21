"""Blender scene: the giant red laced boxing glove spinning in a hangar, a real hand grabs it.

Run with the bpy module:  python scene.py <assets_dir> <out_dir> [still FRAME | anim START END] [--res PCT] [--spp N]
assets_dir holds glove.npz (glove_geo.py), logo.png, the Poly Haven hangar HDR and leather maps, right.glb (hand).
"""
import math
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

A, OUT = sys.argv[1], sys.argv[2]
MODE = sys.argv[3]
ARGS = sys.argv[4:]
RES = int(ARGS[ARGS.index('--res') + 1]) if '--res' in ARGS else 100
SPP = int(ARGS[ARGS.index('--spp') + 1]) if '--spp' in ARGS else 96
FPS = 30
HOOK = Vector((0.0, 0.0, 0.62))

# ---------------------------------------------------------------- timeline (frames @30)
T_GRAB = 100        # fingers closed on the glove
T_REACH = T_GRAB - 22
T_END = T_GRAB + 22  # last frame (the yank fills the lens)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SPP
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.02
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 5
sc.cycles.diffuse_bounces = 2
sc.cycles.glossy_bounces = 2
sc.cycles.transmission_bounces = 4
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 1.0
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.resolution_percentage = RES
sc.render.fps = FPS
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.5
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Punchy'
sc.view_settings.exposure = 0.0
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_depth = '16'
sc.render.use_persistent_data = True
sc.render.film_transparent = False
sc.frame_start, sc.frame_end = 1, T_END


def mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def img(path, non_color=False):
    i = bpy.data.images.load(path)
    if non_color:
        i.colorspace_settings.name = 'Non-Color'
    return i


# ---------------------------------------------------------------- world: the hangar
w = bpy.data.worlds.new('hangar')
sc.world = w
w.use_nodes = True
wn, wl = w.node_tree.nodes, w.node_tree.links
wn.clear()
env = wn.new('ShaderNodeTexEnvironment')
env.image = img(f'{A}/small_hangar_01_4k.hdr')
tc = wn.new('ShaderNodeTexCoord')
mp = wn.new('ShaderNodeMapping')
mp.inputs['Rotation'].default_value = (0, 0, math.radians(float(ARGS[ARGS.index('--rot') + 1]) if '--rot' in ARGS else 115))
wl.new(tc.outputs['Generated'], mp.inputs['Vector'])
wl.new(mp.outputs['Vector'], env.inputs['Vector'])
bg = wn.new('ShaderNodeBackground')
bg.inputs['Strength'].default_value = 0.55
# moodier, darker plate seen by the camera; the lighting keeps the full HDR
bgc = wn.new('ShaderNodeBackground')
bgc.inputs['Strength'].default_value = 0.22
lp = wn.new('ShaderNodeLightPath')
mix = wn.new('ShaderNodeMixShader')
wl.new(env.outputs['Color'], bg.inputs['Color'])
env_blur = wn.new('ShaderNodeTexEnvironment')  # what the lens sees: pre-blurred plate, so the DOF stays clean
env_blur.image = img(f'{A}/hangar_blur.hdr')
wl.new(mp.outputs['Vector'], env_blur.inputs['Vector'])
wl.new(env_blur.outputs['Color'], bgc.inputs['Color'])
wl.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
wl.new(bg.outputs['Background'], mix.inputs[1])
wl.new(bgc.outputs['Background'], mix.inputs[2])
wo = wn.new('ShaderNodeOutputWorld')
wl.new(mix.outputs['Shader'], wo.inputs['Surface'])

# ---------------------------------------------------------------- leather
def leather(name, base=(0.62, 0.018, 0.016), scale=9.0, coat=0.55):
    m, n, l = mat(name)
    n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    p = n.new('ShaderNodeBsdfPrincipled')
    l.new(p.outputs['BSDF'], out.inputs['Surface'])
    tco = n.new('ShaderNodeTexCoord')
    mpn = n.new('ShaderNodeMapping')
    mpn.inputs['Scale'].default_value = (scale, scale, scale)
    l.new(tco.outputs['Object'], mpn.inputs['Vector'])

    def tex(path, nc):
        t = n.new('ShaderNodeTexImage')
        t.image = img(path, nc)
        t.projection = 'BOX'
        t.projection_blend = 0.35
        l.new(mpn.outputs['Vector'], t.inputs['Vector'])
        return t

    col = tex(f'{A}/leather_coll1.jpg', False)
    rough = tex(f'{A}/leather_rough.jpg', True)
    nor = tex(f'{A}/leather_nor_gl.jpg', True)
    # the texture's grain as a multiplier on our crimson
    bw = n.new('ShaderNodeRGBToBW')
    l.new(col.outputs['Color'], bw.inputs['Color'])
    gain = n.new('ShaderNodeMath'); gain.operation = 'MULTIPLY'; gain.inputs[1].default_value = 4.4
    l.new(bw.outputs['Val'], gain.inputs[0])
    tint = n.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'
    tint.inputs['Factor'].default_value = 1.0
    tint.inputs['A'].default_value = (*base, 1)
    gcol = n.new('ShaderNodeCombineColor')
    for k in ('Red', 'Green', 'Blue'):
        l.new(gain.outputs['Value'], gcol.inputs[k])
    l.new(gcol.outputs['Color'], tint.inputs['B'])
    # worn edges: pointiness lifts and darkens the high spots a little, like handled leather
    geo = n.new('ShaderNodeNewGeometry')
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.5
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.56
    ramp.color_ramp.elements[1].color = (0.72, 0.72, 0.72, 1)
    l.new(geo.outputs['Pointiness'], ramp.inputs['Fac'])
    wear = n.new('ShaderNodeMix'); wear.data_type = 'RGBA'; wear.blend_type = 'MULTIPLY'
    wear.inputs['Factor'].default_value = 1.0
    l.new(tint.outputs['Result'], wear.inputs['A'])
    l.new(ramp.outputs['Color'], wear.inputs['B'])
    ao = n.new('ShaderNodeAmbientOcclusion')
    ao.inputs['Distance'].default_value = 0.02
    aor = n.new('ShaderNodeMapRange')
    aor.inputs['To Min'].default_value = 0.45
    l.new(ao.outputs['AO'], aor.inputs['Value'])
    aom = n.new('ShaderNodeMix'); aom.data_type = 'RGBA'; aom.blend_type = 'MULTIPLY'
    aom.inputs['Factor'].default_value = 1.0
    l.new(wear.outputs['Result'], aom.inputs['A'])
    l.new(aor.outputs['Result'], aom.inputs['B'])
    wear = aom
    l.new(wear.outputs['Result'], p.inputs['Base Color'])
    rr = n.new('ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = 0.22
    rr.inputs['To Max'].default_value = 0.52
    l.new(rough.outputs['Color'], rr.inputs['Value'])
    l.new(rr.outputs['Result'], p.inputs['Roughness'])
    nm = n.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = 1.6
    l.new(nor.outputs['Color'], nm.inputs['Color'])
    # big soft creases from the stuffing, on top of the grain
    noi = n.new('ShaderNodeTexNoise')
    noi.inputs['Scale'].default_value = 22.0
    noi.inputs['Detail'].default_value = 3.0
    l.new(tco.outputs['Object'], noi.inputs['Vector'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.18
    bump.inputs['Distance'].default_value = 0.002
    # flex creases where the fist meets the wrist: distorted bands, masked to that ring
    crease = n.new('ShaderNodeTexWave')
    crease.wave_type = 'BANDS'
    crease.bands_direction = 'Z'
    crease.inputs['Scale'].default_value = 30.0
    crease.inputs['Distortion'].default_value = 7.0
    crease.inputs['Detail'].default_value = 2.0
    l.new(tco.outputs['Object'], crease.inputs['Vector'])
    zsep = n.new('ShaderNodeSeparateXYZ')
    l.new(tco.outputs['Object'], zsep.inputs['Vector'])
    band = n.new('ShaderNodeMapRange')
    band.interpolation_type = 'SMOOTHERSTEP'
    band.inputs['From Min'].default_value = 0.045
    band.inputs['From Max'].default_value = 0.0
    l.new(zsep.outputs['Z'], band.inputs['Value'])
    band2 = n.new('ShaderNodeMapRange')
    band2.interpolation_type = 'SMOOTHERSTEP'
    band2.inputs['From Min'].default_value = -0.05
    band2.inputs['From Max'].default_value = 0.0
    l.new(zsep.outputs['Z'], band2.inputs['Value'])
    bm = n.new('ShaderNodeMath'); bm.operation = 'MULTIPLY'
    l.new(band.outputs['Result'], bm.inputs[0]); l.new(band2.outputs['Result'], bm.inputs[1])
    cr = n.new('ShaderNodeMath'); cr.operation = 'MULTIPLY'
    l.new(crease.outputs['Fac'], cr.inputs[0]); l.new(bm.outputs['Value'], cr.inputs[1])
    hsum = n.new('ShaderNodeMath'); hsum.operation = 'MULTIPLY_ADD'
    hsum.inputs[1].default_value = 0.25
    l.new(noi.outputs['Fac'], hsum.inputs[0]); l.new(cr.outputs['Value'], hsum.inputs[2])
    l.new(hsum.outputs['Value'], bump.inputs['Height'])
    l.new(nm.outputs['Normal'], bump.inputs['Normal'])
    l.new(bump.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = 0.16
    p.inputs['Specular IOR Level'].default_value = 0.55
    return m, n, l, p, wear


GLOVE_MAT, gn, gl, gp, gwear = leather('leather_red')
# the print: BOXE / ACADÉMIE on the back of the hand, white ink with a little crackle
gtc = gn.new('ShaderNodeTexCoord')
sep = gn.new('ShaderNodeSeparateXYZ')
gl.new(gtc.outputs['Object'], sep.inputs['Vector'])
u = gn.new('ShaderNodeMapRange'); u.inputs['From Min'].default_value = 0.078; u.inputs['From Max'].default_value = -0.078
v = gn.new('ShaderNodeMapRange'); v.inputs['From Min'].default_value = -0.112; v.inputs['From Max'].default_value = -0.034
for node in (u, v):
    node.clamp = False
gl.new(sep.outputs['X'], u.inputs['Value'])
gl.new(sep.outputs['Z'], v.inputs['Value'])
cxyz = gn.new('ShaderNodeCombineXYZ')
gl.new(u.outputs['Result'], cxyz.inputs['X'])
gl.new(v.outputs['Result'], cxyz.inputs['Y'])
logo = gn.new('ShaderNodeTexImage')
logo.image = img(f'{A}/logo.png')
logo.extension = 'CLIP'
gl.new(cxyz.outputs['Vector'], logo.inputs['Vector'])
facing = gn.new('ShaderNodeMapRange')  # only on the back (+Y) panel
facing.inputs['From Min'].default_value = 0.25
facing.inputs['From Max'].default_value = 0.45
gsep = gn.new('ShaderNodeSeparateXYZ')
ggeo = gn.new('ShaderNodeNewGeometry')
vt = gn.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'OBJECT'
gl.new(ggeo.outputs['Normal'], vt.inputs['Vector'])
gl.new(vt.outputs['Vector'], gsep.inputs['Vector'])
gl.new(gsep.outputs['Y'], facing.inputs['Value'])
crack = gn.new('ShaderNodeTexVoronoi')
crack.feature = 'DISTANCE_TO_EDGE'
crack.inputs['Scale'].default_value = 260
gl.new(gtc.outputs['Object'], crack.inputs['Vector'])
crk = gn.new('ShaderNodeMapRange'); crk.inputs['From Min'].default_value = 0.0; crk.inputs['From Max'].default_value = 0.06
gl.new(crack.outputs['Distance'], crk.inputs['Value'])
ink = gn.new('ShaderNodeMath'); ink.operation = 'MULTIPLY'
gl.new(logo.outputs['Alpha'], ink.inputs[0])
gl.new(facing.outputs['Result'], ink.inputs[1])
ink2 = gn.new('ShaderNodeMath'); ink2.operation = 'MULTIPLY'
gl.new(ink.outputs['Value'], ink2.inputs[0])
gl.new(crk.outputs['Result'], ink2.inputs[1])
pm = gn.new('ShaderNodeMix'); pm.data_type = 'RGBA'
gl.new(ink2.outputs['Value'], pm.inputs['Factor'])
gl.new(gwear.outputs['Result'], pm.inputs['A'])
logo_lin = gn.new('ShaderNodeMix'); logo_lin.data_type = 'RGBA'; logo_lin.blend_type = 'MULTIPLY'
logo_lin.inputs['Factor'].default_value = 1.0
logo_lin.inputs['B'].default_value = (0.86, 0.85, 0.82, 1)
gl.new(logo.outputs['Color'], logo_lin.inputs['A'])
gl.new(logo_lin.outputs['Result'], pm.inputs['B'])
gl.new(pm.outputs['Result'], gp.inputs['Base Color'])
rmix = gn.new('ShaderNodeMix'); rmix.data_type = 'FLOAT'
rmix.inputs['B'].default_value = 0.42
gl.new(ink2.outputs['Value'], rmix.inputs['Factor'])
rr_link = [lk for lk in gl if lk.to_socket == gp.inputs['Roughness']][0]
gl.new(rr_link.from_socket, rmix.inputs['A'])
gl.remove(rr_link)
gl.new(rmix.outputs['Result'], gp.inputs['Roughness'])

SEAM_MAT = leather('leather_seam', base=(0.22, 0.008, 0.011), scale=14, coat=0.4)[0]

# ---------------------------------------------------------------- glove objects
G = np.load(f'{A}/glove.npz')
pivot = bpy.data.objects.new('spin', None)
sc.collection.objects.link(pivot)
pivot.location = HOOK
rig = bpy.data.objects.new('glove_rig', None)  # the glove in its own frame, hanging from the pivot
sc.collection.objects.link(rig)
rig.parent = pivot
rig.location = Vector((0, 0, 0)) - HOOK


def link(o, parent=rig):
    sc.collection.objects.link(o)
    o.parent = parent
    return o


me = bpy.data.meshes.new('glove')
me.from_pydata(G['v'].tolist(), [], G['f'][:, ::-1].tolist())
me.validate()
me.shade_smooth()
glove = link(bpy.data.objects.new('glove', me))
glove.data.materials.append(GLOVE_MAT)


def curve(name, pts, radius, material, cyclic=False, res=4):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    sp.use_cyclic_u = cyclic
    sp.use_endpoint_u = not cyclic
    sp.order_u = 4
    o = link(bpy.data.objects.new(name, cu))
    o.data.materials.append(material)
    return o


for i in range(int(G['n_welts'])):
    s_ = G[f'welt{i}'][::3]
    closed = bool(np.linalg.norm(s_[0] - s_[-1]) < 0.01)
    curve(f'welt{i}', s_, 0.0030 if i == 0 else 0.0024, SEAM_MAT, cyclic=closed)

# stitches: one tiny waxed-thread dash every 4 mm, half sunk in the leather
THREAD, tn, tl = mat('thread')
tpb = tn['Principled BSDF']
tpb.inputs['Base Color'].default_value = (0.62, 0.48, 0.30, 1)
tpb.inputs['Roughness'].default_value = 0.42
tpb.inputs['Sheen Weight'].default_value = 0.3
sv, sf = [], []
ring = [(math.cos(2 * math.pi * k / 6), math.sin(2 * math.pi * k / 6)) for k in range(6)]
for i in range(int(G['n_stitch'])):
    P, N = G[f'stitch{i}'], G[f'stitchn{i}']
    step = 4  # samples are 1.1 mm apart: dash 3.3 mm, gap 1.1 mm
    for j in range(0, len(P) - step, step):
        a_, b_ = Vector(P[j]), Vector(P[j + step - 1])
        n_ = Vector(N[j]).normalized()
        t_ = (b_ - a_)
        if t_.length < 1e-5:
            continue
        t_.normalize()
        sdir = n_.cross(t_).normalized()
        nn_ = t_.cross(sdir).normalized()
        base = len(sv)
        for q, c in enumerate((a_, (a_ + b_) / 2, b_)):
            rr = 0.00055 if q == 1 else 0.0003
            for (cx, cy) in ring:
                sv.append(tuple(c + sdir * (rr * cx) + nn_ * (rr * cy + 0.0001)))
        for q in range(2):
            for k in range(6):
                a0 = base + q * 6 + k
                b0 = base + q * 6 + (k + 1) % 6
                sf.append((a0, b0, b0 + 6, a0 + 6))
stm = bpy.data.meshes.new('stitches')
stm.from_pydata(sv, [], sf)
stm.shade_smooth()
st_o = link(bpy.data.objects.new('stitches', stm))
st_o.data.materials.append(THREAD)

# eyelets
METAL, mn, ml = mat('eyelet')
mp_ = mn['Principled BSDF']
mp_.inputs['Base Color'].default_value = (0.62, 0.60, 0.56, 1)
mp_.inputs['Metallic'].default_value = 1.0
mp_.inputs['Roughness'].default_value = 0.28
eyes = G['eyes']
eyen = G['eyen']
for i, e in enumerate(eyes):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.0034, minor_radius=0.0011, major_segments=24, minor_segments=8)
    t = bpy.context.active_object
    t.rotation_euler = Vector(eyen[i]).to_track_quat('Z', 'Y').to_euler()
    t.location = Vector(e) + Vector(eyen[i]) * 0.0004
    t.parent = rig
    t.data.materials.append(METAL)
    t.data.shade_smooth()

# the lace: waxed white cord, criss-cross, ends rising to the hook
LACE, ln, ll = mat('lace')
lpb = ln['Principled BSDF']
lpb.inputs['Base Color'].default_value = (0.78, 0.76, 0.72, 1)
lpb.inputs['Roughness'].default_value = 0.55
lpb.inputs['Sheen Weight'].default_value = 0.4
ltc = ln.new('ShaderNodeTexCoord')
wave = ln.new('ShaderNodeTexWave')
wave.wave_type = 'BANDS'
wave.bands_direction = 'DIAGONAL'
wave.inputs['Scale'].default_value = 900
ll.new(ltc.outputs['Object'], wave.inputs['Vector'])
lb = ln.new('ShaderNodeBump')
lb.inputs['Strength'].default_value = 0.35
ll.new(wave.outputs['Fac'], lb.inputs['Height'])
ll.new(lb.outputs['Normal'], lpb.inputs['Normal'])

Lp = [Vector(e) + Vector(n) * 0.0026 for e, n in zip(eyes[0::2], eyen[0::2])]
Rp = [Vector(e) + Vector(n) * 0.0026 for e, n in zip(eyes[1::2], eyen[1::2])]
hook_local = HOOK.copy()
for start in (0, 1):
    pts = []
    for i in range(5):
        side = (Lp if (i + start) % 2 == 0 else Rp)[i]
        pts.append(side)
        if i < 4:
            nxt = (Lp if (i + 1 + start) % 2 == 0 else Rp)[i + 1]
            pts.append((side + nxt) / 2 + Vector((0, -0.0022 if start else -0.0040, 0)))
    top = pts[-1]
    for t in (0.06, 0.18, 0.4, 0.7, 1.0):
        q = top.lerp(hook_local + Vector((0.004 * (1 - 2 * start), 0, 0)), t)
        q += Vector((0, -0.012 * math.sin(t * math.pi), 0))
        pts.append(q)
    curve(f'lace{start}', [tuple(p) for p in pts], 0.0020, LACE, res=6)
curve('lace_bar', [tuple(Lp[0]), tuple((Lp[0] + Rp[0]) / 2 + Vector((0, -0.002, 0))), tuple(Rp[0])], 0.0020, LACE)

# ---------------------------------------------------------------- the spin
# a hanging glove unwinding on its lace: one and a half turns, easing to a slow drift before the grab
def spin_angle(fr):
    t = (fr - 1) / FPS
    tg = (T_GRAB - 1) / FPS
    base = math.radians(-35) + math.radians(585) * (1 - math.exp(-t / 2.4)) / (1 - math.exp(-tg / 2.4))
    return base


def sway(fr):
    t = (fr - 1) / FPS
    return math.radians(1.6) * math.sin(t * 2.1), math.radians(1.1) * math.sin(t * 1.7 + 1)


def yank(fr):
    # a beat of stillness, then the hand rips the glove up and into the lens
    t = max(0.0, (fr - T_GRAB - 4) / (T_END - T_GRAB - 4))
    k = t ** 2.2
    return Vector((0.025 * k, -0.53 * k, 0.035 * k))

for fr in range(1, T_END + 1):
    if fr <= T_GRAB:
        a = spin_angle(fr)
        sx, sy = sway(fr)
    else:
        a = spin_angle(T_GRAB) + (spin_angle(T_GRAB + 1) - spin_angle(T_GRAB)) * 0.4 * (1 - math.exp(-(fr - T_GRAB) / 3))
        sx, sy = sway(T_GRAB)
    pivot.rotation_euler = (sx, sy, a)
    pivot.location = HOOK + yank(fr)
    pivot.keyframe_insert('rotation_euler', frame=fr)
    pivot.keyframe_insert('location', frame=fr)

# ---------------------------------------------------------------- camera
cam_d = bpy.data.cameras.new('cam')
cam_d.lens = 50
cam_d.clip_start = 0.005
cam_d.sensor_fit = 'VERTICAL'
cam_d.sensor_height = 36
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 4.0
cam = bpy.data.objects.new('cam', cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
focus = bpy.data.objects.new('focus', None)
sc.collection.objects.link(focus)
cam_d.dof.focus_object = focus


def cam_at(fr):
    t = ease((fr - 1) / (T_GRAB - 1))
    d = 0.74 - 0.08 * t
    z = 0.0 + 0.005 * t
    return Vector((0.03 * math.sin(fr / 40), -d, z)), Vector((0, 0, -0.01))


for fr in range(1, T_END + 1):
    p, tgt = cam_at(fr)
    if fr > T_GRAB:  # the yank: the glove comes at the lens; camera recoils a touch, focus chases
        k = ease((fr - T_GRAB) / (T_END - T_GRAB))
        p = p + Vector((0, -0.02 * k, 0.01 * k))
    cam.location = p
    cam.rotation_euler = (tgt - p).to_track_quat('-Z', 'Y').to_euler()
    cam.keyframe_insert('location', frame=fr)
    cam.keyframe_insert('rotation_euler', frame=fr)
    focus.location = Vector((0, -0.07, 0.0))
    focus.keyframe_insert('location', frame=fr)

# ---------------------------------------------------------------- lights: a warm key, a hard cold rim, a top fill
def area(name, loc, target, size, power, color, shape='RECTANGLE', sy=None):
    L = bpy.data.lights.new(name, 'AREA')
    L.energy = power
    L.color = color
    L.shape = shape
    L.size = size
    if sy:
        L.size_y = sy
    o = bpy.data.objects.new(name, L)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o


area('key', (-0.75, -0.55, 0.55), (0, 0, 0.02), 0.7, 95, (1.0, 0.86, 0.72), sy=0.45)
area('rim', (0.7, 0.75, 0.35), (0, 0, 0.0), 0.25, 140, (0.85, 0.92, 1.0), sy=1.0)
area('rim2', (-0.6, 0.8, 0.1), (0, 0, 0.0), 0.2, 60, (1.0, 0.8, 0.6), sy=0.8)
area('top', (0.0, -0.1, 1.3), (0, 0, 0.0), 1.2, 60, (1.0, 0.95, 0.9))


# ---------------------------------------------------------------- the hand
# A rigged hand scan (WebXR generic hand; its 25 joints are not chained, so the fingers are posed
# with our own forward kinematics), wrapped like the client's reference: grey cotton hand wraps over
# the wrist, palm and knuckles, bare fingers, a bare forearm.
bpy.ops.import_scene.gltf(filepath=f'{A}/right.glb')
ARM = bpy.data.objects['Armature']
ARM.rotation_mode = 'XYZ'
HAND = [o for o in bpy.data.objects if o.name.startswith('r_hand')][0]
for o in list(bpy.data.objects):
    if o.name.startswith('Icosphere'):
        bpy.data.objects.remove(o)
hme = HAND.data
rest = np.array([v.co[:] for v in hme.vertices])
gidx = {g.index: g.name for g in HAND.vertex_groups}
wrapm = np.zeros(len(rest))
for i, v in enumerate(hme.vertices):
    thumbw = sum(g.weight for g in v.groups if gidx[g.group].startswith('thumb-phalanx') or gidx[g.group] == 'thumb-tip')
    zz = v.co.z + 0.004 * math.sin(v.co.x * 400) + 0.003 * math.sin(v.co.y * 300)
    wrapm[i] = float(np.clip((zz + 0.031) / 0.006, 0, 1)) * float(np.clip(1 - thumbw * 1.6, 0, 1))
hme.calc_normals_split() if hasattr(hme, 'calc_normals_split') else None
nrm = np.array([v.normal[:] for v in hme.vertices])
for i, v in enumerate(hme.vertices):
    v.co = Vector(rest[i] + nrm[i] * 0.0024 * wrapm[i])
attr = hme.color_attributes.new('wrapmask', 'FLOAT_COLOR', 'POINT')
for i in range(len(rest)):
    attr.data[i].color = (wrapm[i], wrapm[i], wrapm[i], 1)
sub = HAND.modifiers.new('sub', 'SUBSURF')
sub.levels = sub.render_levels = 2
HAND.scale = (0.9, 1.0, 1.0)  # slimmer fingers (the scan is chunky)
hme.shade_smooth()


def skin_nodes(n, l, tc_out):
    """Principled skin: SSS, pores, fine lines, knuckle creases, blotchy tone. Returns the BSDF."""
    sp = n['Principled BSDF']
    sp.inputs['Subsurface Weight'].default_value = 0.35
    sp.inputs['Subsurface Radius'].default_value = (1.0, 0.32, 0.16)
    sp.inputs['Subsurface Scale'].default_value = 0.0025
    sp.inputs['Specular IOR Level'].default_value = 0.42
    pores = n.new('ShaderNodeTexVoronoi'); pores.inputs['Scale'].default_value = 2400
    l.new(tc_out, pores.inputs['Vector'])
    lines = n.new('ShaderNodeTexNoise'); lines.inputs['Scale'].default_value = 380; lines.inputs['Detail'].default_value = 8
    lines.inputs['Roughness'].default_value = 0.7
    l.new(tc_out, lines.inputs['Vector'])
    blot = n.new('ShaderNodeTexNoise'); blot.inputs['Scale'].default_value = 40; blot.inputs['Detail'].default_value = 3
    l.new(tc_out, blot.inputs['Vector'])
    hh = n.new('ShaderNodeMath'); hh.operation = 'MULTIPLY_ADD'; hh.inputs[1].default_value = 0.5
    l.new(pores.outputs['Distance'], hh.inputs[0]); l.new(lines.outputs['Fac'], hh.inputs[2])
    sb = n.new('ShaderNodeBump'); sb.inputs['Strength'].default_value = 0.55; sb.inputs['Distance'].default_value = 0.0007
    l.new(hh.outputs['Value'], sb.inputs['Height'])
    l.new(sb.outputs['Normal'], sp.inputs['Normal'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.16, 0.075, 0.045, 1)
    ramp.color_ramp.elements[1].color = (0.25, 0.115, 0.07, 1)
    l.new(blot.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], sp.inputs['Base Color'])
    rv = n.new('ShaderNodeMapRange'); rv.inputs['To Min'].default_value = 0.36; rv.inputs['To Max'].default_value = 0.58
    l.new(lines.outputs['Fac'], rv.inputs['Value'])
    l.new(rv.outputs['Result'], sp.inputs['Roughness'])
    return sp, sb


def wrap_nodes(n, l, gen_out):
    """Grey cotton hand wrap: overlapping diagonal layers, frayed fuzz. Returns the BSDF."""
    wp = n.new('ShaderNodeBsdfPrincipled')
    wp.inputs['Roughness'].default_value = 0.92
    wp.inputs['Sheen Weight'].default_value = 0.2
    wp.inputs['Sheen Roughness'].default_value = 0.6
    layers = n.new('ShaderNodeTexWave'); layers.bands_direction = 'DIAGONAL'
    layers.inputs['Scale'].default_value = 5.0; layers.inputs['Distortion'].default_value = 3.5
    layers.inputs['Detail'].default_value = 1.5
    layers.wave_profile = 'SAW'
    l.new(gen_out, layers.inputs['Vector'])
    weave = n.new('ShaderNodeTexWave'); weave.bands_direction = 'X'; weave.inputs['Scale'].default_value = 260
    l.new(gen_out, weave.inputs['Vector'])
    fuzz = n.new('ShaderNodeTexNoise'); fuzz.inputs['Scale'].default_value = 600; fuzz.inputs['Detail'].default_value = 10
    l.new(gen_out, fuzz.inputs['Vector'])
    dirt = n.new('ShaderNodeTexNoise'); dirt.inputs['Scale'].default_value = 9; dirt.inputs['Detail'].default_value = 5
    l.new(gen_out, dirt.inputs['Vector'])
    cr = n.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].color = (0.035, 0.035, 0.034, 1)
    cr.color_ramp.elements[1].color = (0.12, 0.118, 0.112, 1)
    l.new(dirt.outputs['Fac'], cr.inputs['Fac'])
    shade = n.new('ShaderNodeMix'); shade.data_type = 'RGBA'; shade.blend_type = 'MULTIPLY'
    shade.inputs['Factor'].default_value = 0.55
    l.new(cr.outputs['Color'], shade.inputs['A'])
    l.new(layers.outputs['Color'], shade.inputs['B'])
    l.new(shade.outputs['Result'], wp.inputs['Base Color'])
    h = n.new('ShaderNodeMath'); h.operation = 'MULTIPLY_ADD'; h.inputs[1].default_value = 0.35
    l.new(layers.outputs['Fac'], h.inputs[0])
    h2 = n.new('ShaderNodeMath'); h2.operation = 'MULTIPLY_ADD'; h2.inputs[1].default_value = 0.25
    l.new(weave.outputs['Fac'], h2.inputs[0]); l.new(fuzz.outputs['Fac'], h2.inputs[2])
    l.new(h2.outputs['Value'], h.inputs[2])
    wb = n.new('ShaderNodeBump'); wb.inputs['Strength'].default_value = 0.6; wb.inputs['Distance'].default_value = 0.0012
    l.new(h.outputs['Value'], wb.inputs['Height'])
    l.new(wb.outputs['Normal'], wp.inputs['Normal'])
    return wp


SKIN, sn, sl = mat('skin_wrap')
stc = sn.new('ShaderNodeTexCoord')
skin_bsdf, skin_bump = skin_nodes(sn, sl, stc.outputs['Generated'])
# knuckle creases across the fingers at the joints (generated Z is the rest pose, so they stay put)
gsep = sn.new('ShaderNodeSeparateXYZ'); sl.new(stc.outputs['Generated'], gsep.inputs['Vector'])
kw = sn.new('ShaderNodeTexWave'); kw.bands_direction = 'Z'; kw.inputs['Scale'].default_value = 140
kw.inputs['Distortion'].default_value = 3
sl.new(stc.outputs['Generated'], kw.inputs['Vector'])
km = None
for zc in (0.27, 0.16, 0.41):
    d_ = sn.new('ShaderNodeMath'); d_.operation = 'SUBTRACT'; d_.inputs[1].default_value = zc
    sl.new(gsep.outputs['Z'], d_.inputs[0])
    g_ = sn.new('ShaderNodeMath'); g_.operation = 'ABSOLUTE'; sl.new(d_.outputs['Value'], g_.inputs[0])
    m_ = sn.new('ShaderNodeMapRange'); m_.inputs['From Min'].default_value = 0.018; m_.inputs['From Max'].default_value = 0.0
    sl.new(g_.outputs['Value'], m_.inputs['Value'])
    if km is None:
        km = m_
    else:
        mx = sn.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
        sl.new(km.outputs[0], mx.inputs[0]); sl.new(m_.outputs['Result'], mx.inputs[1]); km = mx
kk = sn.new('ShaderNodeMath'); kk.operation = 'MULTIPLY'
sl.new(kw.outputs['Fac'], kk.inputs[0]); sl.new(km.outputs[0], kk.inputs[1])
kb = sn.new('ShaderNodeBump'); kb.inputs['Strength'].default_value = 0.9; kb.inputs['Distance'].default_value = 0.0012
sl.new(kk.outputs['Value'], kb.inputs['Height'])
sl.new(skin_bump.outputs['Normal'], kb.inputs['Normal'])
sl.new(kb.outputs['Normal'], skin_bsdf.inputs['Normal'])
wrap_bsdf = wrap_nodes(sn, sl, stc.outputs['Generated'])
wattr = sn.new('ShaderNodeAttribute'); wattr.attribute_name = 'wrapmask'
mixs = sn.new('ShaderNodeMixShader')
sl.new(wattr.outputs['Fac'], mixs.inputs['Fac'])
sl.new(skin_bsdf.outputs['BSDF'], mixs.inputs[1])
sl.new(wrap_bsdf.outputs['BSDF'], mixs.inputs[2])
sl.new(mixs.outputs['Shader'], sn['Material Output'].inputs['Surface'])
HAND.data.materials.clear()
HAND.data.materials.append(SKIN)

# the forearm: wrapped for 9 cm past the wrist, then bare skin
verts, faces = [], []
NS, NR = 40, 26
for j in range(NR):
    zz = 0.050 + 0.46 * (j / (NR - 1)) ** 1.2
    k_ = min(1.0, (zz - 0.05) / 0.3)
    wrapped = zz < 0.145
    for i in range(NS):
        a_ = 2 * math.pi * i / NS
        rx = 0.019 + 0.010 * k_ + (0.0024 if wrapped else 0)
        ry = 0.028 + 0.012 * k_ + (0.0024 if wrapped else 0)
        verts.append((0.038 + rx * math.cos(a_), -0.010 + ry * math.sin(a_), zz))
for j in range(NR - 1):
    for i in range(NS):
        a_, b_ = j * NS + i, j * NS + (i + 1) % NS
        faces.append((a_, a_ + NS, b_ + NS, b_))
fm = bpy.data.meshes.new('forearm')
fm.from_pydata(verts, [], faces)
fm.shade_smooth()
fa_attr = fm.color_attributes.new('wrapmask', 'FLOAT_COLOR', 'POINT')
for i, v in enumerate(verts):
    w_ = float(np.clip((0.145 - v[2]) / 0.004 + 0.4 * math.sin(i * 1.7), 0, 1))
    fa_attr.data[i].color = (w_, w_, w_, 1)
forearm = bpy.data.objects.new('forearm', fm)
sc.collection.objects.link(forearm)
forearm.parent = ARM
forearm.data.materials.append(SKIN)
fs = forearm.modifiers.new('sub', 'SUBSURF'); fs.levels = fs.render_levels = 1

# nails on the distal phalanges (the scan has none)
NAIL, nn, nl = mat('nail')
npb = nn['Principled BSDF']
npb.inputs['Base Color'].default_value = (0.55, 0.38, 0.32, 1)
npb.inputs['Roughness'].default_value = 0.3
npb.inputs['Subsurface Weight'].default_value = 0.4
npb.inputs['Subsurface Radius'].default_value = (1.0, 0.4, 0.3)
npb.inputs['Subsurface Scale'].default_value = 0.002
for fn_, w_ in (('index', 0.0060), ('middle', 0.0062), ('ring', 0.0058), ('pinky', 0.0050), ('thumb', 0.0070)):
    bname = f'{fn_}-finger-phalanx-distal' if fn_ != 'thumb' else 'thumb-phalanx-distal'
    tname = f'{fn_}-finger-tip' if fn_ != 'thumb' else 'thumb-tip'
    base = ARM.data.bones[bname].head_local
    tip = ARM.data.bones[tname].head_local
    c = base.lerp(tip, 0.75)
    d = (tip - base).normalized()
    out_dir = Vector((0.55, -0.35, 0.3)).normalized() if fn_ == 'thumb' else Vector((1, 0, 0))
    near = rest[np.linalg.norm(rest - np.array(c), axis=1) < 0.009]
    pnt = Vector(near[np.argmax(near @ np.array(out_dir))])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1)
    nail = bpy.context.active_object
    nail.name = f'nail_{fn_}'
    nail.data.shade_smooth()
    nail.data.materials.append(NAIL)
    side = d.cross(out_dir).normalized()
    up_ = side.cross(d).normalized()
    R = Matrix((side, d, up_)).transposed()
    nail.matrix_world = Matrix.Translation(pnt - up_ * 0.0006) @ R.to_4x4() @ Matrix.Diagonal((w_ * 0.95, w_ * 1.2, 0.0014, 1))
    mw = nail.matrix_world.copy()
    nail.parent = ARM
    nail.parent_type = 'BONE'
    nail.parent_bone = bname
    nail.matrix_world = mw

# ---- finger posing: forward kinematics down each chain
CHAINS = {
    'index': ['index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip'],
    'middle': ['middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip'],
    'ring': ['ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip'],
    'pinky': ['pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'],
    'thumb': ['thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'],
}
CURL = {'index': (8, 62, 44), 'middle': (10, 66, 44), 'ring': (14, 66, 42), 'pinky': (20, 64, 40), 'thumb': (34, 38)}
SPREAD = {'index': 6, 'middle': 1, 'ring': -4, 'pinky': -9, 'thumb': 0}
CURL_AX = Vector((0, 1, 0))       # bends a finger toward the palm (-X)
THUMB_AX = Vector((0.0, 0.7, 0.6)).normalized()
for pb in ARM.pose.bones:
    pb.rotation_mode = 'QUATERNION'


def pose(c, fr):
    for f_, chain in CHAINS.items():
        F = Matrix.Identity(4)
        for k, nm_ in enumerate(chain):
            B = ARM.data.bones[nm_].matrix_local
            if k < len(CURL[f_]):
                h_ = F @ B.to_translation()
                ang = CURL[f_][k] * c
                ax = THUMB_AX if f_ == 'thumb' else CURL_AX
                R = Matrix.Rotation(math.radians(ang), 4, ax)
                if k == 0 and f_ != 'thumb':
                    R = Matrix.Rotation(math.radians(SPREAD[f_] * (1 - max(0.0, c))), 4, Vector((1, 0, 0))) @ R
                F = Matrix.Translation(h_) @ R @ Matrix.Translation(-h_) @ F
            pb = ARM.pose.bones[nm_]
            pb.matrix = F @ B
            bpy.context.view_layer.update()
            pb.keyframe_insert('location', frame=fr)
            pb.keyframe_insert('rotation_quaternion', frame=fr)


def glove_matrix(fr):
    sc.frame_set(fr)
    return rig.matrix_world.copy()


# where the hand holds the glove: chosen in world space at the grab, stored in glove space
f_w = Vector((-1.0, 0.0, -0.15)).normalized()   # fingers run left across the cuff's front
n_w = Vector((0.0, 1.0, 0.0))                    # palm on the cuff, back of the hand to the lens
t_w = f_w.cross(n_w).normalized()
Rw = Matrix((-n_w, t_w, -f_w)).transposed()
P_h = Vector(tuple(float(x) for x in ARGS[ARGS.index('--ph') + 1].split(','))) if '--ph' in ARGS else Vector((-0.013, -0.008, 0.0))
C_w = Vector(tuple(float(x) for x in ARGS[ARGS.index('--cw') + 1].split(','))) if '--cw' in ARGS else Vector((0.040, -0.0475, 0.100))
Hw = Matrix.Translation(C_w - Rw @ P_h) @ Rw.to_4x4()
G_grab = glove_matrix(T_GRAB)
H_local = G_grab.inverted() @ Hw
start = Matrix.Translation(Vector((0.42, -0.06, 0.12))) @ Hw @ Matrix.Rotation(math.radians(-18), 4, 'Z')


def hand_world(fr):
    if fr >= T_GRAB:
        return glove_matrix(fr) @ H_local
    t = (fr - T_REACH) / (T_GRAB - 1 - T_REACH)
    k = 1 - (1 - max(0, min(1, t))) ** 3
    end = glove_matrix(T_GRAB) @ H_local
    loc = start.to_translation().lerp(end.to_translation(), k)
    rot = start.to_quaternion().slerp(end.to_quaternion(), k)
    return Matrix.Translation(loc) @ rot.to_matrix().to_4x4()


HAND_FRAMES = [int(x) for x in ARGS[ARGS.index('--hf') + 1].split(',')] if '--hf' in ARGS else list(range(1, T_END + 1))
for fr in HAND_FRAMES:
    if fr < T_REACH - 1:
        c = -0.1
    else:
        c = -0.1 + 1.1 * ease((fr - (T_GRAB - 6)) / 6)
        if fr > T_GRAB:
            c += 0.05 * math.sin(math.pi * ease((fr - T_GRAB) / 6))
    if '--curl' in ARGS:
        c = float(ARGS[ARGS.index('--curl') + 1])
    pose(c, fr)
    M = hand_world(fr) if fr >= T_REACH - 1 else Matrix.Translation(Vector((3, 3, 3)))
    sc.frame_set(fr)
    ARM.matrix_world = M
    ARM.keyframe_insert('location', frame=fr)
    ARM.keyframe_insert('rotation_euler', frame=fr)

if '--top' in ARGS:  # debug: look straight down on the grip
    cam.animation_data_clear()
    cam.location = Vector((0.0, -0.02, 0.62))
    cam.rotation_euler = (0, 0, 0)
    cam_d.dof.use_dof = False
    for o in bpy.data.objects:
        if o.name.startswith('lace'):
            o.hide_render = True

if '--angle' in ARGS:  # glove-only turntable preview
    pivot.animation_data_clear()
    pivot.location = HOOK
    pivot.rotation_euler = (0, 0, math.radians(float(ARGS[ARGS.index('--angle') + 1])))
    for o in bpy.data.objects:
        if o.parent == ARM or o == ARM or o.name.startswith('r_hand'):
            o.hide_render = True

if '--bg' in ARGS:  # the hangar plate alone: no geometry, lots of samples, clean bokeh
    for o in bpy.data.objects:
        if o.type in ('MESH', 'CURVE'):
            o.hide_render = True
    sc.render.film_transparent = False
    wl.new(env.outputs['Color'], bgc.inputs['Color'])  # the sharp plate: the lens blur alone softens it
elif '--fg' in ARGS:  # glove + hand over transparency (lighting still from the full HDR)
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
if '--thr' in ARGS:
    sc.cycles.adaptive_threshold = float(ARGS[ARGS.index('--thr') + 1])

# ---------------------------------------------------------------- render
if MODE == 'still':
    fr = int(ARGS[0])
    sc.frame_set(fr)
    sc.render.filepath = f'{OUT}/still_{fr:04d}.png'
    bpy.ops.render.render(write_still=True)
elif MODE == 'anim':
    sc.frame_start, sc.frame_end = int(ARGS[0]), int(ARGS[1])
    sc.render.filepath = f'{OUT}/' + ('bg_' if '--bg' in ARGS else 'f_')
    bpy.ops.render.render(animation=True)
elif MODE == 'save':
    bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/scene.blend')
