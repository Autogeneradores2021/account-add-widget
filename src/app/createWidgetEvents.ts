import type {
  AccountWidgetCallbacks,
  WidgetEventMap,
  WidgetEventName,
  WidgetEvents,
} from '../features/account-import'

export const EVENT_PREFIX = 'accountwidget:'

function callbackName<K extends WidgetEventName>(name: K): `on${Capitalize<K>}` {
  return `on${name.charAt(0).toUpperCase()}${name.slice(1)}` as `on${Capitalize<K>}`
}

/** Notifica al host por callback (`onSuccess`…) y por `CustomEvent` (`accountwidget:success`…). */
export function createWidgetEvents(
  target: EventTarget,
  getCallbacks: () => AccountWidgetCallbacks,
): WidgetEvents {
  return {
    emit(name, detail) {
      const callback = getCallbacks()[callbackName(name)] as
        | ((value: WidgetEventMap[typeof name]) => void)
        | undefined
      if (typeof callback === 'function') {
        try {
          callback(detail)
        } catch (error) {
          // Un error en el código del host no debe romper el widget.
          console.error(`[AccountWidget] Error en el callback ${callbackName(name)}:`, error)
        }
      }
      target.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${name}`, { detail, bubbles: true, composed: true }))
    },
  }
}
