// Página de desarrollo: simula una aplicación host que usa la API pública del widget.
import { render } from './app/embed'

const log = document.querySelector<HTMLPreElement>('#log')
const emailInput = document.querySelector<HTMLInputElement>('#email')

function write(name: string, detail?: unknown) {
  if (!log) return
  const line = `[${new Date().toLocaleTimeString()}] ${name} ${detail === undefined ? '' : JSON.stringify(detail, null, 2)}`
  log.textContent = `${line}\n${log.textContent ?? ''}`
}

const widget = render('#niu-widget', {
  email: emailInput?.value ?? '',
  getCsrfToken: () => '',
  onReady: () => write('ready'),
  onOpen: () => write('open'),
  onClose: (detail) => write('close', detail),
  onFileParsed: (detail) => write('fileParsed', detail),
  onStatusLoaded: (rows) => write('statusLoaded', rows),
  onSuccess: (result) => write('success', result),
  onError: (error) => write('error', { code: error.code, message: error.message, status: error.status }),
  onComplete: (result) => write('complete', result),
})

emailInput?.addEventListener('change', () => widget.update({ email: emailInput.value }))
