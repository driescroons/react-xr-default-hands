import { XRController } from '@react-three/xr'
import {
  Euler,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  Object3D,
  ObjectLoader,
  Quaternion,
  Vector2,
  Vector3,
  XRHandedness,
  XRHandJoint,
  XRInputSource
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { idlePose } from './poses/idle'
import { pinchPose } from './poses/pinch'
import { defaultPose } from './poses/default'

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/'

const TOUCH_RADIUS = 0.01

const XRHandJoints = [
  'wrist',
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
  'index-finger-metacarpal',
  'index-finger-phalanx-proximal',
  'index-finger-phalanx-intermediate',
  'index-finger-phalanx-distal',
  'index-finger-tip',
  'middle-finger-metacarpal',
  'middle-finger-phalanx-proximal',
  'middle-finger-phalanx-intermediate',
  'middle-finger-phalanx-distal',
  'middle-finger-tip',
  'ring-finger-metacarpal',
  'ring-finger-phalanx-proximal',
  'ring-finger-phalanx-intermediate',
  'ring-finger-phalanx-distal',
  'ring-finger-tip',
  'pinky-finger-metacarpal',
  'pinky-finger-phalanx-proximal',
  'pinky-finger-phalanx-intermediate',
  'pinky-finger-phalanx-distal',
  'pinky-finger-tip'
]

export type XRPose = 'pinch' | 'idle' | 'default'

const poses: { [key in XRPose]: object } = {
  idle: idlePose,
  pinch: pinchPose,
  default: defaultPose
}

class HandModel extends Object3D {
  controller: Group
  bones: Object3D[] = []

  inputSource: XRInputSource
  path: string

  model: Object3D
  isHandTracking: boolean

  loading: boolean

  constructor(controller: Group, inputSource: XRInputSource) {
    super()

    this.controller = controller
    this.inputSource = inputSource
  }

  load(controller: Group, inputSource: XRInputSource, isHandTracking: boolean, onLoadedCallback: () => void) {
    super.clear()
    this.controller.remove(this)

    this.controller = controller
    this.inputSource = inputSource
    this.isHandTracking = isHandTracking

    if (!this.loading) {
      this.loading = true
      const loader = new GLTFLoader()
      loader.setPath(DEFAULT_HAND_PROFILE_PATH)
      const fileHandedness = isHandTracking ? this.inputSource.handedness : 'right'
      loader.load(`${fileHandedness}.glb`, (gltf) => {
        this.model = gltf.scene.children[0]
        super.add(this.model)

        const mesh = this.model.getObjectByProperty('type', 'SkinnedMesh')! as Mesh
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true
        ;(mesh.material as any).side = 0 // Workaround: force FrontSide = 0

        this.bones = []
        XRHandJoints.forEach((jointName: string) => {
          const bone = this.model.getObjectByName(jointName)
          if (bone !== undefined) {
            ;(bone as any).jointName = jointName
          } else {
            console.log(`Couldn't find ${jointName} in ${this.inputSource.handedness} hand mesh`)
          }
          this.bones.push(bone!)
        })

        if (!isHandTracking) {
          this.setPose('idle')
          this.model.setRotationFromEuler(new Euler(Math.PI / 2, -Math.PI / 2, 0))

          // only mirror the left one (this is also the right model here)
          if (this.inputSource.handedness === 'left') {
            this.model.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
          }

          // hand position offset
          this.model.position.sub(new Vector3(0, 0.05, -0.1))
        }

        this.controller.add(this)
        onLoadedCallback()
        this.loading = false
      })
    }
  }

  updateMatrixWorld(force: boolean) {
    super.updateMatrixWorld(force)

    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i]
      if (bone) {
        const XRJoint = ((this.controller as any)?.joints || [])[(bone as any).jointName]
        if (XRJoint?.visible) {
          const position = XRJoint.position
          bone.position.copy(position)
          bone.quaternion.copy(XRJoint.quaternion)
        }
      }
    }
  }

  setPose(poseType: XRPose = 'idle') {
    if (!this.isHandTracking) {
      const pose = poses[poseType]
      for (let i = 0; i < this.bones.length; i++) {
        const bone = this.bones[i]
        if (bone) {
          const joint = pose[(bone as any).jointName]
          const position = joint.position
          bone.position.copy(new Vector3().fromArray(position))
          bone.quaternion.copy(new Quaternion().fromArray(joint.quaternion))
        }
      }
    }
  }

  getHandTransform() {
    const quaternion = new Quaternion()
    const rotation = this.getHandMatrix().decompose(new Vector3(), quaternion, new Vector3())
    const position = this.getHandPosition()

    return new Matrix4().compose(position, quaternion, new Vector3(1, 1, 1))
  }

  getHandMatrix() {
    const indexTip = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = this!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D
    const indexKnuckle = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-metacarpal')! as Object3D
    const pinkyKnuckle = this!.bones.find((bone) => (bone as any).jointName === 'pinky-finger-metacarpal')! as Object3D

    const z = thumbTip.getWorldPosition(new Vector3()).sub(indexTip.getWorldPosition(new Vector3())).normalize()

    const y = indexKnuckle.getWorldPosition(new Vector3()).sub(pinkyKnuckle.getWorldPosition(new Vector3())).normalize()

    const x = new Vector3().crossVectors(z, y).negate()

    const y2 = new Vector3().crossVectors(x, z).negate()

    return new Matrix4().makeBasis(x, y2, z)

    // with set coords, the matrix does not do weird stuff

    // let coords = [
    //   [0.7583325866001847, -0.21434992435107506, 0.31402240533921655],
    //   [0.3573377628433147, 0.6411351180495899, -0.42529960812789247],
    //   [-0.15309079643139686, 0.6041077712559645, 0.7820594662531438]
    // ]

    // // let coords = [
    // //   [0.7583325866001847, -0.21434992435107506, 0.31402240533921655],
    // //   [0.3573377628433147, 0.6411351180495899, -0.42529960812789247],
    // //   [-0.15309079643139686, 0.6041077712559645, 0.7820594662531438]
    // // ]

    // let x = new Vector3().fromArray(coords[0])
    // let y = new Vector3().fromArray(coords[1])
    // let z = new Vector3().fromArray(coords[2])

    // return new Matrix4().makeBasis(x, y, z)
  }

  getHandPosition() {
    const indexTip = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = this!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    const position: Vector3 = indexTip.getWorldPosition(new Vector3()).add(thumbTip.getWorldPosition(new Vector3())).multiplyScalar(0.5)

    return position
  }
}

export { HandModel }
