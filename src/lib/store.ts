/**
 * Mock store implementation for development
 * TODO: Replace with actual Zustand when package is installed
 */

type StoreApi<T> = {
  getState: () => T
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
}

type StateCreator<T> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) => T

export function create<T>(createState: StateCreator<T>) {
  let state: T
  let listeners: Array<(state: T, prevState: T) => void> = []

  const set = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const prevState = { ...state }
    const newState = typeof partial === 'function' ? partial(state) : partial
    state = { ...state, ...newState }
    listeners.forEach(listener => listener(state, prevState))
  }

  const get = () => state

  state = createState(set, get)

  return () => ({
    ...state,
    getState: get,
    setState: set,
    subscribe: (listener: (state: T, prevState: T) => void) => {
      listeners.push(listener)
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    }
  })
}

export function subscribeWithSelector<T>(fn: StateCreator<T>) {
  return fn
}