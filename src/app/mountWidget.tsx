import { QueryClient } from '@tanstack/react-query'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import {
  resolveOptions,
  toWidgetError,
  type AccountWidgetCallbacks,
  type AccountWidgetInstance,
  type AccountWidgetOptions,
  type ResolvedOptions,
} from '../features/account-import'
import widgetCss from '../styles/widget.css?inline'
import { createWidgetEvents } from './createWidgetEvents'
import { WidgetRoot, type WidgetHandle } from './WidgetRoot'

export interface MountConfig {
  /** Aísla estilos y DOM en un Shadow Root (por defecto `true`). */
  shadow?: boolean
}

const instances = new WeakMap<HTMLElement, AccountWidgetInstance>()

function resolveContainer(target: string | HTMLElement): HTMLElement {
  const container = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!container) throw toWidgetError(new Error(`No se encontró el contenedor "${String(target)}".`))
  return container
}

function resolveOrNotify(raw: unknown, notify: (error: ReturnType<typeof toWidgetError>) => void): ResolvedOptions {
  try {
    return resolveOptions(raw)
  } catch (cause) {
    const error = toWidgetError(cause)
    notify(error)
    throw error
  }
}

export function mountWidget(
  target: string | HTMLElement,
  rawOptions: AccountWidgetOptions,
  { shadow = true }: MountConfig = {},
): AccountWidgetInstance {
  const container = resolveContainer(target)
  const existing = instances.get(container)
  if (existing) {
    existing.update(rawOptions)
    return existing
  }

  let callbacks: AccountWidgetCallbacks = rawOptions ?? {}
  const events = createWidgetEvents(container, () => callbacks)
  let options = resolveOrNotify(rawOptions, (error) => events.emit('error', error))
  callbacks = options

  const host = shadow ? (container.shadowRoot ?? container.attachShadow({ mode: 'open' })) : container
  const style = document.createElement('style')
  style.textContent = widgetCss
  const mountPoint = document.createElement('div')
  mountPoint.className = 'aw-host'
  host.replaceChildren(style, mountPoint)

  const root = createRoot(mountPoint)
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } } })
  const handle: { current: WidgetHandle | null } = { current: null }

  const paint = () =>
    root.render(<WidgetRoot ref={handle} options={options} events={events} queryClient={queryClient} />)

  // Render síncrono: la instancia queda operativa (open/close) apenas retorna `render()`.
  flushSync(paint)

  const instance: AccountWidgetInstance = {
    open: () => handle.current?.open(),
    close: () => handle.current?.close('api'),
    reset: () => handle.current?.reset(),
    getState: () => handle.current?.getState() ?? 'idle',
    update(partial) {
      const next = { ...options, ...partial, texts: { ...options.texts, ...partial.texts } }
      options = resolveOrNotify(next, (error) => events.emit('error', error))
      callbacks = options
      flushSync(paint)
    },
    destroy() {
      root.unmount()
      host.replaceChildren()
      queryClient.clear()
      instances.delete(container)
    },
  }
  instances.set(container, instance)
  return instance
}

export function hasInstance(container: HTMLElement): boolean {
  return instances.has(container)
}
