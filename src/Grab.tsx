import { useFrame } from '@react-three/fiber'
import { Interactive, useXR, useXREvent, XRController, XREvent } from '@react-three/xr'
import { group } from 'console'
import React, { ReactNode, useCallback, useRef } from 'react'
import { Matrix3, Matrix4, Object3D, Quaternion, Vector3, XRHandedness } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB'

import { HandModel } from './HandModel'

export function Grab({
  children,
  disabled = false,
  onChange,
  models,
  interacting
}: {
  children: ReactNode
  disabled?: boolean
  models: HandModel[]
  interacting: { [key in XRHandedness]?: Object3D | null }
  // needs to come from above through onChange
  // setInteracting: (interacting: { [key in XRHandedness]?: Object3D }) => void
  onChange: ({ isGrabbed, controller, object }: { isGrabbed: boolean; controller: XRController; object: Object3D | null }) => void
}) {
  const grabbingController = useRef<XRController>()
  const groupRef = useRef<Object3D>()
  const previousTransform = useRef<Matrix4 | undefined>(undefined)
  const { isHandTracking } = useXR()

  useXREvent('selectend', (e: XREvent) => {
    if (
      e.controller === grabbingController.current &&
      interacting[e.controller.inputSource.handedness] &&
      ((isHandTracking && e.originalEvent.fake) || !isHandTracking)
    ) {
      grabbingController.current = undefined
      previousTransform.current = undefined
      onChange({ isGrabbed: false, controller: e.controller, object: null })
    }
  })

  useXREvent('selectstart', (e: XREvent) => {
    // if the controller is already interacting, don't do anything
    // if hand tracking is enabled, but it's not a fake event, don't do anything
    if ((disabled && interacting[e.controller.inputSource.handedness]) || (isHandTracking && !e.originalEvent.fake)) {
      return
    }

    const object = groupRef.current!.children[0]

    const obb = new OBB(
      new Vector3().setFromMatrixPosition(object.matrixWorld),
      new Vector3(0.1, 0.1, 0.1).divideScalar(2),
      new Matrix3().setFromMatrix4(object.matrixWorld)
    )

    const model = models.find((model) => model.inputSource.handedness === e.controller.inputSource.handedness)

    if (!model) {
      return
    }

    const position = model!.getHandPosition()
    const matrix = model!.getHandRotationMatrix()

    const controllerOBB = new OBB(position, new Vector3(0.05, 0.05, 0.05).divideScalar(2), new Matrix3().setFromMatrix4(matrix))

    const colliding = obb.intersectsOBB(controllerOBB, Number.EPSILON)

    if (colliding) {
      grabbingController.current = e.controller
      const transform = model.getHandTransform()
      previousTransform.current = transform.clone()
      onChange({ isGrabbed: true, controller: e.controller, object: groupRef.current! })
    }
  })

  useFrame(() => {
    if (!grabbingController.current || !previousTransform.current || !groupRef.current) {
      return
    }

    const model = models.find((model) => model.inputSource.handedness === grabbingController.current!.inputSource.handedness)

    if (!model) {
      return
    }

    const group = groupRef.current

    const transform = model.getHandTransform()

    // apply previous transform
    group.applyMatrix4(previousTransform.current.clone().invert())

    // get quaternion from previous matrix
    const previousQuaternion = new Quaternion()
    previousTransform.current.decompose(new Vector3(), previousQuaternion, new Vector3(1, 1, 1))

    // get quaternion from current matrix
    const currentQuaternion = new Quaternion()
    transform.decompose(new Vector3(), currentQuaternion, new Vector3(1, 1, 1))

    // slerp to current quaternion
    previousQuaternion.slerp(currentQuaternion, 0.1)

    const position = model.getHandPosition()
    const matrix = new Matrix4().compose(position, previousQuaternion, new Vector3(1, 1, 1))

    group.applyMatrix4(matrix)

    group.updateWorldMatrix(false, true)

    previousTransform.current = matrix.clone()
  })

  return (
    <group
      ref={groupRef}
      // doesn't work for testing as we have to hover the block
      // onSelectStart={onSelectStart}>
    >
      {children}
    </group>
  )
}
