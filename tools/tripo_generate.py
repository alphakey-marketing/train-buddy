"""Tripo 一條龍：參考圖 -> 3D 模型 -> 自動綁骨 -> GLB。

用法（用 Blender 自帶 python 都得，只用標準庫）：
    python tools/tripo_generate.py [--dry-run]
    python tools/tripo_generate.py --preset coach-f   # 正面+背面兩張圖，有貼圖

Key 來源（按次序）：
    1. 環境變數 TRIPO_API_KEY
    2. 檔案 %USERPROFILE%\\.tripo_key（只放條 key，一行）
條 key 唔會印出嚟，亦唔會寫入 repo。

每步 task id 存喺 tools/tripo_state.json。中途斷咗再跑，會由上次完成嗰步繼續，唔會重複扣 credit。
"""
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE = os.path.join(ROOT, "assets", "reference", "mannequin-front.png")
OUT_DIR = os.path.join(ROOT, "assets", "models")
STATE = os.path.join(ROOT, "tools", "tripo_state.json")
BASE = os.environ.get("TRIPO_API_BASE", "https://openapi.tripo3d.ai/v3")

# 光身灰公仔：唔使貼圖，慳 credit；面數夠手機用
GEN_BODY = {
    "model": "v3.1-20260211",
    "texture": False,
    "pbr": False,
    "face_limit": 20000,
    "auto_size": True,
}
# mixamo 骨名人人識，有腳趾骨 (LeftToeBase)
RIG_BODY = {
    "model": "v3.0-20260909",
    "rig_type": "biped",
    "spec": "mixamo",
    "out_format": "glb",
}


def load_key():
    key = os.environ.get("TRIPO_API_KEY", "").strip()
    if not key:
        path = os.path.join(os.path.expanduser("~"), ".tripo_key")
        if os.path.exists(path):
            with open(path, encoding="utf-8-sig") as f:
                key = f.read().strip()
    if not key:
        sys.exit("搵唔到 key：設 TRIPO_API_KEY 或者寫入 ~/.tripo_key")
    return key


KEY = None


def request(method, path, body=None, data=None, headers=None):
    h = {"Authorization": f"Bearer {KEY}"}
    if headers:
        h.update(headers)
    if body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} -> HTTP {e.code}: {e.read()[:500].decode(errors='replace')}")
    if res.get("code") != 0:
        sys.exit(f"{method} {path} -> {res}")
    return res["data"]


def upload(path):
    boundary = uuid.uuid4().hex
    mime = mimetypes.guess_type(path)[0] or "image/png"
    with open(path, "rb") as f:
        payload = f.read()
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
        f"filename=\"{os.path.basename(path)}\"\r\nContent-Type: {mime}\r\n\r\n"
    ).encode() + payload + f"\r\n--{boundary}--\r\n".encode()
    data = request("POST", "/files", data=body,
                   headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return data["file_token"]


def wait(task_id, label):
    last = None
    while True:
        d = request("GET", f"/tasks/{task_id}")
        st, pr = d.get("status"), d.get("progress")
        if (st, pr) != last:
            print(f"  {label}: {st} {pr}%", flush=True)
            last = (st, pr)
        if st == "success":
            return d
        if st in ("failed", "cancelled", "banned", "expired", "unknown"):
            sys.exit(f"{label} 失敗：{d}")
        time.sleep(3)


def model_url(out):
    for k in ("model_url", "pbr_model_url", "base_model_url"):
        if out.get(k):
            return out[k]
    urls = out.get("model_urls")
    if isinstance(urls, list) and urls:
        return urls[0] if isinstance(urls[0], str) else urls[0].get("url")
    if isinstance(urls, dict) and urls:
        return next(iter(urls.values()))
    sys.exit(f"output 冇 model url：{list(out)}")


def download(url, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    dest = os.path.join(OUT_DIR, name)
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    print(f"  存咗 {dest} ({os.path.getsize(dest) // 1024} KB)")
    return dest


# 第二代教練：多張圖 + 貼圖（衫褲樣真），檔名分開，唔會蓋舊模型
PRESETS = {
    "coach-f": {
        "views": {"front": "coach-f-front.png", "back": "coach-f-back.png"},
        "gen": {
            "model": "v3.1-20260211",
            "texture": True,
            "pbr": False,
            "texture_quality": "standard",
            "face_limit": 20000,
            "auto_size": True,
        },
        "name": "coach-f",
    },
}


def main():
    global KEY, STATE
    dry = "--dry-run" in sys.argv
    preset = None
    if "--preset" in sys.argv:
        preset = PRESETS[sys.argv[sys.argv.index("--preset") + 1]]
        STATE = os.path.join(ROOT, "tools", f"tripo_state_{preset['name']}.json")
    KEY = load_key()
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    save = lambda: json.dump(state, open(STATE, "w"), indent=2)

    bal = request("GET", "/account/balance")
    print(f"餘額：{bal.get('balance')} credits（凍結 {bal.get('frozen')}）")
    if dry:
        print("dry run：key 用得，唔扣 credit。")
        return

    name = preset["name"] if preset else "figure"
    ref = os.path.join(ROOT, "assets", "reference")

    # 1. 上載參考圖
    if preset:
        for view, fn in preset["views"].items():
            if f"tok_{view}" not in state:
                state[f"tok_{view}"] = upload(os.path.join(ref, fn))
                save()
                print(f"上載咗 {view}")
    elif "file_token" not in state:
        state["file_token"] = upload(IMAGE)
        save()
        print("上載咗參考圖")

    # 2. 生成模型
    if "gen_task" not in state:
        if preset:
            inputs = [{v: {"file_token": state[f"tok_{v}"]}} for v in preset["views"]]
            d = request("POST", "/generation/multiview-to-model", {"inputs": inputs, **preset["gen"]})
        else:
            d = request("POST", "/generation/image-to-model", {"input": state["file_token"], **GEN_BODY})
        state["gen_task"] = d["task_id"]
        save()
    g = wait(state["gen_task"], "生成")
    print(f"  用咗 {g.get('credits_consumed')} credits")
    if not os.path.exists(os.path.join(OUT_DIR, f"{name}-raw.glb")):
        download(model_url(g["output"]), f"{name}-raw.glb")

    # 3. 檢查綁唔綁到骨（官方建議先做）
    chk = request("POST", "/animations/rig-check", {"input": state["gen_task"]})
    if "task_id" in chk:
        chk = wait(chk["task_id"], "綁骨檢查").get("output", {})
    print(f"  綁骨檢查：{chk}")
    if chk.get("riggable") is False:
        sys.exit("Tripo 話綁唔到骨，停手。")

    # 4. 綁骨
    if "rig_task" not in state:
        d = request("POST", "/animations/rig", {"input": state["gen_task"], **RIG_BODY})
        state["rig_task"] = d["task_id"]
        save()
    r = wait(state["rig_task"], "綁骨")
    print(f"  用咗 {r.get('credits_consumed')} credits")
    download(model_url(r["output"]), "figure.glb" if not preset else f"{name}-rigged.glb")

    bal = request("GET", "/account/balance")
    print(f"完成。餘額：{bal.get('balance')} credits")


if __name__ == "__main__":
    main()
