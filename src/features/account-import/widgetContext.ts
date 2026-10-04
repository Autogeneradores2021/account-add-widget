import { createContext, useContext } from 'react'
import type { ResolvedOptions, WidgetEvents } from './types'

export interface WidgetContextValue {
  options: ResolvedOptions
  events: WidgetEvents
}

export const WidgetContext = createContext<WidgetContextValue | null>(null)

export function useWidgetContext(): WidgetContextValue {
  const value = useContext(WidgetContext)
  if (!value) throw new Error('useWidgetContext debe usarse dentro de <WidgetContext>')
  return value
}
