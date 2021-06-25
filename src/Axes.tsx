import { useFrame, useThree } from '@react-three/fiber'
import { useXR, useXREvent, XRController, XREvent } from '@react-three/xr'
import React, { useEffect, useRef, useState } from 'react'
import { useCallback } from 'react'
import { useMemo } from 'react'
import {
  BoxBufferGeometry,
  BufferGeometry,
  Euler,
  Group,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
  XRHandedness,
  XRHandJoint
} from 'three'

import { HandModel } from './HandModel'

interface Props {
  controller: XRController
  model: HandModel
}

export function Axes({ controller, model }: Props) {
  const [log, shouldLog] = useState(false)

  useFrame(() => {
    if (!model || model?.bones.length === 0) {
      return
    }

    const indexTip = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = model!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    const position: Vector3 = indexTip.position.clone().add(thumbTip.position).multiplyScalar(0.5)

    const indexKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-metacarpal')! as Object3D
    const pinkyKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'pinky-finger-metacarpal')! as Object3D

    const applyControllerOffsetRotation = (position: Vector3) => {
      if (!model.isHandTracking) {
        if (controller.inputSource.handedness === 'left') {
          // hand is pointing down, so we mirror it around the z-axis
          position.applyMatrix4(new Matrix4().makeScale(1, 1, -1))
        }

        position.applyEuler(new Euler(Math.PI / 2, -Math.PI / 2, 0))
        position.sub(new Vector3(0, 0.05, -0.1))
        position.applyQuaternion(controller.controller.quaternion)
      }

      return position
    }

    const applyControllerOffsetPosition = (position: Vector3) => {
      if (!model.isHandTracking) {
        position.add(controller.controller.position)
      }

      return position
    }

    indexTipRef.current?.position.copy(applyControllerOffsetPosition(applyControllerOffsetRotation(indexTip.position.clone())))
    thumbTipRef.current?.position.copy(applyControllerOffsetPosition(applyControllerOffsetRotation(thumbTip.position.clone())))
    indexKnuckleRef.current?.position.copy(applyControllerOffsetPosition(applyControllerOffsetRotation(indexKnuckle.position.clone())))
    pinkyKnuckleRef.current?.position.copy(applyControllerOffsetPosition(applyControllerOffsetRotation(pinkyKnuckle.position.clone())))
    positionRef.current?.position.copy(applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone())))

    const z = thumbTip.position.clone().sub(indexTip.position).normalize()

    const zPoints: Vector3[] = [
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone())),
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone().add(z)))
    ]
    const zGeom = new BufferGeometry().setFromPoints(zPoints)
    zRef.current.geometry = zGeom

    const y = indexKnuckle.position.clone().sub(pinkyKnuckle.position).normalize()

    // const yPoints: Vector3[] = [
    //   applyControllerOffsetRotation(position.clone().sub(y.clone().divideScalar(2))),
    //   applyControllerOffsetRotation(position.clone().add(y).sub(y.clone().divideScalar(2)))
    // ]
    // const yGeom = new BufferGeometry().setFromPoints(yPoints)
    // yRef.current.geometry = yGeom

    const x = new Vector3().crossVectors(z, y)

    const xPoints: Vector3[] = [
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone())),
      // notice the negate here!!
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone().add(x.clone().negate())))
    ]
    const xGeom = new BufferGeometry().setFromPoints(xPoints)
    xRef.current.geometry = xGeom

    const y2 = new Vector3().crossVectors(x, z)

    const y2Points: Vector3[] = [
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone())),
      applyControllerOffsetPosition(applyControllerOffsetRotation(position.clone().add(y2)))
    ]
    const y2Geom = new BufferGeometry().setFromPoints(y2Points)
    y2Ref.current.geometry = y2Geom

    if (log && controller.inputSource.handedness === 'right') {
      console.log(
        JSON.stringify([
          applyControllerOffsetRotation(x.clone().negate()).toArray(),
          applyControllerOffsetRotation(y2.clone()).toArray(),
          applyControllerOffsetRotation(z.clone()).toArray()
        ])
      )
      shouldLog(false)
    }
  })
  ;(window as any).log = () => {
    shouldLog(true)
  }

  const thumbTipRef = useRef<Mesh>(null)
  const indexTipRef = useRef<Mesh>(null)
  const indexKnuckleRef = useRef<Mesh>(null)
  const pinkyKnuckleRef = useRef<Mesh>(null)
  const positionRef = useRef<Mesh>(null)

  const zRef = useRef<any>()
  const yRef = useRef<any>()
  const y2Ref = useRef<any>()
  const xRef = useRef<any>()

  return (
    <group>
      <mesh ref={thumbTipRef} geometry={new SphereGeometry(0.005)} material={new MeshBasicMaterial({ color: 'blue' })} />
      <mesh ref={indexTipRef} geometry={new SphereGeometry(0.005)} material={new MeshBasicMaterial({ color: 'blue' })} />
      <mesh ref={indexKnuckleRef} geometry={new SphereGeometry(0.01)} material={new MeshBasicMaterial({ color: 'green' })} />
      <mesh ref={pinkyKnuckleRef} geometry={new SphereGeometry(0.01)} material={new MeshBasicMaterial({ color: 'green' })} />
      <mesh ref={positionRef} geometry={new SphereGeometry(0.005)} material={new MeshBasicMaterial({ color: 'white' })} />

      {/* @ts-ignore */}
      <line ref={zRef} material={new LineBasicMaterial({ color: 'blue' })} />
      {/* @ts-ignore
      <line ref={yRef} material={new LineBasicMaterial({ color: 'darkgreen' })} /> */}
      {/* @ts-ignore */}
      <line ref={y2Ref} material={new LineBasicMaterial({ color: 'green' })} />
      {/* @ts-ignore */}
      <line ref={xRef} material={new LineBasicMaterial({ color: 'red' })} />
    </group>
  )
}
