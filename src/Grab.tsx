import { useFrame } from '@react-three/fiber'
import { useXR, useXREvent, XRController, XREvent } from '@react-three/xr'
import React, { forwardRef, ReactNode, useRef } from 'react'
import mergeRefs from 'react-merge-refs'
import { Box3, Matrix3, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB'

import { HandModel } from './HandModel'
import { useStore } from './store'

export const Grab = forwardRef(
  (
    {
      children,
      disabled = false,
      onChange,
      // instead of checking for a generic way here, do the calculation in the Interactable itself.
      callback,
      ...props
    }: {
      children: ReactNode
      disabled?: boolean
      onChange: ({ isGrabbed, controller }: { isGrabbed: boolean; controller: XRController }) => void
      callback: ({ controller, model }: { controller: XRController; model: HandModel }) => boolean
    },
    passedRef
  ) => {
    const grabbingController = useRef<XRController>()
    const ref = useRef<Object3D>()
    const previousTransform = useRef<Matrix4 | undefined>(undefined)
    const { isHandTracking } = useXR()

    const set = useStore((store) => store.set)

    const interacting = useStore((store) => ({
      left: store.hands.interacting?.current.left,
      right: store.hands.interacting?.current.right
    }))

    const models = useStore((store) => store.hands.models)

    useXREvent('selectend', (e: XREvent) => {
      if (
        e.controller === grabbingController.current &&
        interacting[e.controller.inputSource.handedness] &&
        ((isHandTracking && e.originalEvent.fake) || !isHandTracking)
      ) {
        set((store) => {
          store.hands.interacting!.current[grabbingController.current!.inputSource.handedness] = undefined
        })
        grabbingController.current = undefined
        previousTransform.current = undefined
        onChange({ isGrabbed: false, controller: e.controller })
      }
    })

    useXREvent('selectstart', (e: XREvent) => {
      // if the controller is already interacting, don't do anything
      // if hand tracking is enabled, but it's not a fake event, don't do anything
      if ((disabled && interacting[e.controller.inputSource.handedness]) || (isHandTracking && !e.originalEvent.fake)) {
        return
      }

      const model = models?.current[e.controller.inputSource.handedness]

      if (!model) {
        return
      }

      let colliding = false

      if (!callback) {
        // NOT USED FOR NOW HERE, WE USE THE CALLBACK FOR TESTING
        let mesh: Mesh | undefined = undefined
        ref.current!.traverse((object) => {
          if (!mesh && object instanceof Mesh && object.geometry) {
            mesh = object
          }
        })
        if (!mesh) {
          return
        }

        const obb = new OBB(
          new Vector3().setFromMatrixPosition(ref.current!.matrixWorld),
          ((mesh as Mesh).geometry!.boundingBox as Box3).getSize(new Vector3()).multiply(ref.current!.scale).divideScalar(2),
          new Matrix3().setFromMatrix4(ref.current!.matrixWorld.clone().makeScale(1, 1, 1))
        )

        const matrix = model!.getHandRotationMatrix()

        const indexTip = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
        const thumbTip = model!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

        const thumbOBB = new OBB(
          indexTip.getWorldPosition(new Vector3()),
          new Vector3(0.05, 0.05, 0.05).divideScalar(2),
          new Matrix3().setFromMatrix4(matrix)
        )
        const indexOBB = new OBB(
          thumbTip.getWorldPosition(new Vector3()),
          new Vector3(0.05, 0.05, 0.05).divideScalar(2),
          new Matrix3().setFromMatrix4(matrix)
        )

        colliding = obb.intersectsOBB(thumbOBB, Number.EPSILON) && obb.intersectsOBB(indexOBB, Number.EPSILON)
      } else {
        colliding = callback({ controller: e.controller, model: model })
      }

      if (colliding) {
        grabbingController.current = e.controller
        const transform = model.getHandTransform()
        previousTransform.current = transform.clone()
        onChange({ isGrabbed: true, controller: e.controller })
      }
    })

    useFrame(() => {
      if (!grabbingController.current || !previousTransform.current || !ref.current) {
        return
      }

      const model = models?.current[grabbingController.current.inputSource.handedness]

      if (!model) {
        return
      }

      let transform = model.getHandTransform()

      // apply previous transform
      ref.current!.applyMatrix4(previousTransform.current.clone().invert())

      if (isHandTracking) {
        // get quaternion from previous matrix
        const previousQuaternion = new Quaternion()
        previousTransform.current.decompose(new Vector3(), previousQuaternion, new Vector3(1, 1, 1))

        // get quaternion from current matrix
        const currentQuaternion = new Quaternion()
        transform.decompose(new Vector3(), currentQuaternion, new Vector3(1, 1, 1))

        // slerp to current quaternion
        previousQuaternion.slerp(currentQuaternion, 0.1)

        const position = model.getHandPosition()
        transform = new Matrix4().compose(position, previousQuaternion, new Vector3(1, 1, 1))
      }

      ref.current!.applyMatrix4(transform)

      ref.current!.updateWorldMatrix(false, true)
      previousTransform.current = transform.clone()
    })

    return (
      <group
        ref={mergeRefs([passedRef, ref])}
        {...props}
        // doesn't work for testing as we have to hover the block
        // onSelectStart={onSelectStart}>
      >
        {children}
      </group>
    )
  }
)
