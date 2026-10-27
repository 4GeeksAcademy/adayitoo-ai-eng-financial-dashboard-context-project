# Propuestas de mejora del dashboard

Propuestas derivadas de una revisión estática con las skills de accesibilidad y buenas prácticas de React. No se modificó el dashboard. No se ejecutaron Lighthouse, pruebas de teclado ni comprobaciones con lector de pantalla.

## Propuestas

1. **P1 — Distinguir margen cero de ausencia de datos.** En [profit-percent-chart.tsx](frontend/src/components/dashboard/profit-percent-chart.tsx#L65), `hasData` solo es verdadero si algún margen es distinto de cero. Un mes de equilibrio puede tener datos y margen `0%`, pero el gráfico lo presenta como vacío. Detectar si existen observaciones, no si el valor es distinto de cero.

2. **P1 — Evitar mostrar resultados de filtros anteriores.** Al cambiar los filtros, el hook activa la carga y mantiene los datos anteriores hasta que finalizan las solicitudes; si fallan, esos datos siguen visibles junto al error. Véase [use-dashboard-data.ts](frontend/src/hooks/use-dashboard-data.ts#L164). Limpiar los resultados al iniciar la consulta o indicar claramente que corresponden a los filtros anteriores.

3. **P1 — Añadir una alternativa textual a los gráficos.** Los gráficos de [ingresos y gastos](frontend/src/components/dashboard/income-outcome-chart.tsx#L79) y [margen](frontend/src/components/dashboard/profit-percent-chart.tsx#L80) no declaran una descripción de datos ni una tabla equivalente en su código. Proporcionar un resumen o tabla accesible y verificar con lector de pantalla y teclado qué expone Recharts.

4. **P2 — Usar encabezados semánticos para las secciones.** `CardTitle` se representa como un `div` en [card.tsx](frontend/src/components/ui/card.tsx#L31), así que los títulos de gráficos, tablas y filtros no forman una estructura navegable por encabezados. Usar niveles como `h2` para las secciones principales y `h3` cuando corresponda.

5. **P2 — Anunciar los cambios de carga.** Aunque las secciones usan `aria-busy`, no hay una región `aria-live` que anuncie la actualización de filtros o la finalización de la carga. Añadir un anuncio no intrusivo y conservar `role="alert"` para los errores.

6. **P2 — Unificar el idioma de la interfaz y su declaración.** El documento declara `lang="en"` en [index.html](frontend/index.html#L2), pero los filtros y algunos mensajes están en español mientras que los títulos y las métricas están en inglés. Unificar el idioma o etiquetar los fragmentos en el otro idioma para que el lector de pantalla los pronuncie correctamente.

7. **P2 — Reducir consultas al editar el umbral.** El campo actualiza el filtro en cada cambio en [facets-view.tsx](frontend/src/components/dashboard/facets-view.tsx#L69), y cada actualización dispara las cuatro solicitudes paralelas del hook. Considerar aplicar los filtros con un botón o retrasar la consulta del umbral hasta que termine la edición.

8. **P1 — Comprobar el uso completo con teclado.** Verificar que se pueda llegar a todos los controles con `Tab`, volver con `Mayús + Tab` y activarlos con `Enter` o la barra espaciadora, según corresponda. Asegurar que el foco sea visible y que no quede atrapado en ningún elemento.

9. **P1 — Revisar nombres y roles accesibles de los controles.** Comprobar que botones, filtros y campos tengan nombres que expliquen su función y que su tipo y estado se comuniquen correctamente a tecnologías de asistencia. Preferir controles HTML nativos y usar `aria-*` o `role` solo cuando haga falta.

10. **P2 — Revisar el texto alternativo de imágenes e íconos.** Añadir una descripción a las imágenes e íconos que transmitan información. Marcar como decorativos los que no aporten información, para que el lector de pantalla no los anuncie innecesariamente. Los botones que solo muestran un ícono deben tener un nombre accesible.

11. **P2 — Comprobar el contraste de textos y controles.** Verificar que el texto se distinga suficientemente del fondo y que los controles y sus indicadores de foco sean visibles. Como referencia WCAG AA, apuntar a un contraste mínimo de `4.5:1` para texto normal y `3:1` para texto grande y componentes visuales.

## Verificación posterior

La revisión de código confirma que las cuatro solicitudes ya se ejecutan en paralelo. No se recomienda añadir memoización para las agregaciones actuales sin medir primero su impacto. Para cerrar la auditoría de accesibilidad, comprobar la página renderizada con Lighthouse, navegación por teclado y lector de pantalla.

Durante la verificación manual, recorrer los controles con `Tab` y `Mayús + Tab`, activarlos con el teclado y confirmar que el foco siempre sea visible y no quede atrapado. Revisar los nombres y estados accesibles de los controles y medir el contraste de textos y componentes dudosos. Registrar qué se comprobó y qué queda pendiente; una herramienta automática por sí sola no garantiza que todo sea accesible.