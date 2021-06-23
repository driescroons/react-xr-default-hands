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
import { useStore } from './store'

interface Props {
  controller: XRController
  model: HandModel
}

export function Axes({ controller, model }: Props) {
  useFrame(() => {
    if (!model || model?.bones.length === 0) {
      // console.log('niks', model)
      return
    }

    const indexTip = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = model!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    const position: Vector3 = indexTip.position.clone().add(thumbTip.position).multiplyScalar(0.5)

    const indexKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-metacarpal')! as Object3D
    const pinkyKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'pinky-finger-metacarpal')! as Object3D

    const applyControllerOffset = (position: Vector3) => {
      if (!model.isHandTracking) {
        if (controller.inputSource.handedness === 'left') {
          position.applyMatrix4(new Matrix4().makeScale(1, 1, -1))
        }

        position.applyEuler(new Euler(Math.PI / 2, -Math.PI / 2, 0))
        // controller offset
        position.sub(new Vector3(0, 0.05, -0.1))
        position.applyMatrix4(controller.controller.matrixWorld)
      }

      return position
    }

    indexTipRef.current?.position.copy(applyControllerOffset(indexTip.position.clone()))
    thumbTipRef.current?.position.copy(applyControllerOffset(thumbTip.position.clone()))
    indexKnuckleRef.current?.position.copy(applyControllerOffset(indexKnuckle.position.clone()))
    pinkyKnuckleRef.current?.position.copy(applyControllerOffset(pinkyKnuckle.position.clone()))
    positionRef.current?.position.copy(applyControllerOffset(position.clone()))

    const z = indexTip.position.clone().sub(thumbTip.position).normalize()

    const zPoints: Vector3[] = [
      applyControllerOffset(position.clone().sub(z.clone().divideScalar(2))),
      applyControllerOffset(position.clone().add(z).sub(z.clone().divideScalar(2)))
    ]
    const zGeom = new BufferGeometry().setFromPoints(zPoints)
    zRef.current.geometry = zGeom

    const y = indexKnuckle.position.clone().sub(pinkyKnuckle.position).normalize()

    // const yPoints: Vector3[] = [
    //   applyControllerOffset(position.clone().sub(y.clone().divideScalar(2))),
    //   applyControllerOffset(position.clone().add(y).sub(y.clone().divideScalar(2)))
    // ]
    // const yGeom = new BufferGeometry().setFromPoints(yPoints)
    // yRef.current.geometry = yGeom

    const x = new Vector3().crossVectors(z, y)

    const xPoints: Vector3[] = [
      applyControllerOffset(position.clone().sub(x.clone().divideScalar(2))),
      applyControllerOffset(position.clone().add(x).sub(x.clone().divideScalar(2)))
    ]
    const xGeom = new BufferGeometry().setFromPoints(xPoints)
    xRef.current.geometry = xGeom

    const y2 = new Vector3().crossVectors(x, z)

    const y2Points: Vector3[] = [
      applyControllerOffset(position.clone().sub(y2.clone().divideScalar(2))),
      applyControllerOffset(position.clone().add(y2).sub(y2.clone().divideScalar(2)))
    ]
    const y2Geom = new BufferGeometry().setFromPoints(y2Points)
    y2Ref.current.geometry = y2Geom
    // }
  })

  const thumbTipRef = useRef<Mesh>(null)
  const indexTipRef = useRef<Mesh>(null)
  const indexKnuckleRef = useRef<Mesh>(null)
  const pinkyKnuckleRef = useRef<Mesh>(null)
  const positionRef = useRef<Mesh>(null)

  const zRef = useRef<any>()
  const yRef = useRef<any>()
  const y2Ref = useRef<any>()
  const xRef = useRef<any>()

  // const points: Vector3[] = []
  // const geom = new BufferGeometry().setFromPoints(points)

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
