import { useGLTF } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import { Box3, Matrix3, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB'

import { Grab } from './Grab'
import { useStore } from './store'

export default function Crate(props: any) {
  const group = useRef<Object3D | undefined>()
  const { nodes, materials } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf') as any

  const materialsRef = useRef(materials)
  const [isGrabbed, setGrabbed] = useState(false)

  const set = useStore((store) => store.set)

  useEffect(() => {
    materialsRef.current = Object.values(materials).reduce((object: object, material: MeshStandardMaterial) => {
      object[material.name] = material.clone()
      material.metalness = 0.5
      return object
    }, {})
  }, [materials])

  useEffect(() => {
    if (isGrabbed) {
      Object.values(materialsRef.current).forEach((material: MeshStandardMaterial) => {
        material.metalness = 0.1
      })
    } else {
      Object.values(materialsRef.current).forEach((material: MeshStandardMaterial) => {
        material.metalness = 0.5
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
      callback={({ controller, model }) => {
        // do initial position check (if futher, don't check for collisions)
        const position = model.getHandPosition()
        const cratePosition = group.current.getWorldPosition(new Vector3())

        // calculate based on bounding box
        // for now hardcodedackage
        if (position.distanceTo(cratePosition) > 0.2) {
          // console.log('IGNORED')
          return
        }

        let mesh: Mesh | undefined = undefined
        group.current!.traverse((object) => {
          if (!mesh && object instanceof Mesh && object.geometry) {
            mesh = object
          }
        })
        if (!mesh) {
          return
        }

        const obb = new OBB(
          new Vector3().setFromMatrixPosition(group.current!.matrixWorld),
          ((mesh as Mesh).geometry!.boundingBox as Box3).getSize(new Vector3()).multiply(group.current!.scale).divideScalar(2),
          new Matrix3().setFromMatrix4(group.current!.matrixWorld.clone().makeScale(1, 1, 1))
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

        return obb.intersectsOBB(thumbOBB, Number.EPSILON) && obb.intersectsOBB(indexOBB, Number.EPSILON)
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
