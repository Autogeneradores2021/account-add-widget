import { z } from 'zod/mini'

const nullableText = z.pipe(
  z.nullish(z.string()),
  z.transform((value) => value ?? null),
)

export const accountStatusSchema = z.object({
  niu: z.pipe(z.union([z.string(), z.number()]), z.transform(String)),
  existe: z.boolean(),
  direccion: nullableText,
  propietario: nullableText,
})

export const accountStatusResponseSchema = z.object({
  data: z.array(accountStatusSchema),
})

// El contrato de `account/tercero` no está documentado: se acepta cualquier JSON.
export const associateResponseSchema = z.unknown()
