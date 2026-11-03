import * as THREE from 'three';
import { Pose, rootHeight, toeAngle, Vec3 } from './pose';

// 將 app 嘅 Pose（關節角度）轉做 Mixamo 骨架嘅骨頭旋轉。
//
// 做法：每段身體（例如左大髀）喺 app 入面有一個「世界旋轉」A，
// 即係由靜止姿勢轉咗幾多。骨頭最終世界旋轉 = A × 校正 × 骨頭原本世界旋轉。
// 校正：模型係 A-pose，手腳唔係垂直；app 靜止時手腳垂直向下，
// 所以先將手臂同腳嘅骨轉到垂直，再套 app 角度。
// 用世界旋轉計，就唔使理每條骨自己嘅軸向。

export type Segment =
  | 'hips' | 'spine0' | 'spine1' | 'spine2' | 'neck' | 'head'
  | 'lArm' | 'lFore' | 'rArm' | 'rFore'
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
      if (mapped) {
        corr = ID;
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

    s.lArm.copy(s.spine2).multiply(rot(p.lShoulder));
    s.lFore.copy(s.lArm).multiply(rot(p.lElbow));
    s.rArm.copy(s.spine2).multiply(rot(p.rShoulder));
    s.rFore.copy(s.rArm).multiply(rot(p.rElbow));

    s.lThigh.copy(s.hips).multiply(rot(p.lHip));
    s.lShin.copy(s.lThigh).multiply(rx(p.lKnee));
    s.lFoot.copy(s.lShin).multiply(rx(p.lAnkle));
    s.lToe.copy(s.lFoot).multiply(rx(toeAngle(p.lToe, p.lAnkle, p.seat)));
    s.rThigh.copy(s.hips).multiply(rot(p.rHip));
    s.rShin.copy(s.rThigh).multiply(rx(p.rKnee));
    s.rFoot.copy(s.rShin).multiply(rx(p.rAnkle));
    s.rToe.copy(s.rFoot).multiply(rx(toeAngle(p.rToe, p.rAnkle, p.seat)));
  }

  apply(p: Pose) {
    this.computeSegments(p);
    const inv = new THREE.Quaternion();
    for (const e of this.entries) {
      e.world.copy(this.seg[e.seg]).multiply(e.corr).multiply(e.restQ);
      inv.copy(e.parent ? e.parent.world : e.parentRestQ).invert();
      e.bone.quaternion.copy(inv).multiply(e.world);
    }
    // 髖關節中心擺喺 (shift, 高度, 0)
    const pos = this.hipsOffset.clone().applyQuaternion(this.seg.hips);
    pos.x += p.shift;
    pos.y += rootHeight(p);
    this.hips.bone.position.copy(pos.applyMatrix4(this.hipsParentInv));
    this.hips.bone.updateMatrixWorld(true);
  }
}
