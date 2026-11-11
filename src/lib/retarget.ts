import * as THREE from 'three';
import { NEUTRAL, Pose, rootHeight, toeAngle, Vec3 } from './pose';

// 將 app 嘅 Pose（關節角度）轉做 Mixamo 骨架嘅骨頭旋轉。
//
// 做法：每段身體（例如左大髀）喺 app 入面有一個「世界旋轉」A，
// 即係由靜止姿勢轉咗幾多。骨頭最終世界旋轉 = A × 校正 × 骨頭原本世界旋轉。
// 校正：模型係 A-pose，手腳唔係垂直；app 靜止時手腳垂直向下，
// 所以先將手臂同腳嘅骨轉到垂直，再套 app 角度。
// 用世界旋轉計，就唔使理每條骨自己嘅軸向。

export type Segment =
  | 'hips' | 'spine0' | 'spine1' | 'spine2' | 'neck' | 'head'
  | 'lClav' | 'rClav' | 'lArm' | 'lFore' | 'lHand' | 'rArm' | 'rFore' | 'rHand'
  | 'lThigh' | 'lShin' | 'lFoot' | 'lToe'
  | 'rThigh' | 'rShin' | 'rFoot' | 'rToe';

// Mixamo 骨名（去咗 "mixamorig" 同符號）-> app 身體段
const BONE_SEGMENT: Record<string, Segment> = {
  Hips: 'hips',
  Spine: 'spine0',
  Spine1: 'spine1',
  Spine2: 'spine2',
  Neck: 'neck',
  Head: 'head',
  LeftShoulder: 'lClav',
  RightShoulder: 'rClav',
  LeftHand: 'lHand',
  RightHand: 'rHand',
  LeftArm: 'lArm',
  LeftForeArm: 'lFore',
  RightArm: 'rArm',
  RightForeArm: 'rFore',
  LeftUpLeg: 'lThigh',
  LeftLeg: 'lShin',
  LeftFoot: 'lFoot',
  LeftToeBase: 'lToe',
  RightUpLeg: 'rThigh',
  RightLeg: 'rShin',
  RightFoot: 'rFoot',
  RightToeBase: 'rToe',
};

// 呢啲骨靜止時要轉到垂直向下
const STRAIGHTEN = new Set(['LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']);

// 手掌跟前臂嘅校正（唔係就會保持 A-pose 嘅手腕角度）
const INHERIT = new Set(['LeftHand', 'RightHand']);

// ───── 手腳要掂到嘅位（IK） ─────
// bone = 'world'：at 係世界座標；否則 at 係嗰段身體嘅座標（靜止時 +X 左、+Y 上、+Z 前，原點喺關節）
export type V3 = [number, number, number];
// bone = 'floor'：手／腳而家嘅位置直落地（at = 平移同離地高度）
export type Anchor = { bone: Segment | 'world' | 'floor'; at: V3 };
export type Limb = 'lFoot' | 'rFoot' | 'lHand' | 'rHand';
export type Reach = Partial<Record<Limb, Anchor>>;
const LIMBS: Limb[] = ['lFoot', 'rFoot', 'lHand', 'rHand'];
const CHAIN: Record<Limb, Segment[]> = {
  lHand: ['lArm', 'lFore', 'lHand'],
  rHand: ['rArm', 'rFore', 'rHand'],
  lFoot: ['lThigh', 'lShin', 'lFoot', 'lToe'],
  rFoot: ['rThigh', 'rShin', 'rFoot', 'rToe'],
};
const flip = <T extends string>(k: T): T => (/^l[A-Z]/.test(k) ? 'r' + k.slice(1) : /^r[A-Z]/.test(k) ? 'l' + k.slice(1) : k) as T;
export function mirrorReach(r?: Reach): Reach | undefined {
  if (!r) return r;
  const out: Reach = {};
  for (const k of LIMBS) {
    const a = r[k];
    if (a) out[flip(k)] = { bone: flip(a.bone), at: [-a.at[0], a.at[1], a.at[2]] };
  }
  return out;
}

// 落地用嘅接觸點：骨名 -> 半徑（腳掌嗰幾粒由模型量）
const CONTACT: Record<string, number> = {
  LeftUpLeg: 0.11, RightUpLeg: 0.11, Spine2: 0.11, Head: 0.09,
  LeftLeg: 0.055, RightLeg: 0.055, LeftForeArm: 0.04, RightForeArm: 0.04,
  LeftHand: 0.03, RightHand: 0.03, LeftHandMiddle1: 0.02, RightHandMiddle1: 0.02,
  LeftFoot: -1, RightFoot: -1, LeftToeBase: -1, RightToeBase: -1, LeftToe_End: -1, RightToe_End: -1,
};

const DOWN = new THREE.Vector3(0, -1, 0);
const ID = new THREE.Quaternion();

const boneKey = (name: string) => name.replace(/[^A-Za-z0-9]/g, '').replace(/^mixamorig\d*/, '');

type Entry = {
  bone: THREE.Bone;
  seg: Segment;
  corr: THREE.Quaternion; // 校正
  restQ: THREE.Quaternion; // 原本世界旋轉
  parent: Entry | null;
  parentRestQ: THREE.Quaternion; // 父節點唔係骨時用
  world: THREE.Quaternion; // 今格世界旋轉
};

export class Rig {
  private entries: Entry[] = [];
  private hips: Entry;
  private hipsOffset = new THREE.Vector3(); // Hips 骨離髖關節中心
  private hipsParentInv = new THREE.Matrix4();
  readonly seg = {} as Record<Segment, THREE.Quaternion>;
  readonly bones = {} as Record<Segment, THREE.Bone>;
  private segOfBone = new Map<THREE.Object3D, Segment>();
  private contacts: { bone: THREE.Bone; r: number }[] = [];

  // 呢條骨屬於邊段身體（手指、鎖骨跟返上一級）
  segmentOf(bone: THREE.Object3D): Segment {
    return this.segOfBone.get(bone) ?? 'hips';
  }

  constructor(root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const byBone = new Map<THREE.Object3D, Entry>();
    root.traverse((o) => {
      if (!(o as THREE.Bone).isBone) return;
      const bone = o as THREE.Bone;
      const key = boneKey(bone.name);
      const parent = byBone.get(bone.parent!) ?? null;
      const mapped = BONE_SEGMENT[key];
      let corr = parent ? parent.corr : ID;
      if (CONTACT[key] !== undefined) this.contacts.push({ bone, r: CONTACT[key] });
      if (mapped) {
        if (!INHERIT.has(key)) corr = ID;
        const child = bone.children.find((c) => (c as THREE.Bone).isBone);
        if (STRAIGHTEN.has(key) && child) {
          const dir = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
          corr = new THREE.Quaternion().setFromUnitVectors(dir, DOWN);
        }
        this.bones[mapped] = bone;
      }
      const e: Entry = {
        bone,
        seg: mapped ?? parent?.seg ?? 'hips',
        corr,
        restQ: bone.getWorldQuaternion(new THREE.Quaternion()),
        parent,
        parentRestQ: bone.parent!.getWorldQuaternion(new THREE.Quaternion()),
        world: new THREE.Quaternion(),
      };
      byBone.set(bone, e);
      this.segOfBone.set(bone, e.seg);
      this.entries.push(e);
    });
    const hips = this.entries.find((e) => boneKey(e.bone.name) === 'Hips');
    if (!hips || !this.bones.lThigh || !this.bones.rThigh) throw new Error('模型唔係 Mixamo 骨架');
    this.hips = hips;
    const lHip = this.bones.lThigh.getWorldPosition(new THREE.Vector3());
    const rHip = this.bones.rThigh.getWorldPosition(new THREE.Vector3());
    const center = lHip.add(rHip).multiplyScalar(0.5);
    this.hipsOffset.copy(hips.bone.getWorldPosition(new THREE.Vector3())).sub(center);
    this.hipsParentInv.copy(hips.bone.parent!.matrixWorld).invert();
    for (const s of Object.values(BONE_SEGMENT)) this.seg[s] = new THREE.Quaternion();
    // 量腳掌各點企直時離地幾高
    this.apply(NEUTRAL);
    const v = new THREE.Vector3();
    for (const c of this.contacts) if (c.r < 0) c.r = Math.max(0.005, c.bone.getWorldPosition(v).y);
  }

  // 由 Pose 計每段身體嘅世界旋轉（同舊版公仔嘅 group 層級一樣）
  private computeSegments(p: Pose) {
    const s = this.seg;
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const rot = (v: Vec3) => q.setFromEuler(e.set(v[0], v[1], v[2], 'XYZ'));
    const rx = (a: number) => q.setFromEuler(e.set(a, 0, 0, 'XYZ'));

    s.hips.setFromEuler(e.set(p.tilt, p.twist, 0, 'XYZ'));
    // 脊骨三節平均分個彎
    const spine = new THREE.Quaternion().setFromEuler(e.set(p.spine[0], p.spine[1], p.spine[2], 'XYZ'));
    s.spine0.copy(s.hips).multiply(new THREE.Quaternion().slerpQuaternions(ID, spine, 1 / 3));
    s.spine1.copy(s.hips).multiply(new THREE.Quaternion().slerpQuaternions(ID, spine, 2 / 3));
    s.spine2.copy(s.hips).multiply(spine);
    const neck = new THREE.Quaternion().setFromEuler(e.set(p.neck[0], p.neck[1], p.neck[2], 'XYZ'));
    s.neck.copy(s.spine2).multiply(new THREE.Quaternion().slerpQuaternions(ID, neck, 0.5));
    s.head.copy(s.spine2).multiply(neck);

    s.lClav.copy(s.spine2).multiply(q.setFromEuler(e.set(0, 0, p.lShrug, 'XYZ')));
    s.rClav.copy(s.spine2).multiply(q.setFromEuler(e.set(0, 0, -p.rShrug, 'XYZ')));
    s.lArm.copy(s.spine2).multiply(rot(p.lShoulder));
    s.lFore.copy(s.lArm).multiply(rot(p.lElbow));
    s.lHand.copy(s.lFore).multiply(rot(p.lWrist));
    s.rArm.copy(s.spine2).multiply(rot(p.rShoulder));
    s.rFore.copy(s.rArm).multiply(rot(p.rElbow));
    s.rHand.copy(s.rFore).multiply(rot(p.rWrist));

    s.lThigh.copy(s.hips).multiply(rot(p.lHip));
    s.lShin.copy(s.lThigh).multiply(rx(p.lKnee));
    s.lFoot.copy(s.lShin).multiply(rx(p.lAnkle));
    s.lToe.copy(s.lFoot).multiply(rx(toeAngle(p.lToe, p.lAnkle, Math.max(p.seat, p.ground))));
    s.rThigh.copy(s.hips).multiply(rot(p.rHip));
    s.rShin.copy(s.rThigh).multiply(rx(p.rKnee));
    s.rFoot.copy(s.rShin).multiply(rx(p.rAnkle));
    s.rToe.copy(s.rFoot).multiply(rx(toeAngle(p.rToe, p.rAnkle, Math.max(p.seat, p.ground))));
  }

  // 將各段世界旋轉寫落骨頭，再擺好盤骨高度
  private write(p: Pose) {
    const inv = new THREE.Quaternion();
    for (const e of this.entries) {
      e.world.copy(this.seg[e.seg]).multiply(e.corr).multiply(e.restQ);
      inv.copy(e.parent ? e.parent.world : e.parentRestQ).invert();
      e.bone.quaternion.copy(inv).multiply(e.world);
    }
    const base = this.hipsOffset.clone().applyQuaternion(this.seg.hips);
    base.x += p.shift;
    const place = (y: number) => {
      this.hips.bone.position.copy(base.clone().setY(base.y + y).applyMatrix4(this.hipsParentInv));
      this.hips.bone.updateMatrixWorld(true);
    };
    let y = rootHeight(p);
    if (p.ground > 0.001) {
      // 搵最低嗰點，升到啱啱貼地
      place(0);
      let low = Infinity;
      const v = new THREE.Vector3();
      for (const c of this.contacts) low = Math.min(low, c.bone.getWorldPosition(v).y - c.r);
      y += (-low + p.lift - y) * Math.min(1, p.ground);
    }
    place(y);
  }

  private anchorPos(a: Anchor, out: THREE.Vector3, from?: THREE.Vector3) {
    out.set(a.at[0], a.at[1], a.at[2]);
    if (a.bone === 'world') return out;
    if (a.bone === 'floor') return from ? out.set(from.x + a.at[0], a.at[1], from.z + a.at[2]) : out;
    return out.applyQuaternion(this.seg[a.bone]).add(this.bones[a.bone].getWorldPosition(new THREE.Vector3()));
  }

  // 兩節 IK：由而家嘅姿勢出發，最少改動令手／腳去到目標
  private solve(limb: Limb, a: Anchor, w: number) {
    const [u, l, e, t] = CHAIN[limb];
    const S = this.bones[u].getWorldPosition(new THREE.Vector3());
    const E = this.bones[l].getWorldPosition(new THREE.Vector3());
    const H = this.bones[e].getWorldPosition(new THREE.Vector3());
    const T = this.anchorPos(a, new THREE.Vector3(), H).sub(H).multiplyScalar(w).add(H);
    const L1 = E.distanceTo(S);
    const L2 = H.distanceTo(E);
    const n = T.clone().sub(S);
    const d = Math.min(L1 + L2 - 0.002, Math.max(Math.abs(L1 - L2) + 0.002, n.length()));
    n.normalize();
    const se = E.clone().sub(S);
    const perp = se.clone().addScaledVector(n, -se.dot(n));
    if (perp.lengthSq() < 1e-6) {
      perp.set(0, 0, t ? 1 : -1); // 腳：膝頭向前；手：手肘向後
      perp.addScaledVector(n, -perp.dot(n));
    }
    perp.normalize();
    const along = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
    const E2 = S.clone().addScaledVector(n, along).addScaledVector(perp, h);
    const H2 = S.clone().addScaledVector(n, d);
    const q1 = new THREE.Quaternion().setFromUnitVectors(se.normalize(), E2.clone().sub(S).normalize());
    const fore = H.clone().sub(E).normalize().applyQuaternion(q1);
    const q2 = new THREE.Quaternion().setFromUnitVectors(fore, H2.sub(E2).normalize()).multiply(q1);
    this.seg[u].premultiply(q1);
    this.seg[l].premultiply(q2);
    this.seg[e].premultiply(q2);
    if (t) this.seg[t].premultiply(q2);
  }

  // 手／腳離目標仲差幾遠（米），驗證用
  reachError(reach?: Reach): number {
    let worst = 0;
    const v = new THREE.Vector3();
    const h = new THREE.Vector3();
    if (reach) for (const k of LIMBS) {
      const a = reach[k];
      if (a) {
        this.bones[CHAIN[k][2]].getWorldPosition(h);
        worst = Math.max(worst, this.anchorPos(a, v, h).distanceTo(h));
      }
    }
    return worst;
  }

  // 最低接觸點離地幾高（負數 = 穿地），驗證用
  lowest(): number {
    let low = Infinity;
    const v = new THREE.Vector3();
    for (const c of this.contacts) low = Math.min(low, c.bone.getWorldPosition(v).y - c.r);
    return low;
  }

  apply(p: Pose, reach?: Reach, w = 0) {
    this.computeSegments(p);
    this.write(p);
    if (!reach || w <= 0.001) return;
    // 做兩轉：一隻手郁咗，另一隻嘅目標可能跟住郁
    for (let i = 0; i < 2; i++)
      for (const k of LIMBS) {
        const a = reach[k];
        if (!a) continue;
        this.solve(k, a, i ? 1 : Math.min(1, w));
        this.write(p);
      }
  }
}
