---
applyTo: "**/*.{test,spec}.{ts,tsx}"
---
# Estándares para pruebas

- Framework: Vitest + React Testing Library. Renderiza con el `render` de `src/test/utils`
  (incluye los providers de la app: Query, Router, tema).
- Prueba comportamiento observable por el usuario, no implementación.
- Selecciona por rol/etiqueta accesible: `getByRole`, `getByLabelText`, `findByRole`.
  Usa `getByTestId` solo como último recurso.
- Interacción con `@testing-library/user-event`, no con `fireEvent` salvo casos puntuales.
- Mockea la red (MSW o el cliente http), nunca la implementación interna del componente.
- Cubre siempre: caso feliz, estado de error, estado vacío y, si aplica, accesibilidad por teclado.
- Nombres de test descriptivos en presente: "muestra un mensaje cuando no hay resultados".
- Evita `waitFor` con aserciones vacías; espera algo concreto (`findBy*` o `waitFor(() => expect(...))`).
