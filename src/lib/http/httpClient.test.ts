import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../test/msw/server'
import { HttpError, joinUrl, postJson } from './httpClient'

const URL_ = 'http://api.test/resource'
const identity = (data: unknown) => data

describe('postJson', () => {
  it('envía JSON con el token CSRF resuelto por una función async', async () => {
    let headers: Headers | undefined
    let body: unknown
    server.use(
      http.post(URL_, async ({ request }) => {
        headers = request.headers
        body = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )

    const result = await postJson(URL_, { a: 1 }, { parse: identity, csrfToken: async () => 'tok-123' })

    expect(result).toEqual({ ok: true })
    expect(body).toEqual({ a: 1 })
    expect(headers?.get('X-CSRF-TOKEN')).toBe('tok-123')
    expect(headers?.get('Content-Type')).toBe('application/json')
  })

  it('convierte respuestas no exitosas en HttpError con el mensaje del servidor', async () => {
    server.use(http.post(URL_, () => HttpResponse.json({ message: 'NIU inválido' }, { status: 400 })))

    await expect(postJson(URL_, {}, { parse: identity })).rejects.toMatchObject({
      code: 'HTTP',
      status: 400,
      message: 'NIU inválido',
    })
  })

  it('reporta INVALID_RESPONSE cuando el parser rechaza los datos', async () => {
    server.use(http.post(URL_, () => HttpResponse.json({ unexpected: true })))
    const parse = () => {
      throw new Error('formato')
    }

    await expect(postJson(URL_, {}, { parse })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('reporta TIMEOUT cuando el servicio no responde a tiempo', async () => {
    server.use(
      http.post(URL_, async () => {
        await delay(200)
        return HttpResponse.json({})
      }),
    )

    await expect(postJson(URL_, {}, { parse: identity, timeoutMs: 20 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  })

  it('reporta NETWORK cuando la conexión falla', async () => {
    server.use(http.post(URL_, () => HttpResponse.error()))

    const error = await postJson(URL_, {}, { parse: identity }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ code: 'NETWORK' })
  })
})

describe('joinUrl', () => {
  it('une base y ruta sin duplicar barras', () => {
    expect(joinUrl('http://x/api/', '/account/status')).toBe('http://x/api/account/status')
  })
})
