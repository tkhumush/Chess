/**
 * Mock React implementation for development
 * TODO: Replace with actual React when package is installed
 */

export interface ReactNode {
  type: string | Function
  props: any
  children?: ReactNode[]
}

export interface ComponentProps {
  children?: ReactNode | ReactNode[]
  className?: string
  [key: string]: any
}

// Mock React object
export const React = {
  createElement: (type: any, props: any, ...children: any[]): ReactNode => ({
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  }),
  Fragment: 'Fragment',
  useState: <T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] => {
    let state = initial
    const setState = (value: T | ((prev: T) => T)) => {
      state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value
    }
    return [state, setState]
  },
  useCallback: <T extends Function>(fn: T, deps: any[]): T => fn,
  useEffect: (fn: () => void | (() => void), deps?: any[]) => {
    // Mock implementation - just call the function
    const cleanup = fn()
    return cleanup
  },
}

export default React