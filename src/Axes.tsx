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
  useFrame(() => {
    if (!model || model?.bones.length === 0) {
      return
    }

    const indexTip = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-tip')! as Object3D
    const thumbTip = model!.bones.find((bone) => (bone as any).jointName === 'thumb-tip')! as Object3D

    const position: Vector3 = indexTip.getWorldPosition(new Vector3()).add(thumbTip.getWorldPosition(new Vector3())).multiplyScalar(0.5)

    const indexKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'index-finger-metacarpal')! as Object3D
    const pinkyKnuckle = model!.bones.find((bone) => (bone as any).jointName === 'pinky-finger-metacarpal')! as Object3D

    indexTipRef.current?.position.copy(indexTip.getWorldPosition(new Vector3()))
    thumbTipRef.current?.position.copy(thumbTip.getWorldPosition(new Vector3()))
    indexKnuckleRef.current?.position.copy(indexKnuckle.getWorldPosition(new Vector3()))
    pinkyKnuckleRef.current?.position.copy(pinkyKnuckle.getWorldPosition(new Vector3()))
    positionRef.current?.position.copy(position.clone())

    const z = thumbTip.getWorldPosition(new Vector3()).sub(indexTip.getWorldPosition(new Vector3())).normalize()

    const zPoints: Vector3[] = [position.clone(), position.clone().add(z)]
    const zGeom = new BufferGeometry().setFromPoints(zPoints)
    zRef.current.geometry = zGeom

    const y = indexKnuckle.getWorldPosition(new Vector3()).sub(pinkyKnuckle.getWorldPosition(new Vector3())).normalize()

    // const yPoints: Vector3[] = [
    //   applyControllerOffsetRotation(position.clone().sub(y.clone().divideScalar(2))),
    //   applyControllerOffsetRotation(position.clone().add(y).sub(y.clone().divideScalar(2)))
    // ]
    // const yGeom = new BufferGeometry().setFromPoints(yPoints)
    // yRef.current.geometry = yGeom

    const x = new Vector3().crossVectors(z, y).negate()

    const xPoints: Vector3[] = [position.clone(), position.clone().add(x.clone())]
    const xGeom = new BufferGeometry().setFromPoints(xPoints)
    xRef.current.geometry = xGeom

    const y2 = new Vector3().crossVectors(x, z).negate()

    const y2Points: Vector3[] = [position.clone(), position.clone().add(y2.clone())]
    const y2Geom = new BufferGeometry().setFromPoints(y2Points)
    y2Ref.current.geometry = y2Geom
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
