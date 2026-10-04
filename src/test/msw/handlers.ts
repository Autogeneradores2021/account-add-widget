import { http, HttpResponse } from 'msw'

export const API_BASE_URL = 'http://localhost:8081/account-api/public/api'
export const STATUS_URL = `${API_BASE_URL}/account/status`
export const TERCERO_URL = `${API_BASE_URL}/account/tercero`

export const STATUS_FIXTURE = {
  data: [
    { niu: '196776920', existe: true, direccion: 'CL 30 # 12-21', propietario: 'JESUS A BURGOS ALMARIO' },
    { niu: '314289029', existe: false, direccion: null, propietario: null },
    {
      niu: '901506607',
      existe: true,
      direccion: 'C 49 CS 37 170 AP 201 ED13 CJR PRADOS DEL SAUCE ETII',
      propietario: null,
    },
  ],
}

export const handlers = [
  http.post(STATUS_URL, () => HttpResponse.json(STATUS_FIXTURE)),
  http.post(TERCERO_URL, () => HttpResponse.json({ ok: true })),
]
