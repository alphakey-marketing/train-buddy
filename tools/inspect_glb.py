"""blender --background --python tools/inspect_glb.py -- path.glb [render.png]"""
import sys, math
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args[0])
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
print("MESHES", len(meshes), "TRIS", tris, "VERTS", sum(len(o.data.vertices) for o in meshes))
print("BBOX min", tuple(round(v, 3) for v in lo), "max", tuple(round(v, 3) for v in hi))
for a in arms:
    print("ARMATURE", a.name, "bones", len(a.data.bones))
    for b in a.data.bones:
        print("  BONE", b.name, "parent", b.parent.name if b.parent else "-",
              "head", tuple(round(v, 3) for v in (a.matrix_world @ b.head_local)))
for o in meshes:
    print("MESH", o.name, "groups", len(o.vertex_groups), "mats", [m.name for m in o.data.materials if m])
print("ANIMS", [ac.name for ac in bpy.data.actions])

if len(args) > 1:
    # 前、側兩個角度合成一張圖
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.render.resolution_x, sc.render.resolution_y = 600, 900
    sc.display.shading.light = "STUDIO"
    world = bpy.data.worlds.new("w"); sc.world = world
    c = (lo + hi) / 2; h = (hi - lo).length
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = "ORTHO"; cam.data.ortho_scale = h * 0.85
    for tag, d in (("front", Vector((0, -1, 0))), ("side", Vector((1, 0, 0))), ("back", Vector((0, 1, 0)))):
        cam.location = c + d * 5
        cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = args[1].replace(".png", f"-{tag}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDER", sc.render.filepath)
