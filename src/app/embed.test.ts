import { act, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AccountWidgetInstance } from '../features/account-import'
import { API_BASE_URL } from '../test/msw/handlers'
import { render, renderAll } from './embed'

function container(id = 'widget') {
  const element = document.createElement('div')
  element.id = id
  document.body.append(element)
  return element
}

describe('API embebible AccountWidget', () => {
  it('monta el widget aislado en Shadow DOM y lo desmonta con destroy()', () => {
    const element = container()
    let instance!: AccountWidgetInstance
    act(() => {
      instance = render('#widget', { apiBaseUrl: API_BASE_URL, email: 'a@b.co' })
    })

    const shadow = element.shadowRoot as ShadowRoot
    expect(shadow.querySelector('style')?.textContent).toContain('.aw-btn')
    expect(within(shadow as unknown as HTMLElement).getByRole('button', { name: 'Asociar cuentas NIU' })).toBeVisible()

    act(() => instance.destroy())
    expect(shadow.childElementCount).toBe(0)
  })

  it('expone open/close y emite CustomEvents en el contenedor', async () => {
    const element = container()
    const listener = vi.fn()
    element.addEventListener('accountwidget:complete', listener)
    let instance!: AccountWidgetInstance
    act(() => {
      instance = render(element, { apiBaseUrl: API_BASE_URL, email: 'a@b.co' })
    })

    act(() => instance.open())
    expect(element.shadowRoot?.querySelector('dialog')?.open).toBe(true)
    act(() => instance.close())

    await waitFor(() => expect(listener).toHaveBeenCalledOnce())
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ status: 'cancelled' })
    act(() => instance.destroy())
  })

  it('rechaza una configuración inválida con CONFIG_INVALID y notifica onError', () => {
    container()
    const onError = vi.fn()

    expect(() => render('#widget', { email: 'no-es-email', apiBaseUrl: API_BASE_URL, onError })).toThrow(
      expect.objectContaining({ code: 'CONFIG_INVALID' }),
    )
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'CONFIG_INVALID' }))
  })

  it('auto-monta elementos .account-widget con atributos data-*', () => {
    const element = container()
    element.className = 'account-widget'
    element.dataset.email = 'a@b.co'
    element.dataset.apiBaseUrl = API_BASE_URL

    let instances: AccountWidgetInstance[] = []
    act(() => {
      instances = renderAll()
    })

    expect(element.shadowRoot?.querySelector('button')).toHaveTextContent('Asociar cuentas NIU')
    expect(instances).toHaveLength(1)
    act(() => instances.forEach((instance) => instance.destroy()))
  })
})
