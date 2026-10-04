const MASK = '***'
const VISIBLE_RATIO = 0.4
const MIN_VISIBLE = 4
const MAX_VISIBLE = 12
export const EMPTY_VALUE = '—'

/** Muestra solo el inicio de la dirección: `CL 30 # 12-21` → `CL 30 ***`. */
export function maskAddress(address: string | null | undefined): string {
  const value = address?.trim() ?? ''
  if (!value) return EMPTY_VALUE
  if (value.length <= MIN_VISIBLE) return `${value.charAt(0)} ${MASK}`

  const visible = Math.min(MAX_VISIBLE, Math.max(MIN_VISIBLE, Math.round(value.length * VISIBLE_RATIO)))
  return `${value.slice(0, visible).trimEnd()} ${MASK}`
}
