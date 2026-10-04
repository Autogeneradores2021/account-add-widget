import type { AccountWidgetInstance, AccountWidgetOptions } from '../features/account-import'
import { hasInstance, mountWidget } from './mountWidget'

export { AccountWidgetError } from '../features/account-import'
export type * from '../features/account-import/types'

export const version = __APP_VERSION__

const AUTO_RENDER_SELECTOR = '.account-widget'
const currentScript = typeof document !== 'undefined' ? document.currentScript : null

/** Monta el widget en `target` (selector o elemento). Si ya existe, actualiza sus opciones. */
export function render(target: string | HTMLElement, options: AccountWidgetOptions): AccountWidgetInstance {
  return mountWidget(target, options, { shadow: true })
}

/** Ejecuta `callback` cuando el DOM está listo. */
export function ready(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => callback(), { once: true })
  } else {
    queueMicrotask(callback)
  }
}

function globalFunction<T>(name: string | undefined): T | undefined {
  if (!name) return undefined
  const value = (window as unknown as Record<string, unknown>)[name]
  return typeof value === 'function' ? (value as T) : undefined
}

/** Monta el widget en cada `.account-widget` con atributos `data-*` (estilo reCAPTCHA). */
export function renderAll(root: ParentNode = document): AccountWidgetInstance[] {
  return Array.from(root.querySelectorAll<HTMLElement>(AUTO_RENDER_SELECTOR))
    .filter((element) => !hasInstance(element))
    .flatMap((element) => {
      const data = element.dataset
      try {
        return [
          render(element, {
            email: data.email ?? '',
            apiBaseUrl: data.apiBaseUrl,
            csrfToken: data.csrfToken,
            onSuccess: globalFunction(data.callback),
            onError: globalFunction(data.errorCallback),
            onComplete: globalFunction(data.completeCallback),
          }),
        ]
      } catch (error) {
        console.error('[AccountWidget] No se pudo montar el widget:', error)
        return []
      }
    })
}

function bootstrap() {
  renderAll()
  // `<script src="account-widget.js?onload=miFuncion">` como en reCAPTCHA.
  const src = currentScript instanceof HTMLScriptElement ? currentScript.src : ''
  const onload = src ? new URL(src, document.baseURI).searchParams.get('onload') : null
  globalFunction<() => void>(onload ?? undefined)?.()
}

if (typeof document !== 'undefined' && import.meta.env.MODE !== 'test') ready(bootstrap)
