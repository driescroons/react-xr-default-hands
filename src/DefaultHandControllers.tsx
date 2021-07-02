import { useFrame } from '@react-three/fiber'
import { useXR, useXREvent, XREvent } from '@react-three/xr'
import React, { useEffect, useRef, useState } from 'react'
import { useCallback } from 'react'
import { MutableRefObject } from 'react'
import { useMemo } from 'react'
import { XRHandedness } from 'three'

import { Axes } from './Axes'
import { HandModel } from './HandModel'
import { useStore } from './store'

enum HandAction {
  'release',
  'grab'
}

export function DefaultHandControllers({ modelPaths }: { modelPaths?: { [key in XRHandedness]?: string } }) {
  const { controllers, isHandTracking, isPresenting } = useXR()

  const models = useStore((store) => store.hands.models)
  const set = useStore((store) => store.set)

  const handActions = useRef<{ [key in XRHandedness]?: { date: number; distance: number; action: HandAction }[] }>({ left: [], right: [] })

  const [pinched, setPinched] = useState<{ [key in XRHandedness]?: boolean }>({ left: false, right: false })

  const modelsRef = useRef<{ [key in XRHandedness]?: HandModel }>({
    left: undefined,
    right: undefined
  })

  const interactingRef = useRef<{ [key in XRHandedness]?: HandModel }>({
    left: undefined,
    right: undefined
  })

  useEffect(() => {
    set((store) => {
      store.hands.models = modelsRef
      store.hands.interacting = interactingRef
    })
  }, [])

  useEffect(() => {
    if (models?.current) {
      controllers.map((c) => {
        let model = models?.current[c.inputSource.handedness]
        if (!model) {
          const model = new HandModel(c.controller, c.inputSource, modelPaths)
          models!.current[c.inputSource.handedness] = model
        }
      })
    }
  }, [controllers])

  useEffect(() => {
    // fix this firing twice when going in vr mode
    if (isPresenting && Object.values(models!.current).filter((model) => !!model).length === controllers.length) {
      controllers.forEach((c, index) => {
        let model = models!.current[c.inputSource.handedness]
        if (model) {
          if (isHandTracking) {
            if (!(model.inputSource.handedness === c.inputSource.handedness && model.loaded)) {
              model.load(c.hand, c.inputSource, true)
            }
          } else {
            if (!(model.inputSource.handedness === c.inputSource.handedness && model.loaded)) {
              model.load(c.controller, c.inputSource, false)
            }
          }
          models!.current[c.inputSource.handedness] = model
        }
      })
    }
  }, [controllers, isHandTracking, models])

  useFrame(() => {
    if (isHandTracking) {
      controllers.map((c, index) => {
        const model = models?.current[c.inputSource.handedness]
        if (model && !model?.loading) {
          const distance = model!.getThumbIndexDistance()

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
      const model = models?.current[e.controller.inputSource.handedness]
      if (model) {
        model.setPose('pinch')
      }
    }
  })

  useXREvent('selectend', (e: XREvent) => {
    if (!isHandTracking) {
      const model = models?.current[e.controller.inputSource.handedness]
      if (model) {
        model.setPose('idle')
      }
    }
  })

  return (
    <>
      {process.env.NODE_ENV === 'development' &&
        controllers.map((c, index) =>
          models?.current[c.inputSource.handedness] ? <Axes controller={c} model={models!.current[c.inputSource.handedness]!} /> : null
        )}
    </>
  )
}
