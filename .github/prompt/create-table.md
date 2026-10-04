Actúa como ingeniero front-end senior de React + TypeScript. Necesito que construyas un
componente de tabla dinámica dirigida por una plantilla JSON, para digitalizar indicadores
y evaluaciones. Antes de codificar, dame un plan breve; luego implementa.

## OBJETIVO
Un componente que reciba una plantilla JSON (definición de columnas) y una lista de filas,
y renderice una tabla HTML editable donde el usuario pueda:
- Editar celdas según el tipo de cada columna.
- Agregar filas nuevas.
- Eliminar filas.
- Ver columnas calculadas (fórmulas) que se recalculan solas en cada fila.

## MODELO DE DATOS (plantilla + datos)
La plantilla define las columnas; las filas son los datos. Ejemplo:

{
  "template": {
    "id": "eval-desempeno",
    "nombre": "Evaluación de desempeño",
    "columns": [
      { "id": "area", "label": "Área", "type": "select", "options": ["TI","Gerencia"], "required": true },
      { "id": "proceso", "label": "Proceso", "type": "select", "dependsOn": "area",
        "optionsBy": {
          "TI": ["Infraestructura","Desarrollo","Soporte"],
          "Gerencia": ["Planeación","Presupuesto","Talento humano"]
        }, "required": true },
      { "id": "peso", "label": "Peso (%)", "type": "number", "min": 0, "max": 100, "required": true },
      { "id": "calificacion", "label": "Calificación", "type": "number", "min": 0, "max": 100, "required": true },
      { "id": "resultado", "label": "Resultado", "type": "computed",
        "formula": "(calificacion * peso) / 100", "decimals": 2, "readOnly": true }
    ]
  },
  "rows": [
    { "id": "r1", "area": "TI", "proceso": "Desarrollo", "peso": 9, "calificacion": 80 }
  ]
}

Tipos de columna soportados: "text" | "number" | "select" | "computed".
Cada fila tiene un "id" único (úsalo como key de React y para editar/eliminar).

## REQUISITOS FUNCIONALES

1. Render dinámico: la tabla se construye a partir de template.columns. Cada tipo de columna
   renderiza el input adecuado (texto, número, select, o valor calculado de solo lectura).

2. Columnas calculadas ("computed"):
   - Evalúa la "formula" por CADA fila, tomando como variables los "id" de las columnas.
   - NO uses eval(). Usa un evaluador seguro de expresiones (expr-eval o mathjs, MIT).
     Pasa solo las variables autorizadas (los ids de columnas), convertidas a número.
   - Maneja errores y división por cero: si el resultado no es finito o la fórmula falla,
     muestra la celda vacía; nunca rompas la tabla.
   - Redondea a "decimals". El valor calculado es de solo lectura y NO se persiste:
     se recalcula siempre a partir de las demás columnas.

3. Selects dependientes (en cascada):
   - Una columna con "dependsOn" obtiene sus opciones de "optionsBy[valorDeLaColumnaPadre]".
   - Si el padre no tiene valor aún, el select dependiente va vacío/deshabilitado.
   - Al cambiar el valor del padre, LIMPIA en cascada los hijos cuyo valor ya no sea válido
     para el nuevo valor del padre (soporta cadenas de más de un nivel: área→proceso→subproceso).

4. Edición / agregar / eliminar:
   - Editar cualquier celda no calculada actualiza el estado de esa fila (inmutable).
   - "Agregar fila" crea una fila nueva con id único y valores por defecto vacíos.
   - "Eliminar fila" con confirmación.

5. Validación:
   - Respeta required, min, max por columna.
   - Marca visualmente las celdas inválidas y muestra un resumen; deshabilita "Guardar" si hay errores.

6. Guardado:
   - Expón un callback onSave(data) que devuelva el JSON completo (template + rows),
     sin incluir los valores de columnas computed.
   - [PERSISTENCIA: ajústalo — ver decisiones abajo]

## ESTÁNDARES TÉCNICOS
- React 18+ con componentes de función y Hooks. TypeScript en modo strict, sin "any".
- Tipa la plantilla, las columnas (unión discriminada por "type") y las filas.
- Estado inmutable; deriva los valores calculados en render (no los guardes en estado).
- Accesibilidad: usa <table> semántica, <label> en inputs, navegación por teclado,
  y nombres accesibles en botones (agregar/eliminar).
- Componentes pequeños y con una sola responsabilidad (tabla, fila, celda, barra de acciones).
- Incluye datos de ejemplo y un test básico con Vitest + React Testing Library
  (render, agregar fila, editar celda, recálculo de la columna computed, select dependiente).

## DECISIONES A CONFIRMAR (elige una opción en cada punto)
- Selects: [ react-select con búsqueda ]  |  [ <select> nativo simple ]
- Origen de opciones de selects dependientes: [ fijas en la plantilla (optionsBy) ]
  |  [ desde API por valor del padre (optionsSource) ]
- Persistencia: [ localStorage para prototipo ]  |  [ POST a API/Mongo ]
- Totales al pie (suma/promedio de columnas): [ sí, indica cuáles ]  |  [ no por ahora ]

## ENTREGABLES
- Componente(s) en TypeScript, tipados y comentados donde ayude.
- Ejemplo de uso con la plantilla de arriba.
- Instrucciones de instalación de dependencias (evaluador de fórmulas y, si aplica, react-select).
- Los tests indicados.

Sigue buenas prácticas de React y explica brevemente las decisiones de diseño relevantes.