import { useXR, useXREvent, XREvent } from '@react-three/xr'
import React, { useEffect, useRef, useState } from 'react'
import { useCallback } from 'react'
import { useMemo } from 'react'

import { Axes } from './Axes'
import { HandModel } from './HandModel'

export function DefaultHandControllers({ onConnect }: { onConnect: (models: HandModel[]) => void }) {
  const { controllers, isHandTracking, isPresenting } = useXR()
  const models = useRef<HandModel[]>([])

  const [fr, sfr] = useState(false)

  useEffect(() => {
    controllers.map((c) => {
      let model = models.current.find((model) => model.inputSource.handedness === c.inputSource.handedness)
      if (!model) {
        const model = new HandModel(c.controller, c.inputSource)
        model.load(c.controller, c.inputSource, false, () => sfr(!fr))
        models.current.push(model)
      }
    })
    onConnect(models.current)
  }, [controllers])

  useEffect(() => {
    // fix this firing twice when going in vr mode
    if (isPresenting && models.current.length === controllers.length) {
      controllers.forEach((c, index) => {
        console.log('wudup')
        let model = models.current[index]
        if (model.inputSource === c.inputSource) {
          if (isHandTracking) {
            model.load(c.hand, c.inputSource, isHandTracking, () => sfr(!fr))
          } else {
            model.load(c.controller, c.inputSource, isHandTracking, () => sfr(!fr))
          }
        }
        models.current[index] = model
      })
    }
  }, [controllers, isHandTracking])

  useXREvent('selectstart', (e: XREvent) => {
    const model = models.current.find((model) => model.inputSource.handedness === e.controller.inputSource.handedness)
    if (model) {
      model.setPose('pinch')
    }
  })

  useXREvent('selectend', (e: XREvent) => {
    const model = models.current.find((model) => model.inputSource.handedness === e.controller.inputSource.handedness)
    if (model) {
      model.setPose('idle')
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
