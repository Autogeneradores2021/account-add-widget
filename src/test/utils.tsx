import { act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mountWidget } from '../app/mountWidget'
import type { AccountWidgetInstance, AccountWidgetOptions } from '../features/account-import'
import { API_BASE_URL } from './msw/handlers'

export const TEST_EMAIL = 'tercero@example.com'

const mounted = new Set<AccountWidgetInstance>()

export function cleanupWidgets() {
  act(() => mounted.forEach((instance) => instance.destroy()))
  mounted.clear()
  document.body.replaceChildren()
}

/** Monta el widget (sin Shadow DOM para poder consultar por rol) con todos sus providers. */
export function renderWidget(options: Partial<AccountWidgetOptions> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  let instance!: AccountWidgetInstance
  act(() => {
    instance = mountWidget(container, { apiBaseUrl: API_BASE_URL, email: TEST_EMAIL, ...options }, { shadow: false })
  })
  mounted.add(instance)
  return {
    container,
    instance,
    user: userEvent.setup({ applyAccept: false }),
    view: within(container),
  }
}

export function csvFile(content: string, name = 'cuentas.csv', type = 'text/csv'): File {
  return new File([content], name, { type })
}
