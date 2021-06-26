import { Euler, Group, Matrix4, Mesh, Object3D, Quaternion, Vector3, XRInputSource } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { defaultPose } from './poses/default'
import { idlePose } from './poses/idle'
import { pinchPose } from './poses/pinch'

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/'

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
    this.controller.remove(this)

    this.controller = controller
    this.inputSource = inputSource
    this.isHandTracking = isHandTracking

    this.loading = true
    const loader = new GLTFLoader()
    loader.setPath(DEFAULT_HAND_PROFILE_PATH)
    const fileHandedness = isHandTracking ? this.inputSource.handedness : 'right'
    loader.load(`${fileHandedness}.glb`, (gltf) => {
      this.model = gltf.scene.children[0]

      // clearing everything first
      super.clear()
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

        // hand position offset
        this.model.position.sub(new Vector3(-0.02, 0.05, -0.12))

        // only mirror the left one (this is also the right model here)
        if (this.inputSource.handedness === 'left') {
          this.model.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        }
      }

      this.loading = false
      this.controller.add(this)
      onLoadedCallback()
    })
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

  getThumbIndexDistance() {
    const indexTip = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = this!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    return indexTip.getWorldPosition(new Vector3()).distanceTo(thumbTip.getWorldPosition(new Vector3()))
  }

  getHandTransform() {
    const quaternion = new Quaternion()
    const rotation = this.getHandRotationMatrix().decompose(new Vector3(), quaternion, new Vector3())
    const position = this.getHandPosition()

    return new Matrix4().compose(position, quaternion, new Vector3(1, 1, 1))
  }

  getHandRotationMatrix() {
    const indexTip = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = this!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D
    const indexKnuckle = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-metacarpal')! as Object3D
    const pinkyKnuckle = this!.bones.find((bone) => (bone as any).jointName === 'pinky-finger-metacarpal')! as Object3D

    const z = thumbTip.getWorldPosition(new Vector3()).sub(indexTip.getWorldPosition(new Vector3())).normalize()

    const y = indexKnuckle.getWorldPosition(new Vector3()).sub(pinkyKnuckle.getWorldPosition(new Vector3())).normalize()

    const x = new Vector3().crossVectors(z, y).negate()

    const y2 = new Vector3().crossVectors(x, z).negate()

    return new Matrix4().makeBasis(x, y2, z)
  }

  getHandPosition() {
    const indexTip = this!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = this!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    const position: Vector3 = indexTip.getWorldPosition(new Vector3()).add(thumbTip.getWorldPosition(new Vector3())).multiplyScalar(0.5)

    return position
  }
}

export { HandModel }
