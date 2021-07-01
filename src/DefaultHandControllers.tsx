import { useFrame } from '@react-three/fiber'
import { useXR, useXREvent, XREvent } from '@react-three/xr'
import React, { useEffect, useRef, useState } from 'react'
import { useCallback } from 'react'
import { useMemo } from 'react'
import { XRHandedness } from 'three'

import { Axes } from './Axes'
import { HandModel } from './HandModel'

enum HandAction {
  'release',
  'grab'
}

export function DefaultHandControllers({ onConnect }: { onConnect: (models: HandModel[]) => void }) {
  const { controllers, isHandTracking, isPresenting } = useXR()
  const models = useRef<HandModel[]>([])

  const handActions = useRef<{ [key in XRHandedness]?: { date: number; distance: number; action: HandAction }[] }>({ left: [], right: [] })

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

          // get todo actions
          const actions = handActions.current[c.inputSource.handedness]!.filter(({ date }) => Date.now() > date)
          // remove from initial list
          actions.forEach((x) =>
            handActions.current[c.inputSource.handedness]!.splice(handActions.current[c.inputSource.handedness]!.indexOf(x), 1)
          )

          // mutates the actions, but we don't need those anymore
          // otherwise .slice(-1)
          const action = actions.pop()

          const isPinched = pinched[c.inputSource.handedness]
          handActions.current[c.inputSource.handedness]!.push({
            date: Date.now() + 200,
            action: isPinched ? HandAction.release : HandAction.grab,
            distance: distance + (isPinched ? 0.05 : -0.05)
          })

          // might be that we still push a "grab", even though we should wait for a release
          if (!isPinched && ((action?.action === HandAction.grab && action.distance > distance) || distance < 0.01)) {
            c.controller.dispatchEvent({ type: 'selectstart', fake: true })
            setPinched({ ...pinched, [c.inputSource.handedness]: true })
          }

          if (isPinched && ((action?.action === HandAction.release && action.distance < distance) || distance > 0.1)) {
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
