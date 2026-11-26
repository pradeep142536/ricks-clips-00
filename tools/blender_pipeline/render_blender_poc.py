"""Headless Blender (bpy) Eevee POC renderer & Colab orchestrator for RicksClips Cinema V4.5 comparison.

Modes:
  1. Direct inside Blender headless:
     blender -b --python tools/blender_pipeline/render_blender_poc.py -- --ep episodes/compare-v45-showcase --out out/compare_blender_poc.mp4
  2. Colab remote runner (tries Tesla T4 GPU first, falls back to CPU automatically):
     python tools/blender_pipeline/render_blender_poc.py --colab --ep episodes/compare-v45-showcase --out out/compare_blender_poc.mp4
"""
import argparse
import base64
import json
import math
import os
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.parse
import urllib.request
import uuid


def inside_blender():
    try:
        import bpy  # noqa: F401
        return True
    except ImportError:
        return False


def build_and_render_blender(ep_dir, out_mp4, frames_range=None):
    import bpy
    from mathutils import Euler, Matrix, Vector

    ep_dir = os.path.abspath(ep_dir)
    out_mp4 = os.path.abspath(out_mp4)
    os.makedirs(os.path.dirname(out_mp4), exist_ok=True)

    film = json.load(open(os.path.join(ep_dir, "film.json"), encoding="utf-8"))
    cam_data = json.load(open(os.path.join(ep_dir, "out", "plan", "camera_baked.json"), encoding="utf-8"))
    perf_data = json.load(open(os.path.join(ep_dir, "out", "plan", "performance_baked.json"), encoding="utf-8"))
    paths_path = os.path.join(ep_dir, "out", "plan", "paths_baked.json")
    paths_data = json.load(open(paths_path, encoding="utf-8"))["frames"] if os.path.exists(paths_path) else {}

    cam_frames = cam_data["frames"]
    n_frames = len(cam_frames)
    fps = int(film.get("fps", 30))
    fw, fh = film.get("size", [1080, 1920])

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = n_frames
    scene.render.fps = fps
    scene.render.resolution_x = fw
    scene.render.resolution_y = fh
    scene.render.resolution_percentage = 100

    # Configure Eevee (Blender 3.6 BLENDER_EEVEE or 4.2+ BLENDER_EEVEE_NEXT)
    has_next = "BLENDER_EEVEE_NEXT" in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys()
    scene.render.engine = "BLENDER_EEVEE_NEXT" if has_next else "BLENDER_EEVEE"
    ee = scene.eevee
    if hasattr(ee, "taa_render_samples"):
        ee.taa_render_samples = 24
    if hasattr(ee, "use_soft_shadows"):
        ee.use_soft_shadows = True
    if hasattr(ee, "shadow_cube_size"):
        ee.shadow_cube_size = "1024"
    if hasattr(ee, "shadow_cascade_size"):
        ee.shadow_cascade_size = "2048"
    if hasattr(ee, "use_gtao"):
        ee.use_gtao = True
        ee.gtao_distance = 0.65
        ee.gtao_factor = 1.2
    if hasattr(ee, "use_bloom"):
        ee.use_bloom = True
        ee.bloom_threshold = 0.92
        ee.bloom_intensity = 0.08
        ee.bloom_radius = 6.2
    if hasattr(ee, "use_motion_blur"):
        ee.use_motion_blur = True
        ee.motion_blur_shutter = 0.35
        if hasattr(ee, "motion_blur_steps"):
            ee.motion_blur_steps = 4
    if hasattr(ee, "use_volumetric_lights"):
        ee.use_volumetric_lights = True
    if hasattr(ee, "volumetric_start"):
        ee.volumetric_start = 4.0
    if hasattr(ee, "volumetric_end"):
        ee.volumetric_end = 52.0
    if hasattr(ee, "volumetric_samples"):
        ee.volumetric_samples = 32
    if hasattr(ee, "volumetric_tile_size"):
        ee.volumetric_tile_size = "4"

    # Filmic / AgX Color Management
    for vt in ("AgX", "Filmic", "Standard"):
        try:
            scene.view_settings.view_transform = vt
            break
        except Exception:
            pass
    try:
        scene.view_settings.look = "Medium High Contrast"
    except Exception:
        pass
    scene.view_settings.exposure = 0.0

    # 1. Golden-hour Nishita Sky + Warm Directional Sun + Soft Sky Fill
    world = bpy.data.worlds.new("GoldenHourWorld")
    scene.world = world
    world.use_nodes = True
    wn = world.node_tree.nodes
    wl = world.node_tree.links
    wn.clear()
    w_out = wn.new("ShaderNodeOutputWorld")
    w_bg = wn.new("ShaderNodeBackground")
    w_bg.inputs["Strength"].default_value = 0.85
    w_sky = wn.new("ShaderNodeTexSky")
    w_sky.sky_type = "NISHITA"
    w_sky.sun_disc = True
    w_sky.sun_elevation = math.radians(10.5)
    w_sky.sun_rotation = math.radians(-115.0)
    w_sky.altitude = 120.0
    w_sky.air_density = 1.25
    w_sky.dust_density = 1.65
    w_sky.ozone_density = 1.15
    wl.new(w_sky.outputs["Color"], w_bg.inputs["Color"])
    wl.new(w_bg.outputs["Background"], w_out.inputs["Surface"])

    sun_data = bpy.data.lights.new("GoldenSun", type="SUN")
    sun_data.color = (1.0, 0.76, 0.46)
    sun_data.energy = 4.8
    sun_data.angle = math.radians(3.0)
    sun_obj = bpy.data.objects.new("GoldenSun", sun_data)
    sun_obj.rotation_euler = Euler((math.radians(79.5), 0.0, math.radians(-115.0)), "XYZ")
    scene.collection.objects.link(sun_obj)

    fill_data = bpy.data.lights.new("SkyFill", type="AREA")
    fill_data.color = (0.95, 0.78, 0.65)
    fill_data.energy = 260.0
    fill_data.size = 18.0
    fill_obj = bpy.data.objects.new("SkyFill", fill_data)
    fill_obj.location = (2.0, -8.0, 12.0)
    fill_obj.rotation_euler = Euler((math.radians(35.0), 0.0, 0.0), "XYZ")
    scene.collection.objects.link(fill_obj)

    # Volumetric golden mist domain covering valley & horizon
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.0, 12.0, 6.0))
    fog_box = bpy.context.active_object
    fog_box.name = "GoldenMistDomain"
    fog_box.scale = (90.0, 60.0, 16.0)
    fog_mat = bpy.data.materials.new("GoldenMistMat")
    fog_mat.use_nodes = True
    fn = fog_mat.node_tree.nodes
    fl = fog_mat.node_tree.links
    fn.clear()
    f_out = fn.new("ShaderNodeOutputMaterial")
    f_vol = fn.new("ShaderNodeVolumePrincipled")
    f_vol.inputs["Color"].default_value = (1.0, 0.82, 0.58, 1.0)
    f_vol.inputs["Density"].default_value = 0.0052
    f_vol.inputs["Anisotropy"].default_value = 0.45
    fl.new(f_vol.outputs["Volume"], f_out.inputs["Volume"])
    fog_box.data.materials.append(fog_mat)

    def make_mat(name, color, rough=0.75, metal=0.0, emit=0.0):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = (*color[:3], 1.0)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
        if emit > 0:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = (*color[:3], 1.0)
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = (*color[:3], 1.0)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emit
        return m

    # 2. Procedural Sculpted Green Hillside Terrain (exact heightfield match to golden_hillside.js)
    nx, ny = 88, 60
    verts, faces = [], []
    for j in range(ny + 1):
        y_plan = -38.0 + (76.0 * j) / ny
        for i in range(nx + 1):
            x = -51.0 + (110.0 * i) / nx
            z = 0.0
            if y_plan > 2.4:
                d = y_plan - 2.4
                ramp = 1.0 - math.exp(-d * d * 0.032)
                z = ramp * (
                    3.2 + 0.24 * d +
                    1.55 * math.sin(x * 0.14 + 0.7) * math.cos(d * 0.16) +
                    0.75 * math.sin(x * 0.31 - d * 0.22)
                )
            elif y_plan < -2.6:
                d = -2.6 - y_plan
                z = min(1.6, 0.08 * d + 0.35 * math.sin(x * 0.22 + d * 0.3))
            verts.append((x, y_plan, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            b = a + 1
            c = a + (nx + 1) + 1
            d_i = a + (nx + 1)
            faces.append((a, b, c, d_i))
    hill_mesh = bpy.data.meshes.new("HillsideMesh")
    hill_mesh.from_pydata(verts, [], faces)
    for p in hill_mesh.polygons:
        p.use_smooth = True
    hill_obj = bpy.data.objects.new("GreenHillside", hill_mesh)
    scene.collection.objects.link(hill_obj)

    grass_mat = bpy.data.materials.new("HillsideGrass")
    grass_mat.use_nodes = True
    gn = grass_mat.node_tree.nodes
    gl = grass_mat.node_tree.links
    g_bsdf = gn["Principled BSDF"]
    g_bsdf.inputs["Roughness"].default_value = 0.88
    g_tex = gn.new("ShaderNodeTexNoise")
    g_tex.inputs["Scale"].default_value = 0.45
    g_tex.inputs["Detail"].default_value = 6.0
    g_ramp = gn.new("ShaderNodeValToRGB")
    g_ramp.color_ramp.elements[0].color = (0.16, 0.28, 0.09, 1.0)
    g_ramp.color_ramp.elements[1].color = (0.36, 0.52, 0.16, 1.0)
    gl.new(g_tex.outputs["Fac"], g_ramp.inputs["Fac"])
    gl.new(g_ramp.outputs["Color"], g_bsdf.inputs["Base Color"])
    hill_obj.data.materials.append(grass_mat)

    # 3. Gravel Ballast, Timber Ties, Steel Rails, Trees & Trackside Milepost
    ballast_mat = make_mat("Ballast", (0.28, 0.23, 0.19), rough=0.92)
    tie_mat = make_mat("TieWood", (0.18, 0.11, 0.07), rough=0.88)
    steel_mat = make_mat("SteelRail", (0.55, 0.60, 0.65), rough=0.30, metal=0.92)
    iron_mat = make_mat("LocoIron", (0.09, 0.11, 0.14), rough=0.36, metal=0.85)
    brass_mat = make_mat("LocoBrass", (0.80, 0.58, 0.16), rough=0.25, metal=0.95)
    red_mat = make_mat("LocoCrimson", (0.64, 0.09, 0.08), rough=0.52, metal=0.05)
    cab_mat = make_mat("LocoCabNavy", (0.08, 0.14, 0.22), rough=0.58, metal=0.10)
    lamp_mat = make_mat("HeadlampGlow", (1.0, 0.85, 0.45), rough=0.2, emit=6.5)
    bark_mat = make_mat("TreeBark", (0.20, 0.13, 0.08), rough=0.90)
    leaf_mat = make_mat("TreeLeaves", (0.22, 0.40, 0.13), rough=0.82)

    def add_box(name, loc, scale, mat, parent=None):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        o = bpy.context.active_object
        o.name = name
        o.scale = scale
        o.data.materials.append(mat)
        if parent:
            o.parent = parent
        return o

    add_box("Ballast", (4.0, 0.0, 0.05), (84.0, 2.2, 0.18), ballast_mat)
    for idx in range(90):
        add_box(f"Tie_{idx:02d}", (-24.0 + idx * 0.65, 0.0, 0.14), (0.24, 1.85, 0.12), tie_mat)
    for ry in (-0.52, 0.52):
        add_box(f"Rail_{ry:+.2f}", (4.0, ry, 0.25), (84.0, 0.09, 0.11), steel_mat)

    # Stylized hillside trees along slopes matching golden_hillside.js
    tree_spots = [
        (-14, 5.2, 4.8), (-6, 7.5, 5.5), (2, 6.0, 5.0),
        (10, 8.8, 6.2), (17, 5.8, 5.1), (24, 9.2, 6.5),
        (-10, 14.5, 7.0), (5, 16.0, 7.2), (20, 15.0, 6.8),
    ]
    for ti, (tx, ty, th) in enumerate(tree_spots):
        d = max(0.0, ty - 2.2)
        tz = (1.0 - math.exp(-d * d * 0.032)) * (
            3.2 + 0.24 * d + 1.55 * math.sin(tx * 0.14 + 0.7) * math.cos(d * 0.16) + 0.75 * math.sin(tx * 0.31 - d * 0.22)
        )
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.18 * (th / 5.0), depth=th * 0.45, location=(tx, ty, tz + th * 0.20))
        tr = bpy.context.active_object
        tr.name = f"TreeTrunk_{ti}"
        tr.data.materials.append(bark_mat)
        for ci, (ox, oy, oz, r) in enumerate([(0, 0, th * 0.58, th * 0.26), (0.4, -0.2, th * 0.48, th * 0.20), (-0.4, 0.2, th * 0.52, th * 0.20)]):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=(tx + ox, ty + oy, tz + oz))
            cr = bpy.context.active_object
            cr.name = f"TreeCrown_{ti}_{ci}"
            cr.data.materials.append(leaf_mat)

    # Trackside milepost GOLD RIDGE 42 PSI
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.085, depth=2.0, location=(10.6, -2.42, 1.0))
    post = bpy.context.active_object
    post.data.materials.append(tie_mat)
    sign_mat = make_mat("MilepostPlaque", (0.94, 0.88, 0.76), rough=0.7)
    add_box("MilepostSign", (10.6, -2.35, 1.88), (0.92, 0.05, 0.44), sign_mat)

    # 4. Hero 3D Steam Locomotive (moving root matching paths_baked.json["locomotive"])
    def smooth_auto(obj, angle_deg=42.0):
        for p in obj.data.polygons:
            p.use_smooth = True
        if hasattr(obj.data, "use_auto_smooth"):
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = math.radians(angle_deg)

    boiler_mat = make_mat("LocoBoilerBlue", (0.09, 0.16, 0.36), rough=0.32, metal=0.72)
    loco_root = bpy.data.objects.new("LocomotiveRoot", None)
    scene.collection.objects.link(loco_root)

    add_box("LocoFrame", (0.0, 0.0, 0.88), (6.2, 1.52, 0.42), iron_mat, loco_root)

    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.76, depth=3.6, location=(1.15, 0.0, 1.72), rotation=(0.0, math.radians(90.0), 0.0))
    boiler = bpy.context.active_object
    boiler.data.materials.append(boiler_mat)
    smooth_auto(boiler)
    boiler.parent = loco_root

    for bx in (0.1, 1.15, 2.25):
        bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.785, depth=0.09, location=(bx, 0.0, 1.72), rotation=(0.0, math.radians(90.0), 0.0))
        b_obj = bpy.context.active_object
        b_obj.data.materials.append(brass_mat)
        smooth_auto(b_obj)
        b_obj.parent = loco_root

    bpy.ops.mesh.primitive_cone_add(vertices=28, radius1=0.18, radius2=0.28, depth=1.05, location=(2.42, 0.0, 2.72))
    stk = bpy.context.active_object
    stk.data.materials.append(iron_mat)
    smooth_auto(stk)
    stk.parent = loco_root

    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, radius=0.36, location=(1.15, 0.0, 2.52))
    dome = bpy.context.active_object
    dome.data.materials.append(brass_mat)
    smooth_auto(dome)
    dome.parent = loco_root

    add_box("LocoCow", (3.35, 0.0, 0.65), (0.75, 1.48, 0.55), red_mat, loco_root)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.18, depth=0.34, location=(3.05, 0.0, 2.22), rotation=(0.0, math.radians(90.0), 0.0))
    lamp = bpy.context.active_object
    lamp.data.materials.append(lamp_mat)
    smooth_auto(lamp)
    lamp.parent = loco_root

    # Open cutaway engineer's cab matching Three.js geometry (camera views from -Y)
    add_box("CabFloor", (-1.52, 0.0, 1.08), (1.85, 1.62, 0.16), cab_mat, loco_root)
    add_box("CabBack", (-1.52, 0.76, 1.98), (1.85, 0.14, 1.85), cab_mat, loco_root)
    add_box("CabFront", (-0.62, 0.0, 1.98), (0.14, 1.62, 1.85), cab_mat, loco_root)
    add_box("CabSill", (-1.52, -0.76, 1.40), (1.85, 0.14, 0.68), cab_mat, loco_root)
    add_box("CabSillTrim", (-1.52, -0.76, 1.75), (1.88, 0.18, 0.08), red_mat, loco_root)
    add_box("CabPostBack", (-2.36, -0.76, 2.32), (0.16, 0.14, 1.18), cab_mat, loco_root)
    add_box("CabRoof", (-1.52, 0.0, 2.92), (2.12, 1.82, 0.14), red_mat, loco_root)

    # Rotating spoked drive wheels (mesh rotated +90 deg X so local Y is the axle!) + brass side rods
    wheel_objs = []
    rod_objs = []
    rot_x90 = Matrix.Rotation(math.pi * 0.5, 4, "X")
    for side_y in (-0.79, 0.79):
        for wx, wr in ((-1.6, 0.42), (-0.2, 0.56), (1.1, 0.56), (2.45, 0.36)):
            bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=wr, depth=0.10, location=(wx, side_y, 0.30 + wr))
            wh = bpy.context.active_object
            wh.data.transform(rot_x90)
            wh.data.materials.append(red_mat)
            smooth_auto(wh)
            wh.parent = loco_root
            wheel_objs.append(wh)
        rod = add_box(f"LocoRod_{side_y:+.2f}", (0.45, side_y + (0.07 if side_y > 0 else -0.07), 0.72), (1.85, 0.08, 0.10), brass_mat, loco_root)
        rod_objs.append(rod)

    # 5. Rising Blender Steam Particle Emitter at the Smokestack Tip
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
    puff_proto = bpy.context.active_object
    puff_proto.name = "SteamPuffProto"
    puff_proto.location = (0, 0, -50.0)
    puff_mat = bpy.data.materials.new("SteamPuffMat")
    puff_mat.use_nodes = True
    if hasattr(puff_mat, "blend_method"):
        puff_mat.blend_method = "BLEND"
    if hasattr(puff_mat, "shadow_method"):
        puff_mat.shadow_method = "NONE"
    pn = puff_mat.node_tree.nodes
    pl_k = puff_mat.node_tree.links
    pn.clear()
    p_out = pn.new("ShaderNodeOutputMaterial")
    p_mix = pn.new("ShaderNodeMixShader")
    p_trans = pn.new("ShaderNodeBsdfTransparent")
    p_diff = pn.new("ShaderNodeBsdfPrincipled")
    p_diff.inputs["Base Color"].default_value = (1.0, 0.94, 0.84, 1.0)
    p_diff.inputs["Roughness"].default_value = 0.9
    p_info = pn.new("ShaderNodeParticleInfo")
    p_div = pn.new("ShaderNodeMath")
    p_div.operation = "DIVIDE"
    pl_k.new(p_info.outputs["Age"], p_div.inputs[0])
    pl_k.new(p_info.outputs["Lifetime"], p_div.inputs[1])
    p_ramp = pn.new("ShaderNodeValToRGB")
    p_ramp.color_ramp.elements[0].position = 0.0
    p_ramp.color_ramp.elements[0].color = (0.72, 0.72, 0.72, 1.0)
    p_ramp.color_ramp.elements[1].position = 1.0
    p_ramp.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
    pl_k.new(p_div.outputs["Value"], p_ramp.inputs["Fac"])
    pl_k.new(p_ramp.outputs["Color"], p_mix.inputs["Fac"])
    pl_k.new(p_trans.outputs["BSDF"], p_mix.inputs[1])
    pl_k.new(p_diff.outputs["BSDF"], p_mix.inputs[2])
    pl_k.new(p_mix.outputs["Shader"], p_out.inputs["Surface"])
    puff_proto.data.materials.append(puff_mat)

    bpy.ops.mesh.primitive_circle_add(vertices=12, radius=0.18, fill_type="NGON", location=(2.42, 0.0, 3.28))
    emit_obj = bpy.context.active_object
    emit_obj.name = "SteamEmitter"
    emit_obj.parent = loco_root
    emit_obj.show_instancer_for_render = False
    emit_obj.show_instancer_for_viewport = False
    psys_mod = emit_obj.modifiers.new("SteamPSys", "PARTICLE_SYSTEM")
    ps = psys_mod.particle_system.settings
    ps.count = 160
    ps.frame_start = 1
    ps.frame_end = n_frames
    ps.lifetime = 45
    ps.lifetime_random = 0.25
    ps.normal_factor = 2.8
    ps.factor_random = 0.7
    ps.object_align_factor = (-1.4, 0.0, 1.8)
    ps.effector_weights.gravity = -0.35
    ps.particle_size = 0.42
    ps.size_random = 0.45
    ps.render_type = "OBJECT"
    ps.instance_object = puff_proto

    # Animate locomotive transform & wheels per frame
    loco_pts = paths_data.get("locomotive") or [[-6.5 + 19.5 * (i / max(1, n_frames - 1)), 0.0, 0.0] for i in range(n_frames)]
    for f in range(n_frames):
        bf = f + 1
        lx, ly, lz = loco_pts[f]
        chug = math.sin((f / fps) * 28.0) * 0.012
        loco_root.location = (lx, ly, lz + chug)
        loco_root.keyframe_insert(data_path="location", frame=bf)
        ang = -lx / 0.52
        for wh in wheel_objs:
            wh.rotation_euler = (0.0, ang, 0.0)
            wh.keyframe_insert(data_path="rotation_euler", frame=bf)
        rx = 0.45 + math.cos(ang) * 0.22
        rz = 0.72 + math.sin(ang) * 0.18
        for r in rod_objs:
            r.location.x = rx
            r.location.z = rz
            r.keyframe_insert(data_path="location", frame=bf)

    # 6. Camera with Real DoF tracking aim empty
    cam_d = bpy.data.cameras.new("MainCamera")
    cam_d.sensor_fit = "VERTICAL"
    cam_d.sensor_height = 36.0
    cam_d.clip_start = 0.05
    cam_d.clip_end = 600.0
    cam_d.dof.use_dof = True
    cam_d.dof.aperture_fstop = 4.2
    cam_obj = bpy.data.objects.new("MainCamera", cam_d)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    focus_empty = bpy.data.objects.new("FocusAimEmpty", None)
    scene.collection.objects.link(focus_empty)
    cam_d.dof.focus_object = focus_empty

    for f, c in enumerate(cam_frames):
        bf = f + 1
        cp = Vector(c["pos"])
        ap = Vector(c["aim"])
        focus_empty.location = ap
        focus_empty.keyframe_insert(data_path="location", frame=bf)
        cam_obj.location = cp
        cam_obj.keyframe_insert(data_path="location", frame=bf)

        fwd = (ap - cp).normalized()
        up_hint = Vector(c.get("up") or ([0, 1, 0] if abs(fwd.z) > 0.97 else [0, 0, 1]))
        quat = fwd.to_track_quat("-Z", "Y")
        roll_rad = math.radians(c.get("roll", 0.0))
        cam_obj.rotation_mode = "XYZ"
        cam_obj.rotation_euler = quat.to_euler()
        if abs(roll_rad) > 1e-6:
            e = quat.to_matrix()
            # Apply camera Z-roll consistently with Three.js rotateZ(-roll)
            m = e @ Euler((0.0, 0.0, -roll_rad), "XYZ").to_matrix()
            cam_obj.rotation_euler = m.to_euler()
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=bf)
        cam_d.lens = float(c.get("lens", 24.0))
        cam_d.keyframe_insert(data_path="lens", frame=bf)

    # 7. Integrate V4.0 Character PNG Sequences into Blender with Shadows & Golden-Hour Light
    cards_root = os.path.join(ep_dir, "out", "cards_seq")
    for who, runs in perf_data.items():
        who_dir = os.path.join(cards_root, who)
        idx_path = os.path.join(who_dir, "index.json")
        if not os.path.exists(idx_path):
            continue
        idx = json.load(open(idx_path, encoding="utf-8"))
        w_px, h_px = idx["px"]
        gy_px = idx["ground_px"]
        m_per_px = idx["metres_per_px"]
        w_m = w_px * m_per_px
        h_m = h_px * m_per_px
        bot_z = -((h_px - gy_px) * m_per_px)
        top_z = bot_z + h_m

        # Copy sequential b_0001.png .. b_0150.png from f_#####.png or index.json runs -> s####.png
        bseq_dir = os.path.join(who_dir, "_bseq")
        os.makedirs(bseq_dir, exist_ok=True)
        img_map = {im["img"]: os.path.join(who_dir, im["file"]) for im in idx.get("images", [])}
        run_src = [None] * n_frames
        for r in idx.get("runs", []):
            p_s = img_map.get(r.get("img"))
            for ff in range(int(r["f0"]), min(n_frames, int(r["f1"]) + 1)):
                run_src[ff] = p_s
        for f in range(n_frames):
            src_f = os.path.join(who_dir, f"f_{f:05d}.png")
            if not os.path.exists(src_f) and run_src[f]:
                src_f = run_src[f]
            dst_f = os.path.join(bseq_dir, f"b_{f + 1:04d}.png")
            if src_f and os.path.exists(src_f) and not os.path.exists(dst_f):
                shutil.copy2(src_f, dst_f)

        # Build UV-mapped upright card mesh (feet origin at z = 0)
        cmesh = bpy.data.meshes.new(f"CharCard_{who}")
        cmesh.from_pydata(
            [(-w_m * 0.5, 0.0, bot_z), (w_m * 0.5, 0.0, bot_z), (w_m * 0.5, 0.0, top_z), (-w_m * 0.5, 0.0, top_z)],
            [],
            [(0, 1, 2, 3)],
        )
        uv_layer = cmesh.uv_layers.new(name="UVMap")
        for li, uv in enumerate([(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]):
            uv_layer.data[li].uv = uv
        cobj = bpy.data.objects.new(f"Char_{who}", cmesh)
        scene.collection.objects.link(cobj)

        # Load IMAGE_SEQUENCE onto golden-lit double-sided + shadow-casting shader
        img = bpy.data.images.load(os.path.join(bseq_dir, "b_0001.png"))
        img.source = "SEQUENCE"

        cmat = bpy.data.materials.new(f"CharMat_{who}")
        cmat.use_nodes = True
        if hasattr(cmat, "blend_method"):
            cmat.blend_method = "CLIP"
        if hasattr(cmat, "shadow_method"):
            cmat.shadow_method = "CLIP"
        if hasattr(cmat, "alpha_threshold"):
            cmat.alpha_threshold = 0.25
        if hasattr(cmat, "use_backface_culling"):
            cmat.use_backface_culling = False

        cn = cmat.node_tree.nodes
        cl = cmat.node_tree.links
        cn.clear()
        c_out = cn.new("ShaderNodeOutputMaterial")
        c_alpha_mix = cn.new("ShaderNodeMixShader")
        c_transp = cn.new("ShaderNodeBsdfTransparent")
        c_add1 = cn.new("ShaderNodeAddShader")
        c_diff = cn.new("ShaderNodeBsdfDiffuse")
        c_trl = cn.new("ShaderNodeBsdfTranslucent")
        c_em = cn.new("ShaderNodeEmission")
        c_em.inputs["Strength"].default_value = 0.34  # Keeps 2D comic face crisp even against sunset rim

        c_tex = cn.new("ShaderNodeTexImage")
        c_tex.image = img
        c_tex.image_user.frame_duration = n_frames
        c_tex.image_user.frame_start = 1
        c_tex.image_user.frame_offset = 0
        c_tex.image_user.use_auto_refresh = True

        # Tint diffuse slightly warmer for golden-hour light reception while keeping face true
        c_scale_d = cn.new("ShaderNodeMixRGB")
        c_scale_d.blend_type = "MULTIPLY"
        c_scale_d.inputs["Fac"].default_value = 1.0
        c_scale_d.inputs["Color2"].default_value = (0.72, 0.65, 0.56, 1.0)
        cl.new(c_tex.outputs["Color"], c_scale_d.inputs["Color1"])
        cl.new(c_scale_d.outputs["Color"], c_diff.inputs["Color"])

        c_scale_t = cn.new("ShaderNodeMixRGB")
        c_scale_t.blend_type = "MULTIPLY"
        c_scale_t.inputs["Fac"].default_value = 1.0
        c_scale_t.inputs["Color2"].default_value = (0.22, 0.16, 0.10, 1.0)
        cl.new(c_tex.outputs["Color"], c_scale_t.inputs["Color1"])
        cl.new(c_scale_t.outputs["Color"], c_trl.inputs["Color"])

        cl.new(c_tex.outputs["Color"], c_em.inputs["Color"])
        cl.new(c_diff.outputs["BSDF"], c_add1.inputs[0])
        c_add2 = cn.new("ShaderNodeAddShader")
        cl.new(c_trl.outputs["BSDF"], c_add2.inputs[0])
        cl.new(c_em.outputs["Emission"], c_add2.inputs[1])
        cl.new(c_add2.outputs["Shader"], c_add1.inputs[1])

        cl.new(c_tex.outputs["Alpha"], c_alpha_mix.inputs["Fac"])
        cl.new(c_transp.outputs["BSDF"], c_alpha_mix.inputs[1])
        cl.new(c_add1.outputs["Shader"], c_alpha_mix.inputs[2])
        cl.new(c_alpha_mix.outputs["Shader"], c_out.inputs["Surface"])
        cobj.data.materials.append(cmat)

        # Position & turn card cleanly toward the lens per frame
        # Bake perf runs cleanly per frame
        state_by_f = [None] * n_frames
        for r in runs:
            for ff in range(r["f0"], min(n_frames, r["f1"] + 1)):
                state_by_f[ff] = r["state"]
        cobj.rotation_mode = "XYZ"
        for f in range(n_frames):
            bf = f + 1
            st = state_by_f[f] or {}
            px, py, pz = st.get("pos", [0, 0, 0])
            vis = bool(st.get("visible", True))
            cobj.hide_render = not vis
            cobj.keyframe_insert(data_path="hide_render", frame=bf)
            cobj.location = (px, py, pz)
            cobj.keyframe_insert(data_path="location", frame=bf)
            cp = cam_frames[f]["pos"]
            dx, dy = cp[0] - px, cp[1] - py
            yaw = math.atan2(dy, dx) + math.pi * 0.5
            hm = idx.get("height_m", 1.7) * 0.55
            pitch = math.atan2(cp[2] - (pz + hm), math.hypot(dx, dy))
            cobj.rotation_euler = (-pitch, 0.0, yaw)
            cobj.keyframe_insert(data_path="rotation_euler", frame=bf)

    # Render PNG frames & encode H.264 MP4 cleanly with episode audio
    frames_dir = os.path.join(ep_dir, "out", "blender_frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    if frames_range:
        f_list = frames_range
    else:
        f_list = list(range(n_frames))

    t0 = time.time()
    for f in f_list:
        scene.frame_set(f + 1)
        scene.render.filepath = os.path.join(frames_dir, f"f_{f:05d}.png")
        bpy.ops.render.render(write_still=True)
        if (f + 1) % 30 == 0:
            print(f"BLENDER_PROGRESS: {f + 1}/{len(f_list)} frames in {time.time() - t0:.1f}s", flush=True)

    render_sec = time.time() - t0
    if not frames_range:
        wav = os.path.join(ep_dir, "sound", "final_audio.wav")
        cmd = ["ffmpeg", "-y", "-v", "error", "-framerate", str(fps), "-i", os.path.join(frames_dir, "f_%05d.png")]
        if os.path.exists(wav):
            cmd += ["-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-shortest"]
        cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-movflags", "+faststart", out_mp4]
        subprocess.run(cmd, check=True)
    print(json.dumps({"blender_render_seconds": round(render_sec, 2), "frames": len(f_list), "out": out_mp4}), flush=True)


def run_colab_blender(ep_dir, out_mp4, preview_frames=None):
    root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
    ep_rel = os.path.relpath(os.path.abspath(ep_dir), root).replace("\\", "/")
    out_mp4 = os.path.abspath(out_mp4)
    os.makedirs(os.path.dirname(out_mp4), exist_ok=True)

    cred = json.load(open(r"C:\Users\PC\.ricks-clips-gcloud\application_default_credentials.json", encoding="utf-8"))
    form = urllib.parse.urlencode({
        "client_id": cred["client_id"], "client_secret": cred["client_secret"],
        "refresh_token": cred["refresh_token"], "grant_type": "refresh_token",
    }).encode("utf-8")
    tok = json.loads(urllib.request.urlopen("https://oauth2.googleapis.com/token", data=form, timeout=30).read().decode())["access_token"]
    H = {"Authorization": f"Bearer {tok}", "X-Goog-User-Project": "ricks-clips-render", "Content-Type": "application/json"}

    def mcp(n, a, timeout=300, check=True):
        raw = urllib.request.urlopen(urllib.request.Request("https://colaboratory.googleapis.com/mcp", data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": n, "arguments": a}}).encode(), headers=H), timeout=timeout).read().decode()
        dec = json.JSONDecoder()
        p = 0
        out = []
        while p < len(raw):
            rem = raw[p:].lstrip()
            if not rem:
                break
            o, end = dec.raw_decode(rem)
            if check and ("error" in o or o.get("result", {}).get("isError")):
                raise RuntimeError(f"MCP error on {n}: {json.dumps(o)}")
            out.append(o)
            p = len(raw) - len(rem) + end
        return out

    rts = mcp("list_runtimes", {})[-1]["result"].get("structuredContent", {}).get("runtimes", [])
    rt = next((r for r in rts if r.get("runtimeSpec", {}).get("variant") == "VARIANT_GPU" and r.get("connectionInfo")), None)
    is_gpu = bool(rt)
    if not rt:
        try:
            resp = mcp("create_runtime", {"requestId": str(uuid.uuid4()), "runtime": {"runtimeSpec": {"variant": "VARIANT_GPU", "accelerator": "T4", "shape": "SHAPE_STANDARD"}}}, timeout=95, check=False)[-1]["result"]
            if not resp.get("isError") and resp.get("structuredContent", {}).get("connectionInfo"):
                rt = resp["structuredContent"]
                is_gpu = True
        except Exception as e:
            print(f"GPU create_runtime fallback check ({e}); polling list_runtimes...", flush=True)
            rts2 = mcp("list_runtimes", {}, check=False)[-1]["result"].get("structuredContent", {}).get("runtimes", [])
            rt = next((r for r in rts2 if r.get("runtimeSpec", {}).get("variant") == "VARIANT_GPU" and r.get("connectionInfo")), None)
            is_gpu = bool(rt)
    if not rt:
        rt = next((r for r in rts if r.get("runtimeSpec", {}).get("variant") == "VARIANT_CPU" and r.get("connectionInfo")), None)
    if not rt:
        rt = mcp("create_runtime", {"requestId": str(uuid.uuid4()), "runtime": {"runtimeSpec": {"variant": "VARIANT_CPU", "accelerator": "NONE", "shape": "SHAPE_STANDARD"}}}, timeout=120)[-1]["result"]["structuredContent"]

    ci = rt["connectionInfo"]
    print(f"Blender Colab runtime: {rt['name']} (gpu={is_gpu})", flush=True)

    # Check if VM already holds Phase-1 cards_seq to avoid re-uploading 56MB of sprites
    vm_has_cards = False
    try:
        r_chk = urllib.request.urlopen(urllib.request.Request(f"{ci['url']}/files/content/ricks-clips/{ep_rel}/out/cards_seq/detective/index.json", headers={"X-Colab-Runtime-Proxy-Token": ci["token"]}), timeout=8)
        vm_has_cards = r_chk.status == 200
    except Exception:
        vm_has_cards = False

    cards_dir = os.path.join(os.path.abspath(ep_dir), "out", "cards_seq")
    tar_path = os.path.join(os.path.dirname(out_mp4), "blender_poc_bundle.tar.gz")
    subs = ("film.json", "out/plan", "sound") if vm_has_cards else ("film.json", "out/plan", "out/cards_seq", "sound")
    with tarfile.open(tar_path, "w:gz") as tf:
        tf.add(os.path.abspath(__file__), arcname="tools/blender_pipeline/render_blender_poc.py")
        for sub in subs:
            fp = os.path.join(os.path.abspath(ep_dir), sub)
            if os.path.isdir(fp):
                for dp, _, fns in os.walk(fp):
                    if "_bseq" in dp:
                        continue
                    for fn in fns:
                        if sub == "out/cards_seq" and fn.startswith("f_") and fn.endswith(".png"):
                            continue
                        full = os.path.join(dp, fn)
                        tf.add(full, arcname=f"{ep_rel}/{os.path.relpath(full, os.path.abspath(ep_dir)).replace(chr(92), '/')}")
            elif os.path.isfile(fp):
                tf.add(fp, arcname=f"{ep_rel}/{sub}")
    print(f"Packed {tar_path} ({os.path.getsize(tar_path) / 1e6:.2f} MB, vm_has_cards={vm_has_cards}, local_cards={os.path.isdir(cards_dir)})", flush=True)

    # Upload bundle (14 MB chunks so large unique-sprite tars never hit proxy body limits)
    raw_tar = open(tar_path, "rb").read()
    chunk_sz = 14 * 1024 * 1024
    n_chunks = max(1, (len(raw_tar) + chunk_sz - 1) // chunk_sz)
    for ci_idx in range(n_chunks):
        part = raw_tar[ci_idx * chunk_sz:(ci_idx + 1) * chunk_sz]
        rname = "content/blender_poc_bundle.tar.gz" if n_chunks == 1 else f"content/blender_poc_part_{ci_idx:03d}"
        payload = json.dumps({"type": "file", "format": "base64", "content": base64.b64encode(part).decode("ascii")}).encode("utf-8")
        req = urllib.request.Request(f"{ci['url']}/api/contents/{rname}", data=payload, method="PUT", headers={"X-Colab-Runtime-Proxy-Token": ci["token"], "Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=180).read()
        if n_chunks > 1:
            print(f"Uploaded chunk {ci_idx + 1}/{n_chunks} ({len(part) / 1e6:.2f} MB)", flush=True)

    # Run Blender 3.6 LTS headless cleanly (Eevee OpenGL 3.3 works on T4 Xvfb AND CPU Mesa llvmpipe)
    sup = f"""
import glob, json, os, shutil, subprocess, time, traceback

def set_status(state, **kw):
    d = {{"state": state, **kw}}
    tmp = "/content/blender_status.json.tmp"
    open(tmp, "w").write(json.dumps(d))
    os.replace(tmp, "/content/blender_status.json")

try:
    set_status("setup", done=0, elapsed_s=0.0)
    if {n_chunks} > 1:
        parts = sorted(glob.glob("/content/blender_poc_part_*"))
        assert len(parts) == {n_chunks}, f"Expected {n_chunks} chunks, got {{len(parts)}}"
        with open("/content/blender_poc_bundle.tar.gz", "wb") as out_f:
            for pf in parts:
                out_f.write(open(pf, "rb").read())
                os.remove(pf)
    ROOT = "/content/ricks-clips-blender"
    subprocess.run(["rm", "-rf", ROOT], check=True)
    os.makedirs(ROOT, exist_ok=True)
    subprocess.run(["tar", "-xzf", "/content/blender_poc_bundle.tar.gz", "-C", ROOT], check=True)
    if not os.path.isdir(f"{{ROOT}}/{ep_rel}/out/cards_seq"):
        alt_cards = f"/content/ricks-clips/{ep_rel}/out/cards_seq"
        assert os.path.isdir(alt_cards), f"Missing cards_seq at both bundle and {{alt_cards}}"
        shutil.copytree(alt_cards, f"{{ROOT}}/{ep_rel}/out/cards_seq")
    os.chdir(ROOT)
    if not os.path.exists("/opt/blender-3.6/blender"):
        set_status("installing_deps", done=0, elapsed_s=0.0)
        subprocess.run(
            "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq xvfb ffmpeg curl libxi6 libxxf86vm1 libxfixes3 libxrender1 libgl1 libglx-mesa0 libegl1 libgl1-mesa-dri libxkbcommon0 libsm6 libgomp1",
            shell=True, check=True,
        )
        set_status("downloading_blender", done=0, elapsed_s=0.0)
        subprocess.run(
            'VER_TAR=$(curl -fsSL --max-time 20 https://download.blender.org/release/Blender3.6/ | grep -oE "blender-3\\.6\\.[0-9]+-linux-x64\\.tar\\.xz" | sort -V | tail -n 1); '
            'VER_TAR=${{VER_TAR:-blender-3.6.23-linux-x64.tar.xz}}; '
            'echo "BLENDER_TAR=$VER_TAR"; '
            '(curl -fSL --connect-timeout 15 --max-time 240 "https://download.blender.org/release/Blender3.6/$VER_TAR" -o /tmp/blender.tar.xz || '
            'curl -fSL --connect-timeout 15 --max-time 240 "https://mirror.clarkson.edu/blender/release/Blender3.6/$VER_TAR" -o /tmp/blender.tar.xz) && '
            'mkdir -p /opt/blender-3.6 && tar -xJf /tmp/blender.tar.xz -C /opt/blender-3.6 --strip-components=1 && rm -f /tmp/blender.tar.xz',
            shell=True, check=True,
        )

    env = os.environ.copy()
    if {repr(is_gpu)}:
        os.makedirs("/usr/share/glvnd/egl_vendor.d", exist_ok=True)
        open("/usr/share/glvnd/egl_vendor.d/10_nvidia.json", "w").write('{{"file_format_version":"1.0.0","ICD":{{"library_path":"libEGL_nvidia.so.0"}}}}\\n')
        env["LD_LIBRARY_PATH"] = "/usr/lib64-nvidia:" + env.get("LD_LIBRARY_PATH", "")
        env["__GLX_VENDOR_LIBRARY_NAME"] = "nvidia"
        env["__EGL_VENDOR_LIBRARY_FILENAMES"] = "/usr/share/glvnd/egl_vendor.d/10_nvidia.json"
    else:
        env["LIBGL_ALWAYS_SOFTWARE"] = "1"
    cmd = [
        "xvfb-run", "-a", "-s", "-screen 0 1080x1920x24",
        "/opt/blender-3.6/blender", "-b", "--python-exit-code", "1",
        "--python", "tools/blender_pipeline/render_blender_poc.py",
        "--", "--ep", "{ep_rel}", "--out", "/content/compare_blender_poc.mp4"
    ]
    if {repr(preview_frames)}:
        cmd += ["--frames", {repr(preview_frames)}]
    lf = open("/content/blender_poc.log", "w")
    t0 = time.time()
    p = subprocess.Popen(cmd, env=env, stdout=lf, stderr=subprocess.STDOUT, start_new_session=True)
    while p.poll() is None:
        done = len([f for f in os.listdir(f"{{ROOT}}/{ep_rel}/out/blender_frames")]) if os.path.isdir(f"{{ROOT}}/{ep_rel}/out/blender_frames") else 0
        set_status("running", done=done, elapsed_s=round(time.time() - t0, 1))
        time.sleep(4)
    lf.close()
    txt = open("/content/blender_poc.log").read()
    set_status("done" if p.returncode == 0 else "error", rc=p.returncode, elapsed_s=round(time.time() - t0, 1), tail=txt[-1500:])
except Exception:
    log_tail = open("/content/run_b.log").read()[-800:] if os.path.exists("/content/run_b.log") else ""
    set_status("error", elapsed_s=0.0, tail=traceback.format_exc() + "\\n" + log_tail)
"""
    # Create fresh short-lived launch session with retry backoff (never delete hung legacy sessions)
    sess = None
    for attempt in range(4):
        try:
            sess = mcp("create_session", {"parent": rt["name"], "sessionId": f"blender-poc-{uuid.uuid4().hex[:6]}"})[-1]["result"]["structuredContent"]["name"]
            break
        except RuntimeError:
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))
    mcp("execute_code", {"session": sess, "executionId": str(uuid.uuid4()), "code": f"open('/content/run_b.py','w').write({repr(sup)}); import subprocess; subprocess.run('pkill -9 -f blender || true; rm -f /content/blender_status.json', shell=True); lf=open('/content/run_b.log','w'); subprocess.Popen(['nohup','python3','/content/run_b.py'],stdout=lf,stderr=subprocess.STDOUT,start_new_session=True); print('STARTED_BLENDER')"}, timeout=60)
    try:
        mcp("delete_session", {"name": sess}, timeout=12, check=False)
    except Exception:
        pass

    t0 = time.time()
    while True:
        time.sleep(15)
        try:
            st = json.loads(urllib.request.urlopen(urllib.request.Request(f"{ci['url']}/files/content/blender_status.json", headers={"X-Colab-Runtime-Proxy-Token": ci["token"]}), timeout=15).read().decode())
        except Exception:
            try:
                ci = mcp("get_runtime", {"name": rt["name"]}, timeout=30)[-1]["result"]["structuredContent"]["connectionInfo"]
            except Exception:
                pass
            continue
        print(f"Blender POC [{time.time()-t0:.0f}s] state={st.get('state')} done={st.get('done')} elapsed={st.get('elapsed_s')}s", flush=True)
        if st.get("state") == "error":
            raise RuntimeError(f"Blender failed:\n{st.get('tail')}")
        if st.get("state") == "done":
            break

    if preview_frames:
        prev_dir = os.path.join(os.path.abspath(ep_dir), "out", "blender_preview")
        os.makedirs(prev_dir, exist_ok=True)
        for fi in [int(x) for x in preview_frames.split(",") if x.strip()]:
            fn = f"f_{fi:05d}.png"
            req_dl = urllib.request.Request(
                f"{ci['url']}/files/content/ricks-clips-blender/{ep_rel}/out/blender_frames/{fn}",
                headers={"X-Colab-Runtime-Proxy-Token": ci["token"]},
            )
            dst_p = os.path.join(prev_dir, fn)
            with urllib.request.urlopen(req_dl, timeout=120) as r, open(dst_p, "wb") as f:
                shutil.copyfileobj(r, f)
            print(f"Downloaded Blender preview still -> {dst_p}", flush=True)
    else:
        req_dl = urllib.request.Request(f"{ci['url']}/files/content/compare_blender_poc.mp4", headers={"X-Colab-Runtime-Proxy-Token": ci["token"]})
        with urllib.request.urlopen(req_dl, timeout=180) as r, open(out_mp4, "wb") as f:
            shutil.copyfileobj(r, f)
        ep_out = os.path.join(os.path.abspath(ep_dir), "out", os.path.basename(out_mp4))
        if os.path.abspath(ep_out) != os.path.abspath(out_mp4):
            os.makedirs(os.path.dirname(ep_out), exist_ok=True)
            shutil.copy2(out_mp4, ep_out)
        print(f"Downloaded Blender POC MP4 -> {out_mp4} ({os.path.getsize(out_mp4)} bytes) in {st.get('elapsed_s')}s\nLOG_TAIL:\n{st.get('tail')}", flush=True)


if __name__ == "__main__":
    if inside_blender():
        argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
        ap = argparse.ArgumentParser()
        ap.add_argument("--ep", required=True)
        ap.add_argument("--out", required=True)
        ap.add_argument("--frames", default=None)
        a = ap.parse_args(argv)
        fr = [int(x) for x in a.frames.split(",")] if a.frames else None
        build_and_render_blender(a.ep, a.out, frames_range=fr)
    else:
        ap = argparse.ArgumentParser()
        ap.add_argument("--colab", action="store_true")
        ap.add_argument("--ep", default="episodes/compare-v45-showcase")
        ap.add_argument("--out", default="out/compare_blender_poc.mp4")
        ap.add_argument("--frames", default=None)
        a = ap.parse_args()
        if a.colab:
            run_colab_blender(a.ep, a.out, preview_frames=a.frames)
        else:
            print("Pass --colab to dispatch headless Blender on Colab, or launch via blender -b --python ... -- --ep <dir> --out <mp4>")
