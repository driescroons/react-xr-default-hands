import './styles.css'

import { OrbitControls } from '@react-three/drei'
import { VRCanvas } from '@react-three/xr'
import React, { useMemo, useState } from 'react'
import { Suspense } from 'react'
import ReactDOM from 'react-dom'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

import Crate from './Crate'
import { DefaultHandControllers } from './DefaultHandControllers'
import Level from './Level'

// Oculus Browser with #webxr-hands flag enabled
function HandControllersExample() {
  return (
    <VRCanvas
      onCreated={(args) => {
        args.gl.setClearColor('grey')
        void document.body.appendChild(VRButton.createButton(args.gl))
      }}>
      <OrbitControls />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1} />
      <DefaultHandControllers
      // modelPaths={{
      //   left: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/left-hand-white-webxr-tracking-ready/model.gltf',
      //   right: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/right-hand-white-webxr-tracking-ready/model.gltf'
      // }}
      />
      <Level />
    </VRCanvas>
  )
}

ReactDOM.render(<HandControllersExample />, document.getElementById('root'))
