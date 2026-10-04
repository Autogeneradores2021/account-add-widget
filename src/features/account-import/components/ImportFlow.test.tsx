import { fireEvent, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { STATUS_URL, TERCERO_URL } from '../../../test/msw/handlers'
import { server } from '../../../test/msw/server'
import { csvFile, renderWidget, TEST_EMAIL } from '../../../test/utils'

async function openAndUpload(content = '196776920\n314289029\n901506607', options = {}) {
  const utils = renderWidget(options)
  await utils.user.click(utils.view.getByRole('button', { name: 'Asociar cuentas NIU' }))
  const input = utils.view.getByLabelText(/arrastra aquí tu archivo csv/i)
  await utils.user.upload(input, csvFile(content))
  return utils
}

describe('Widget de asociación de cuentas NIU', () => {
  it('abre el modal con la zona de carga al pulsar el botón', async () => {
    const onOpen = vi.fn()
    const { user, view } = renderWidget({ onOpen })

    await user.click(view.getByRole('button', { name: 'Asociar cuentas NIU' }))

    expect(view.getByRole('dialog', { name: 'Asociar cuentas NIU' })).toBeInTheDocument()
    expect(view.getByLabelText(/arrastra aquí tu archivo csv/i)).toHaveFocus()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('consulta el estado de las cuentas del CSV y muestra la tabla con la dirección enmascarada', async () => {
    let requestBody: unknown
    server.use(
      http.post(STATUS_URL, async ({ request }) => {
        requestBody = await request.json()
        return undefined
      }),
    )
    const onStatusLoaded = vi.fn()
    const { view } = await openAndUpload(undefined, { onStatusLoaded })

    const table = await view.findByRole('table', { name: /resultado de la validación/i })
    expect(requestBody).toEqual({ niu: ['196776920', '314289029', '901506607'] })
    expect(table).toHaveTextContent('CL 30 ***')
    expect(table).not.toHaveTextContent('CL 30 # 12-21')
    expect(table).toHaveTextContent('JESUS A BURGOS ALMARIO')
    expect(view.getAllByText('No existe')).toHaveLength(1)
    expect(onStatusLoaded).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ niu: '196776920' })]))
  })

  it('al continuar envía solo las cuentas existentes y notifica éxito al host', async () => {
    let requestBody: unknown
    server.use(
      http.post(TERCERO_URL, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ asociadas: 2 })
      }),
    )
    const onSuccess = vi.fn()
    const onComplete = vi.fn()
    const { user, view, instance } = await openAndUpload(undefined, { onSuccess, onComplete })

    await user.click(await view.findByRole('button', { name: 'Continuar (2)' }))

    expect(await view.findByRole('status')).toHaveTextContent(/asociadas correctamente/i)
    expect(requestBody).toEqual({ email: TEST_EMAIL, niu: [196776920, 901506607] })
    const result = {
      email: TEST_EMAIL,
      associated: ['196776920', '901506607'],
      skipped: ['314289029'],
      response: { asociadas: 2 },
    }
    expect(onSuccess).toHaveBeenCalledWith(result)
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ status: 'success', result })
    expect(instance.getState()).toBe('success')
  })

  it('permite cargar el archivo arrastrándolo a la zona de carga', async () => {
    const { user, view } = renderWidget()
    await user.click(view.getByRole('button', { name: 'Asociar cuentas NIU' }))
    const dropzone = view.getByLabelText(/arrastra aquí tu archivo csv/i).parentElement as HTMLElement

    fireEvent.drop(dropzone, { dataTransfer: { files: [csvFile('196776920')] } })

    expect(await view.findByRole('table')).toBeInTheDocument()
  })

  it('muestra un error y no consulta el API si el archivo no es CSV', async () => {
    const onError = vi.fn()
    const { user, view } = renderWidget({ onError })
    await user.click(view.getByRole('button', { name: 'Asociar cuentas NIU' }))

    await user.upload(view.getByLabelText(/arrastra aquí tu archivo csv/i), csvFile('123', 'cuentas.xlsx'))

    expect(view.getByRole('alert')).toHaveTextContent(/extensión .csv/i)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'FILE_TYPE' }))
  })

  it('informa cuando el CSV no tiene NIU numéricos', async () => {
    const { view } = await openAndUpload('abc\nxyz-1')
    expect(await view.findByRole('alert')).toHaveTextContent(/no contiene NIU numéricos/i)
  })

  it('informa cuando el CSV está vacío', async () => {
    const { view } = await openAndUpload('\n\n')
    expect(await view.findByRole('alert')).toHaveTextContent(/no contiene cuentas/i)
  })

  it('lista los valores inválidos ignorados', async () => {
    const { view } = await openAndUpload('196776920\nABC-12')
    await view.findByRole('table')
    expect(view.getByText(/1 valor no numérico fue ignorado/i)).toBeInTheDocument()
    expect(view.getByText(/Línea 2: «ABC-12»/)).toBeInTheDocument()
  })

  it('muestra el error del servicio de estado y permite volver a cargar', async () => {
    server.use(http.post(STATUS_URL, () => HttpResponse.json({ message: 'Servicio no disponible' }, { status: 503 })))
    const onError = vi.fn()
    const { view } = await openAndUpload(undefined, { onError })

    expect(await view.findByRole('alert')).toHaveTextContent('Servicio no disponible')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'HTTP', status: 503 }))
    expect(view.getByLabelText(/arrastra aquí tu archivo csv/i)).toBeInTheDocument()
  })

  it('mantiene la tabla y permite reintentar cuando falla la asociación', async () => {
    server.use(http.post(TERCERO_URL, () => HttpResponse.json({}, { status: 500 }), { once: true }))
    const { user, view } = await openAndUpload()

    await user.click(await view.findByRole('button', { name: 'Continuar (2)' }))
    expect(await view.findByRole('alert')).toHaveTextContent(/HTTP 500/)
    expect(view.getByRole('table')).toBeInTheDocument()

    await user.click(view.getByRole('button', { name: 'Continuar (2)' }))
    expect(await view.findByRole('status')).toHaveTextContent(/asociadas correctamente/i)
  })

  it('deshabilita continuar cuando ninguna cuenta existe', async () => {
    server.use(
      http.post(STATUS_URL, () =>
        HttpResponse.json({ data: [{ niu: '1', existe: false, direccion: null, propietario: null }] }),
      ),
    )
    const { view } = await openAndUpload('1')

    expect(await view.findByText(/ninguna de las cuentas existe/i)).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('muestra el estado de carga mientras consulta', async () => {
    server.use(
      http.post(STATUS_URL, async () => {
        await delay(50)
        return undefined
      }),
    )
    const { view } = await openAndUpload()
    expect(view.getByRole('status')).toHaveTextContent(/consultando cuentas/i)
    expect(await view.findByRole('table')).toBeInTheDocument()
  })

  it('al cancelar cierra el modal, notifica cancelación y reinicia el flujo', async () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()
    const { user, view } = await openAndUpload(undefined, { onClose, onComplete })
    await view.findByRole('table')

    await user.click(view.getByRole('button', { name: 'Cancelar' }))

    expect(view.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledWith({ reason: 'user' })
    expect(onComplete).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(view.getByRole('button', { name: 'Asociar cuentas NIU' })).toHaveFocus()

    await user.click(view.getByRole('button', { name: 'Asociar cuentas NIU' }))
    expect(view.queryByRole('table')).not.toBeInTheDocument()
  })

  it('se opera con teclado: Enter abre el modal y Escape lo cierra', async () => {
    const { user, view } = renderWidget()

    await user.tab()
    expect(view.getByRole('button', { name: 'Asociar cuentas NIU' })).toHaveFocus()
    await user.keyboard('{Enter}')
    const dialog = view.getByRole('dialog')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    await waitFor(() => expect(view.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
