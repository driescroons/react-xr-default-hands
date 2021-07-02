import React, { ReactElement, Suspense, useMemo } from 'react'
import Crate from './Crate'

interface Props {}

export default function Level({}: Props): ReactElement {
  const blocks = useMemo(() => {
    return [...Array(5)].map((_) => {
      const angle = Math.random() * Math.PI * 2
      return (
        <Suspense fallback={null}>
          <Crate position={[Math.cos(angle) * 0.5, Math.random() + 1, Math.sin(angle) * 0.5]} scale={[0.1, 0.1, 0.1]} />
        </Suspense>
      )
    })
  }, [])

  return (
    <>
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
