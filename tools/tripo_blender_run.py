"""喺 Blender 入面跑：由 MCP for Blender 插件設定讀 Tripo key，再跑 tripo_generate。
blender --background --python tools/tripo_blender_run.py -- [--dry-run]
"""
import os
import sys

import bpy

key = ""
for name, addon in bpy.context.preferences.addons.items():
    prefs = addon.preferences
    if prefs is not None and getattr(prefs, "tripo_api_key", ""):
        key = prefs.tripo_api_key
        break
if not key:
    sys.exit("Blender 設定入面搵唔到 tripo_api_key")
os.environ["TRIPO_API_KEY"] = key

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
sys.argv = ["tripo_generate.py"] + args
import tripo_generate  # noqa: E402

tripo_generate.main()
