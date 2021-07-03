import './styles.css'

import { OrbitControls } from '@react-three/drei'
import { VRCanvas } from '@react-three/xr'
import React from 'react'
import ReactDOM from 'react-dom'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

import { DefaultHandControllers } from './DefaultHandControllers'
import Level from './Level'

// Oculus Browser with #webxr-hands flag enabled
function HandControllersExample() {
  return (
    <VRCanvas
      mode="concurrent"
      onCreated={(args) => {
        args.gl.setClearColor('grey')
        void document.body.appendChild(VRButton.createButton(args.gl))
      }}>
      <OrbitControls />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1} />
      <DefaultHandControllers />
      <Level />
    </VRCanvas>
  )
}

;(ReactDOM as any).createRoot(document.getElementById('root')).render(<HandControllersExample />)
