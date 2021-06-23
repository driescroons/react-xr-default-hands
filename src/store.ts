import createStore, { State as ZustandState, StateCreator } from 'zustand'
import produce, { setAutoFreeze } from 'immer'
import { Object3D, XRHandedness } from 'three'
import { MutableRefObject } from 'react'
import { HandModel } from './HandModel'

const immer =
  <T extends ZustandState>(config: StateCreator<T, (fn: (state: T) => void) => void>): StateCreator<T> =>
  (set, get, api) =>
    config((fn) => set(produce(fn) as (state: T) => T), get, api)

// if you're having issues with dev freezing
setAutoFreeze(false)

export type State = {
  controllers: {
    [key in XRHandedness]?: {
      interacting?: MutableRefObject<Object3D | undefined>
      model?: HandModel
      // interactingAt?: number
    }
  }
  set: (fn: (state: State) => void) => void
}

export const useStore = createStore<State>(
  immer((set, get, api) => {
    return {
      controllers: {
        left: {
          interacting: undefined,
          model: undefined
          // interactingAt: undefined
        },
        right: {
          interacting: undefined,
          model: undefined
          // interactingAt: undefined
        }
      },
      set: (fn: (state: State) => void) => {
        set(fn)
      }
    }
  })
)
