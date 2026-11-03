"""量 figure.glb 骨位（輸出 app 座標：x 左、y 上、z 前）。
blender --background --python tools/measure_figure.py -- assets/models/figure.glb
"""
import sys
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[-1])
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
body = next(o for o in bpy.data.objects if o.type == "MESH" and o.parent)
app = lambda v: (round(v.x, 3), round(v.z, 3), round(-v.y, 3))
for b in arm.data.bones:
    if any(k in b.name for k in ("Index", "Middle", "Ring", "Pinky", "Thumb")):
        continue
    print("BONE", b.name.split(":")[-1], app(arm.matrix_world @ b.head_local))
# 每個高度切片嘅身體闊度同厚度，用嚟擺肌肉
vs = [body.matrix_world @ v.co for v in body.data.vertices]
for y in [i / 20 for i in range(1, 35)]:
    sl = [v for v in vs if abs(v.z - y) < 0.01 and abs(v.x) < 0.25]
    if sl:
        print("SLICE y=%.2f x %.3f..%.3f z %.3f..%.3f" % (y, min(v.x for v in sl), max(v.x for v in sl), min(-v.y for v in sl), max(-v.y for v in sl)))
