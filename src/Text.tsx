import React, { forwardRef, useLayoutEffect, useRef, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import robotoFont from 'url:/src/Roboto.json'
import { DoubleSide, Font, FontLoader, Mesh, MeshBasicMaterial, ShapeGeometry, Vector3 } from 'three'

const Text = forwardRef<any, any>(({ children, vAlign = 'center', hAlign = 'center', size = 1, color = '#000000', ...props }, ref) => {
  const font = useLoader(FontLoader, robotoFont) as Font

  const matLite = new MeshBasicMaterial({
    color: color,
    side: DoubleSide
  })

  const geometry = useMemo(() => {
    if (font) {
      const shapes = font.generateShapes(children, 1)
      const geometry = new ShapeGeometry(shapes)
      geometry.computeBoundingBox()
      return geometry
    }
  }, [font])

  const mesh = useRef<Mesh>()

  useLayoutEffect(() => {
    const size = new Vector3()
    mesh.current.geometry.computeBoundingBox()
    mesh.current.geometry.boundingBox.getSize(size)
    mesh.current.position.x = hAlign === 'center' ? -size.x / 2 : hAlign === 'right' ? 0 : -size.x
    mesh.current.position.y = vAlign === 'center' ? -size.y / 2 : vAlign === 'top' ? 0 : -size.y
  }, [children])

  return (
    <group ref={ref} {...props} scale={[size, size, size]}>
      <mesh ref={mesh} geometry={geometry} material={matLite} />
    </group>
  )
})

export default Text
