import { useFrame, useThree } from '@react-three/fiber'
import { useXR, useXREvent, XREvent } from '@react-three/xr'
import { monitorEventLoopDelay } from 'perf_hooks'
import React, { useEffect, useRef, useState } from 'react'
import { useCallback } from 'react'
import { useMemo } from 'react'
import { XRHandedness, XRInputSourceChangeEvent } from 'three'

import { Axes } from './Axes'
import { HandModel } from './HandModel'

export function DefaultHandControllers({ onConnect }: { onConnect: (models: HandModel[]) => void }) {
  const { controllers, isHandTracking, isPresenting } = useXR()
  const models = useRef<HandModel[]>([])

  const [pinched, setPinched] = useState<{ [key in XRHandedness]?: boolean }>({ left: false, right: false })

  // fix this shit
  const [fr, sfr] = useState(false)

  useEffect(() => {
    controllers.map((c) => {
      let model = models.current.find((model) => model.inputSource.handedness === c.inputSource.handedness)
      if (!model) {
        const model = new HandModel(c.controller, c.inputSource)
        models.current.push(model)
      }
    })
    onConnect(models.current)
  }, [controllers])

  useEffect(() => {
    // fix this firing twice when going in vr mode
    if (isPresenting && models.current.length === controllers.length) {
      controllers.forEach((c, index) => {
        let model = models.current[index]
        if (isHandTracking) {
          model.load(c.hand, c.inputSource, true, () => sfr(!fr))
        } else {
          model.load(c.controller, c.inputSource, false, () => sfr(!fr))
        }
        models.current[index] = model
      })
    }
  }, [controllers, isHandTracking])

  useFrame(() => {
    if (isHandTracking) {
      controllers.map((c, index) => {
        const model = models.current[index]
        if (!model.loading) {
          const distance = model.getThumbIndexDistance()
          if (!pinched[c.inputSource.handedness] && distance < 0.05) {
            c.controller.dispatchEvent({ type: 'selectstart', fake: true })
            setPinched({ ...pinched, [c.inputSource.handedness]: true })
          }

          if (pinched[c.inputSource.handedness] && distance > 0.1) {
            c.controller.dispatchEvent({ type: 'selectend', fake: true })
            setPinched({ ...pinched, [c.inputSource.handedness]: false })
          }
        }
      })
    }
  })

  useXREvent('selectstart', (e: XREvent) => {
    if (!isHandTracking) {
      const model = models.current.find((model) => model.inputSource.handedness === e.controller.inputSource.handedness)
      if (model) {
        model.setPose('pinch')
      }
    }
  })

  useXREvent('selectend', (e: XREvent) => {
    if (!isHandTracking) {
      const model = models.current.find((model) => model.inputSource.handedness === e.controller.inputSource.handedness)
      if (model) {
        model.setPose('idle')
      }
    }
  })

  return (
    <>
      {controllers.map((c, index) => (
        <Axes controller={c} model={models.current[index]} />
      ))}
    </>
  )
}
