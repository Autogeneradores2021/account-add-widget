import { describe, expect, it } from 'vitest'
import { maskAddress } from './maskAddress'

describe('maskAddress', () => {
  it('muestra solo el inicio de la dirección seguido de ***', () => {
    expect(maskAddress('CL 30 # 12-21')).toBe('CL 30 ***')
    expect(maskAddress('CL 10 # 1-144')).toBe('CL 10 ***')
  })

  it('limita la parte visible en direcciones largas', () => {
    expect(maskAddress('C 49 CS 37 170 AP 201 ED13 CJR PRADOS DEL SAUCE ETII')).toBe('C 49 CS 37 1 ***')
  })

  it('oculta casi todo en direcciones muy cortas', () => {
    expect(maskAddress('CL 1')).toBe('C ***')
  })

  it('devuelve un guion cuando no hay dirección', () => {
    expect(maskAddress(null)).toBe('—')
    expect(maskAddress('   ')).toBe('—')
  })
})
