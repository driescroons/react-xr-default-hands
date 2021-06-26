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

// Oculus Browser with #webxr-hands flag enabled
function HandControllersExample() {
  const [interacting, setInteracting] = useState<{ [key in XRHandedness]?: Object3D | null }>({ left: null, right: null })
  const [models, setModels] = useState<HandModel[]>([])
  return (
    <VRCanvas
      onCreated={(args) => {
        args.gl.setClearColor('grey')
        void document.body.appendChild(VRButton.createButton(args.gl))
      }}>
      <OrbitControls />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <DefaultHandControllers
        onConnect={(models) => {
          setModels(models)
        }}
      />
      <DefaultXRControllers />
      <group position={[0.5, 1.5, -1]}>
        <Grab
          onChange={({ isGrabbed, controller, object }) => {
            if (isGrabbed) {
              setInteracting({ ...interacting, [controller.inputSource.handedness]: object })
            }
          }}
          models={models}
          interacting={interacting}>
          <mesh geometry={new BoxBufferGeometry(0.1, 0.1, 0.1)} material={new MeshBasicMaterial({ color: 'blue' })} />
        </Grab>
      </group>
    </VRCanvas>
  )
}

ReactDOM.render(<HandControllersExample />, document.getElementById('root'))
