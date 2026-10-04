# Instrucciones del proyecto — React + TypeScript

Estas reglas aplican a **todas** las interacciones de Copilot en este repositorio.
Responde en español. Sé conciso y prioriza código correcto y mantenible sobre soluciones "ingeniosas".

## Stack

- React 18+ con componentes de función y Hooks. **Nunca** componentes de clase.
- TypeScript en modo `strict`. Prohibido `any` (usa `unknown` + narrowing, o tipos precisos).
- Vite como bundler. Vitest + React Testing Library para pruebas.
- TanStack Query para estado de servidor (fetch/caché). Estado local con `useState`/`useReducer`.
  Estado global solo si es imprescindible (Context para temas/config; Zustand si crece).
- ESLint (flat config) + Prettier. El código debe pasar `lint` y `typecheck` sin warnings.

## Estructura de carpetas (por features)

```
src/
  app/            # arranque, providers, router
  features/<x>/   # cada feature: components/ hooks/ api/ types.ts index.ts
  components/     # UI reutilizable y agnóstica de dominio
  hooks/          # hooks genéricos compartidos
  lib/            # utilidades puras, clientes http, helpers
  types/          # tipos globales compartidos
  test/           # setup y utilidades de test
```

Una feature no importa desde el interior de otra feature: expone su API pública por `index.ts`.

## Convenciones de código

- Nombres: componentes y tipos en `PascalCase`; variables, funciones y hooks en `camelCase`
  (hooks siempre con prefijo `use`); constantes de módulo en `UPPER_SNAKE_CASE`.
- Un componente por archivo; el archivo se llama igual que el componente (`UserCard.tsx`).
- Componentes pequeños y con una sola responsabilidad. Si supera ~150 líneas o mezcla
  responsabilidades, extrae subcomponentes o hooks.
- Props siempre tipadas con `interface`/`type`; nada de props implícitas.
  Prefiere props explícitas antes que "prop drilling" profundo.
- Deriva estado siempre que puedas; no dupliques en estado lo que puedes calcular en render.
- Efectos (`useEffect`) solo para sincronizar con sistemas externos. No los uses para
  transformar datos que ya tienes: eso va en render o en `useMemo`.
- Listas siempre con `key` estable (nunca el índice si el orden puede cambiar).

## Datos y errores

- Toda llamada de red pasa por `lib/http` (cliente centralizado con timeout y manejo de errores).
- Datos de servidor con TanStack Query (`useQuery`/`useMutation`); no `useEffect` + `fetch` manual.
- Maneja siempre los tres estados: cargando, error y vacío. Nunca asumas datos presentes.
- Usa Error Boundaries para fallos de render. Nunca tragues errores en silencio.

## Accesibilidad (obligatorio)

- HTML semántico antes que `div` con `onClick`. Usa `<button>`, `<nav>`, `<main>`, etc.
- Todo control interactivo debe ser accesible por teclado y tener nombre accesible.
- Imágenes con `alt`; formularios con `<label>` asociado.

## Rendimiento

- Optimiza solo con evidencia. No envuelvas todo en `memo`/`useMemo`/`useCallback` por defecto.
- Aplica code-splitting con `React.lazy` + `Suspense` en rutas y vistas pesadas.
- Evita recalcular o recrear objetos/funciones en render de listas grandes.

## Seguridad

- Nunca `dangerouslySetInnerHTML` sin sanitizar. Evítalo salvo necesidad real justificada.
- Secretos y URLs por variables de entorno `VITE_*`; jamás hardcodees claves ni tokens.
- Valida y tipa las respuestas externas (por ejemplo con Zod) antes de usarlas.

## Pruebas

- Cada componente con lógica o interacción debe tener test.
- Testea comportamiento observable por el usuario (roles, texto, eventos), no detalles internos.
- Usa `getByRole`/`findByRole` antes que `getByTestId`. Mockea la red, no la implementación.

## Git

- Commits en formato Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`.
- No mezcles refactor y feature en el mismo commit.
