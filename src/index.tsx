import './styles.css'

import { OrbitControls } from '@react-three/drei'
import { DefaultXRControllers, VRCanvas, XRController } from '@react-three/xr'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

import { DefaultHandControllers } from './DefaultHandControllers'
import { BoxBufferGeometry, MeshBasicMaterial, Object3D, XRHandedness } from 'three'
import { Grab } from './Grab'
import { HandModel } from './HandModel'
import { Suspense } from 'react'
import Crate from './Crate'
import Eggplant from './Eggplant'
import Apple from './Apple'
import Pineapple from './Pineapple'
import Pear from './Pear'

// Oculus Browser with #webxr-hands flag enabled
function HandControllersExample() {
  const [interacting, setInteracting] = useState<{ [key in XRHandedness]?: Object3D | null }>({ left: null, right: null })
  const [models, setModels] = useState<HandModel[]>([])
  return (
    <VRCanvas
      onCreated={(args) => {
        args.gl.setClearColor('white')
        void document.body.appendChild(VRButton.createButton(args.gl))
      }}>
      <OrbitControls />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1} />
      <pointLight position={[0, 5, -5]} intensity={1} />
      <DefaultHandControllers
        onConnect={(models) => {
          setModels(models)
        }}
        // modelPaths={{
        //   left: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/left-hand-white-webxr-tracking-ready/model.gltf',
        //   right: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/right-hand-white-webxr-tracking-ready/model.gltf'
        // }}
      />
      {/* <Grab
        onChange={({ isGrabbed, controller, object }) => {
          if (isGrabbed) {
            setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
          }
        }}
        models={models}
        interacting={interacting}>
        <Suspense fallback={null}>
          <Crate position={[0, 1.5, -0.1]} scale={[0.1, 0.1, 0.1]} />
        </Suspense>
      </Grab> */}
      <Grab
        onChange={({ isGrabbed, controller, object }) => {
          if (isGrabbed) {
            setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
          }
        }}
        models={models}
        interacting={interacting}>
        <Suspense fallback={null}>
          <Eggplant position={[Math.cos(0) * 0.5, 1.5, Math.sin(0) * 0.5]} scale={[0.5, 0.5, 0.5]} />
        </Suspense>
      </Grab>
      <Grab
        onChange={({ isGrabbed, controller, object }) => {
          if (isGrabbed) {
            setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
          }
        }}
        models={models}
        interacting={interacting}>
        <Suspense fallback={null}>
          <Apple position={[Math.cos(Math.PI / 2) * 0.5, 1.5, Math.sin(Math.PI / 2) * 0.5]} scale={[0.5, 0.5, 0.5]} />
        </Suspense>
      </Grab>
      <Grab
        onChange={({ isGrabbed, controller, object }) => {
          if (isGrabbed) {
            setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
          }
        }}
        models={models}
        interacting={interacting}>
        <Suspense fallback={null}>
          <Pineapple position={[Math.cos(Math.PI) * 0.5, 1.5, Math.sin(Math.PI) * 0.5]} scale={[0.5, 0.5, 0.5]} />
        </Suspense>
      </Grab>
      <Grab
        onChange={({ isGrabbed, controller, object }) => {
          if (isGrabbed) {
            setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
          }
        }}
        models={models}
        interacting={interacting}>
        <Suspense fallback={null}>
          <Pear position={[Math.cos(Math.PI + Math.PI / 2) * 0.5, 1.5, Math.sin(Math.PI + Math.PI / 2) * 0.5]} scale={[0.5, 0.5, 0.5]} />
        </Suspense>
      </Grab>
    </VRCanvas>
  )
}

ReactDOM.render(<HandControllersExample />, document.getElementById('root'))
