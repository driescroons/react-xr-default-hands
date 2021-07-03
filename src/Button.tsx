import { RoundedBox } from '@react-three/drei'
import { Interactive } from '@react-three/xr'
import React, { Suspense, useState } from 'react'
import { a, useSpring } from '@react-spring/three'
import Text from './Text'

export function Button({ children, label, onClick, highlight = true, fontSize = 0.07, args, ...rest }: any) {
  const [hovered, setHovered] = useState(false)
  const [style] = useSpring(
    {
      scale: hovered ? 1.05 : 1,
      color: hovered ? '#66f' : highlight ? '#f3f3f3' : '#6e6e6e'
    },
    [hovered, highlight]
  )

  return (
    <Interactive onHover={() => setHovered(true)} onBlur={() => setHovered(false)} onSelect={onClick ? onClick : () => null}>
      <a.group scale={style.scale} {...rest}>
        <RoundedBox args={args} radius={0.01} smoothness={4}>
          <a.meshStandardMaterial attach="material" color={style.color} />
          <Suspense fallback={null}>
            <Text position={[0, 0, args[2] / 2 + 0.01]} size={fontSize} color="black" key={label || children}>
              {label || children}
            </Text>
          </Suspense>
        </RoundedBox>
      </a.group>
    </Interactive>
  )
}
