"""執好 Tripo 綁骨模型：面向 app 前方、1.75m 高、腳底貼地。
blender --background --python tools/clean_figure.py -- in.glb out.glb [--materials]
--materials：保留貼圖（有衫褲嘅模型用）
Tripo 出嘅模型面向 Blender +X；app 要面向 glTF +Z（= Blender -Y），左手 +X。
"""
import math
import sys

import bpy
from mathutils import Matrix, Vector

args = sys.argv[sys.argv.index("--") + 1:]
src, dst = args[:2]
KEEP_MAT = "--materials" in args
HEIGHT = 1.75

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
# 匯入器整嘅骨頭顯示形狀，唔要
for o in list(bpy.data.objects):
    if o.type == "MESH" and o.parent is None:
        bpy.data.objects.remove(o)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
body = next(o for o in bpy.data.objects if o.type == "MESH")

def bbox():
    pts = [body.matrix_world @ v.co for v in body.data.vertices]
    return (Vector([min(p[i] for p in pts) for i in range(3)]),
            Vector([max(p[i] for p in pts) for i in range(3)]))

lo, hi = bbox()
s = HEIGHT / (hi.z - lo.z)
cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
# 移去中心、腳底 z=0、轉 -90 度令佢面向 -Y、縮放
m = (Matrix.Scale(s, 4) @ Matrix.Rotation(-math.pi / 2, 4, "Z")
     @ Matrix.Translation((-cx, -cy, -lo.z)))
arm.matrix_world = m @ arm.matrix_world

bpy.ops.object.select_all(action="DESELECT")
for o in (arm, body):
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.context.view_layer.update()

lo, hi = bbox()
print("BBOX", tuple(round(v, 3) for v in lo), tuple(round(v, 3) for v in hi))
for n in ("mixamorig:Hips", "mixamorig:LeftUpLeg", "mixamorig:LeftFoot", "mixamorig:LeftToeBase", "mixamorig:LeftHand", "mixamorig:Head"):
    print("BONE", n, tuple(round(v, 3) for v in arm.matrix_world @ arm.data.bones[n].head_local))

if not KEEP_MAT:
    body.data.materials.clear()
bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_animations=False,
                          export_skins=True, export_materials="EXPORT" if KEEP_MAT else "NONE",
                          export_image_format="JPEG", export_jpeg_quality=88, export_yup=True)
print("EXPORTED", dst)
