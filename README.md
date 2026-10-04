# Account Widget — Asociar cuentas NIU

Widget embebible (estilo reCAPTCHA) para importar cuentas NIU desde un CSV, validarlas contra
`POST /account/status` y asociar las existentes a un tercero con `POST /account/tercero`.

Se distribuye como **un solo script** (`dist/account-widget.js`, IIFE con React incluido) que la
página anfitriona carga sin necesidad de usar React. Los estilos van aislados en Shadow DOM.

## Requisitos y scripts

- Node **≥ 20.19** (Vite 8).

| Script | Descripción |
| --- | --- |
| `npm run dev` | Página de desarrollo (`index.html`) con proxy `/account-api` → `http://localhost:8081` |
| `npm run build` | Genera `dist/account-widget.js` |
| `npm test` | Vitest + Testing Library + MSW |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

## Configuración (`.env`)

Copia `.env.example` a `.env`. Las variables se incrustan en el bundle al compilar.

| Variable | Defecto | Descripción |
| --- | --- | --- |
| `VITE_ACCOUNT_API_URL` | — | URL base del API (si el host no envía `apiBaseUrl`) |
| `VITE_ACCOUNT_STATUS_PATH` | `account/status` | Ruta del servicio de validación |
| `VITE_ACCOUNT_TERCERO_PATH` | `account/tercero` | Ruta del servicio de asociación |
| `VITE_API_PROXY_TARGET` | — | Solo dev: backend del proxy cuando la URL base es relativa |

Las URL finales son `VITE_ACCOUNT_API_URL` + ruta, p. ej.
`http://localhost:8081/account-api/public/api/account/status`.
`.env.production` (usado por `npm run build`) debe tener una URL base **absoluta**, porque el
script se carga en dominios de terceros. La opción `apiBaseUrl` de `render()` tiene prioridad.

## Uso

### API JavaScript

```html
<div id="niu-widget"></div>
<script>
  function initAccountWidget() {
    const widget = AccountWidget.render('#niu-widget', {
      apiBaseUrl: 'https://mi-dominio/account-api/public/api',
      email: 'usuario@correo.com',
      getCsrfToken: async () => obtenerToken(),
      onSuccess: (result) => console.log('Asociadas', result.associated),
      onError: (error) => console.error(error.code, error.message),
      onComplete: (r) => console.log('Fin del proceso:', r.status), // success | error | cancelled
    })
  }
</script>
<script src="/ruta/account-widget.js?onload=initAccountWidget" async></script>
```

También: `AccountWidget.ready(cb)`, `AccountWidget.renderAll(root?)`, `AccountWidget.version`.

### Auto-render con atributos `data-*`

```html
<div class="account-widget"
     data-email="usuario@correo.com"
     data-api-base-url="https://mi-dominio/account-api/public/api"
     data-csrf-token="..."
     data-callback="onNiuSuccess"
     data-error-callback="onNiuError"
     data-complete-callback="onNiuComplete"></div>
```

Los callbacks son nombres de funciones globales.

### Instancia

`render()` devuelve: `open()`, `close()`, `reset()`, `update(partialOptions)`, `getState()`
(`idle | checking | review | submitting | success | error`) y `destroy()`.

## Opciones

| Opción | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `email` | `string` | — (obligatorio) | Email enviado a `account/tercero` |
| `apiBaseUrl` | `string` | `VITE_ACCOUNT_API_URL` | URL base del API |
| `csrfToken` | `string` | — | Header `X-CSRF-TOKEN` fijo |
| `getCsrfToken` | `() => string \| Promise<string>` | — | Prioridad sobre `csrfToken` |
| `withCredentials` | `boolean` | `false` | `credentials: 'include'` |
| `sendNiuAsNumber` | `boolean` | `true` | NIU numérico en `tercero` (si hay ceros a la izquierda se envía string) |
| `maxFileSizeKb` | `number` | `512` | Tamaño máximo del CSV |
| `maxRows` | `number` | `1000` | Máximo de NIU por archivo |
| `requestTimeoutMs` | `number` | `15000` | Timeout de cada petición |
| `texts` | `Partial<WidgetTexts>` | — | Personalización de textos |

## Eventos

Cada evento invoca el callback `on<Evento>` y además despacha un `CustomEvent`
`accountwidget:<evento>` (burbujea) sobre el contenedor.

| Evento | `detail` |
| --- | --- |
| `ready` | — |
| `open` / `close` | `close`: `{ reason: 'user' \| 'api' \| 'completed' }` |
| `fileParsed` | `{ nius, invalidValues, duplicates, headerSkipped }` |
| `statusLoaded` | `AccountStatus[]` |
| `success` | `{ email, associated, skipped, response }` |
| `error` | `AccountWidgetError` (`code`, `message`, `status?`, `details?`) |
| `complete` | `{ status: 'success', result } \| { status: 'error', error } \| { status: 'cancelled' }` — uno por cada apertura |

Códigos de error: `CONFIG_INVALID`, `FILE_TYPE`, `FILE_TOO_LARGE`, `CSV_EMPTY`, `CSV_INVALID`,
`TOO_MANY_ROWS`, `NO_EXISTING_ACCOUNTS`, `NETWORK`, `TIMEOUT`, `HTTP`, `INVALID_RESPONSE`, `UNEXPECTED`.

## Formato del CSV

Un NIU numérico por línea (también acepta una sola fila separada por `,`, `;` o tabulador).
Se ignora un encabezado de texto, se eliminan duplicados y se reportan valores no numéricos.

```
123456789
9876544321
```

## Personalización visual

Sobrescribe variables CSS en el contenedor, p. ej.:

```css
#niu-widget { --aw-primary: #0f766e; --aw-primary-hover: #115e59; }
```

## Notas de integración

- El backend debe permitir CORS para el origen anfitrión (y `Access-Control-Allow-Credentials`
  si se usa `withCredentials`), incluyendo el header `X-CSRF-TOKEN`.
- La dirección se muestra enmascarada (`CL 30 ***`).
- Demo HTML pura: `demo/index.html` (requiere `npm run build`).
