import { useGLTF } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import { MeshStandardMaterial, Object3D } from 'three'

import { Grab } from './Grab'
import { useStore } from './store'

export default function Crate(props: any) {
  const group = useRef<Object3D | undefined>()
  const { nodes, materials } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf') as any

  console.log(materials)
  const materialsRef = useRef(materials)
  console.log(materialsRef.current)
  const [isGrabbed, setGrabbed] = useState(false)

  const set = useStore((store) => store.set)

  useEffect(() => {
    materialsRef.current = Object.values(materials).reduce((object: object, material: MeshStandardMaterial) => {
      object[material.name] = material.clone()
      material.metalness = 0.3
      return object
    }, {})
  }, materials)

  useEffect(() => {
    if (isGrabbed) {
      Object.values(materialsRef.current).forEach((material: MeshStandardMaterial) => {
        material.metalness = 0.1
      })
    } else {
      Object.values(materialsRef.current).forEach((material: MeshStandardMaterial) => {
        material.metalness = 0.3
      })
    }
  }, [isGrabbed])

  return (
    <Grab
      onChange={({ isGrabbed, controller }) => {
        setGrabbed(isGrabbed)
        if (isGrabbed) {
          set((store) => {
            store.hands.interacting!.current[controller.inputSource.handedness] = group.current
          })
        }
      }}
      ref={group}
      {...props}
      dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={nodes.Cube013.geometry} material={materialsRef.current['BrownDark.057']} />
        <mesh geometry={nodes.Cube013_1.geometry} material={materialsRef.current['Metal.089']} />
      </group>
    </Grab>
  )
}

useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf')
