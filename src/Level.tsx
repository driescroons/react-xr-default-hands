import { XRInteractionEvent } from '@react-three/xr'
import React, { ReactElement, Suspense, useMemo, useState } from 'react'
import { Vector3 } from 'three'
import { Button } from './Button'
import Crate from './Crate'
import { useStore } from './store'

interface Props {}

export default function Level({}: Props): ReactElement {
  const [shouldReload, setReload] = useState(false)
  const interacting = useStore((store) => ({
    left: store.hands.interacting?.current.left,
    right: store.hands.interacting?.current.right
  }))

  const blocks = useMemo(() => {
    return [...Array(10)].map((_) => {
      const angle = Math.random() * Math.PI * 2
      return (
        <Suspense fallback={null}>
          <Crate position={[Math.cos(angle) * 0.5, Math.random() + 1, Math.sin(angle) * 0.5]} scale={[0.1, 0.1, 0.1]} />
        </Suspense>
      )
    })
  }, [shouldReload])

  return (
    <>
      <Button
        position={[Math.cos(-Math.PI / 2) * 0.5, 1.5, Math.sin(-Math.PI / 2) * 0.5]}
        args={[0.3, 0.1, 0.05]}
        fontSize={0.03}
        onClick={(event: XRInteractionEvent) => {
          // check if we're interacting with that controller or not
          if (!interacting[event.controller.inputSource.handedness]) {
            setReload(!shouldReload)
          }
        }}
        lookAt={new Vector3()}>
        Reload level
      </Button>
      <Suspense fallback={null}>
        <Crate position={[Math.cos(0.5 + Math.PI / 2) * 0.5, 1.5, Math.sin(0.5 + Math.PI / 2) * 0.5]} scale={[0.1, 0.1, 0.1]} />
      </Suspense>
      <Suspense fallback={null}>
        <Crate position={[Math.cos(-0.5 + Math.PI / 2) * 0.5, 1.5, Math.sin(-0.5 + Math.PI / 2) * 0.5]} scale={[0.1, 0.1, 0.1]} />
      </Suspense>
      {blocks}
    </>
  )
}
