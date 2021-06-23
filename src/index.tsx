import './styles.css'

import { OrbitControls } from '@react-three/drei'
import { DefaultXRControllers, VRCanvas } from '@react-three/xr'
import React from 'react'
import ReactDOM from 'react-dom'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

import { DefaultHandControllers } from './DefaultHandControllers'

// Oculus Browser with #webxr-hands flag enabled
function HandControllersExample() {
  return (
    <VRCanvas
      onCreated={(args) => {
        args.gl.setClearColor('grey')
        void document.body.appendChild(VRButton.createButton(args.gl))
      }}>
      <OrbitControls />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <DefaultHandControllers />
      <DefaultXRControllers />
      {/* <Grab>
        <mesh geometry={new BoxBufferGeometry(0.1, 0.1, 0.1)} material={new MeshBasicMaterial({ color: 'blue' })} position={[0, 1, -0.2]} />
      </Grab> */}
    </VRCanvas>
  )
}

ReactDOM.render(<HandControllersExample />, document.getElementById('root'))
