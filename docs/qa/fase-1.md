# Casos de prueba · Fase 1 · Portada y carta digital

**Responsable:** Rafael (QA) · **Tareas:** F0-Q3 (casos), F1-Q1 a F1-Q4 (ejecución) · **Versión:** 1.0 · 2026-11-15

**Cómo leer las tablas:** _Auto_ = ya cubierto por Playwright (`tests/e2e/`); 🔜 = por automatizar; «—» = solo manual.
_Sev._ es la severidad si el caso falla (ver [plan de pruebas](plan-de-pruebas.md#5-severidades)).
_Resultado_: ☐ sin ejecutar · ✅ pasa · ❌ falla (con el número del issue) · ⚠️ pasa con observación.

**Dónde ejecutar:** preview de Vercel (o `localhost:3100`). Dispositivos: Android gama media, iPhone, tablet y escritorio.

## 1. Portada

| ID   | Caso                       | Pasos                                                                                    | Resultado esperado                                                                                | Sev.  | Auto                      | Resultado |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----- | ------------------------- | --------- |
| P-01 | La portada carga           | Abrir `/`.                                                                               | Responde 200, título «Inicio \| Berypez», un `h1` visible y sin errores de JavaScript.            | Alto  | ✅                        | ☐         |
| P-02 | Llamadas a la acción       | Tocar «Pedir ahora», «Reservar» y «Ver carta».                                           | Cada una lleva a su pantalla (carta/carrito, `/reservas`, `/carta/marina`).                       | Alto  | 🔜                        | ☐         |
| P-03 | Video de presentación      | Ver la portada con datos normales; luego con «reducir movimiento» y con ahorro de datos. | Con movimiento reducido o ahorro de datos **no** se carga el video; hay botón de pausa.           | Medio | —                         | ☐         |
| P-04 | Plato estrella y chips     | Revisar plato estrella, tiempo, precio «desde» y medios de pago.                         | Datos correctos y coherentes con la carta; los medios de pago no prometen lo no hecho.            | Medio | —                         | ☐         |
| P-05 | Accesos a las 6 cartas     | Tocar cada una de las 6 cartas.                                                          | Abre la carta correcta (`marina`, `criolla`, `berycafe`, `piqueos`, `el-bar`, `vegetariana`).     | Alto  | 🔜 (las URL ya responden) | ☐         |
| P-06 | Sedes, mapa y horarios     | Ir a «Sedes»; abrir «Cómo llegar» y los teléfonos de Lince y Jesús María.                | Dirección, mapa, teléfono y WhatsApp de **cada** sede son los correctos.                          | Alto  | —                         | ☐         |
| P-07 | Selector de sede/modalidad | En el header, elegir Delivery, Recojo Lince y Recojo Jesús María; recargar la página.    | El cambio se refleja en la portada y se recuerda en la sesión.                                    | Medio | 🔜                        | ☐         |
| P-08 | Barra inferior (móvil)     | En 375 px, usar la barra inferior.                                                       | Visible, no tapa contenido ni el botón de agregar; objetivos táctiles ≥ 44 px.                    | Medio | —                         | ☐         |
| P-09 | Sin scroll horizontal      | Abrir `/` en 375 px y 1440 px.                                                           | No hay desborde horizontal.                                                                       | Medio | ✅                        | ☐         |
| P-10 | Animación de carga         | Navegar entre páginas con red lenta (3G).                                                | Aparecen los peces del logo, no bloquean la navegación y no marean (respeta movimiento reducido). | Bajo  | —                         | ☐         |

## 2. Carta (`/carta/[slug]`)

| ID   | Caso                              | Pasos                                                                        | Resultado esperado                                                                                 | Sev.  | Auto                      | Resultado |
| ---- | --------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----- | ------------------------- | --------- |
| C-01 | Cambiar entre cartas              | Desde cualquier carta, cambiar de pestaña a las otras 5.                     | Cambia sin errores y el título de la pestaña del navegador dice la carta.                          | Alto  | 🔜 (las URL ya responden) | ☐         |
| C-02 | Cuadrícula responsiva             | Ver la carta en 375, 768 y 1440 px.                                          | 2 columnas en móvil, 3 en tablet, 4 en escritorio; sin carruseles.                                 | Medio | 🔜                        | ☐         |
| C-03 | Barra de secciones                | Tocar una sección; hacer scroll.                                             | Baja a la sección, resalta la actual (scroll-spy) y **la página no salta**.                        | Medio | —                         | ☐         |
| C-04 | Búsqueda «seviche»                | Escribir `seviche` en «Buscar en la carta».                                  | Aparecen ceviches y un contador «N platos encontrados».                                            | Alto  | ✅                        | ☐         |
| C-05 | Búsqueda sin tildes ni mayúsculas | Escribir `CEVICHE` y luego `ceviche`; probar `chicharron`, `aji de gallina`. | Mismo resultado con o sin tilde o mayúsculas.                                                      | Medio | ✅ (mayúsculas)           | ☐         |
| C-06 | Búsqueda sin resultados           | Escribir `zzzz` y tocar «Quitar filtros».                                    | Mensaje claro; «Quitar filtros» devuelve toda la carta.                                            | Medio | ✅                        | ☐         |
| C-07 | Filtro «Hasta S/ 40»              | Activarlo y desactivarlo.                                                    | Reduce los platos, el chip muestra el check y el contador coincide con las tarjetas.               | Medio | ✅                        | ☐         |
| C-08 | Filtro «Sin picante»              | Activarlo en la carta Marina.                                                | Desaparecen los platos picantes. **Hoy no oculta nada (QA-001).**                                  | Alto  | ✅ (fallo esperado)       | ❌ QA-001 |
| C-09 | Filtros combinados                | Activar «Vegetariano» + «Para niños» + «Hasta S/ 40» + una búsqueda.         | Resultados coherentes con todos los filtros; si no hay, mensaje claro.                             | Medio | —                         | ☐         |
| C-10 | Vista rápida con variantes        | Abrir «Sudados»; elegir pescado y tipo.                                      | Se muestra «Elige tu pescado», el precio cambia en vivo y «Agregar» se habilita solo al completar. | Alto  | ✅                        | ☐         |
| C-11 | Elecciones obligatorias           | Abrir un plato con acompañamientos; intentar agregar sin elegir.             | Botón deshabilitado y texto «Falta: …» que dice qué falta.                                         | Alto  | ✅                        | ☐         |
| C-12 | Cantidad y nota para cocina       | Subir/bajar la cantidad; escribir una nota de 200+ caracteres.               | El total se multiplica; la nota se corta en 200.                                                   | Medio | ✅ (cantidad)             | ☐         |
| C-13 | Plato agotado                     | Buscar un plato con `isAvailable = false` (editar uno en `berypez-dev`).     | Insignia «Agotado», tarjeta atenuada y botón «+» deshabilitado.                                    | Alto  | —                         | ☐         |
| C-14 | Plato sin foto                    | Abrir «Dúo vegetariano».                                                     | Muestra «Foto próximamente» sin romper la tarjeta (QA-003).                                        | Bajo  | —                         | ☐         |
| C-15 | Foco en la vista rápida           | Abrir con teclado; Tab dentro; Escape.                                       | El foco queda dentro de la ventana, Escape la cierra y el foco vuelve a la tarjeta.                | Alto  | ✅ (Escape)               | ☐         |
| C-16 | Agregar con un toque              | Tocar «+» en un plato sin variantes.                                         | Aviso «Agregaste …» con enlace «Ver carrito»; el contador del header sube.                         | Alto  | ✅                        | ☐         |
| C-17 | Búsqueda global                   | Ir a `/buscar`, escribir `seviche`.                                          | Devuelve ceviches de todas las cartas.                                                             | Medio | 🔜                        | ☐         |
| C-18 | Cartas con pocos platos           | Abrir `vegetariana` (5 platos) y `el-bar`.                                   | Se ve completa y bien armada, sin huecos raros.                                                    | Bajo  | —                         | ☐         |

## 3. Accesibilidad (F1-Q2)

| ID   | Caso                | Pasos                                                                   | Resultado esperado                                                                                     | Sev.  | Resultado |
| ---- | ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----- | --------- |
| A-01 | Solo teclado        | Recorrer portada y carta con Tab, Shift+Tab, Enter y Espacio.           | Todo se alcanza y se opera; el foco siempre es visible; no hay trampas de foco.                        | Alto  | ☐         |
| A-02 | Lector de pantalla  | TalkBack (Android) y VoiceOver (iPhone): carta, filtros y vista rápida. | Los botones «+» dicen qué plato agregan; los filtros dicen si están activados; el contador se anuncia. | Alto  | ☐         |
| A-03 | Zoom al 200 %       | Ampliar a 200 % en escritorio y fuente grande en el celular.            | Sin texto cortado ni controles tapados; no hay scroll horizontal.                                      | Alto  | ☐         |
| A-04 | Movimiento reducido | Activar «reducir movimiento» del sistema.                               | Sin video automático, ni animaciones de entrada ni zoom en hover.                                      | Medio | ☐         |
| A-05 | Contraste y tamaño  | Revisar textos pequeños, etiquetas y botones con axe y a ojo.           | Contraste AA; objetivos táctiles ≥ 44 px; base de texto cómoda (18 px).                                | Medio | ☐         |
| A-06 | Persona mayor       | Una persona de 60+ años busca un ceviche y lo agrega, sin ayuda.        | Lo logra sin pedir ayuda; anotar dudas y textos confusos.                                              | Medio | ☐         |

## 4. Medición (F1-Q3) y exactitud de datos (F1-Q4)

| ID   | Caso                               | Pasos                                                                                            | Criterio de aceptación                                                | Resultado |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------- |
| M-01 | Lighthouse móvil                   | `/` y `/carta/marina` en el preview (4G simulado).                                               | Rendimiento ≥ 85 y accesibilidad ≥ 95.                                | ☐         |
| M-02 | LCP                                | Medir LCP en ambas páginas.                                                                      | < 2.5 s.                                                              | ☐         |
| M-03 | Nodos del DOM                      | `document.querySelectorAll('*').length` en `/carta/marina`.                                      | < 1 000 (la carta Marina tiene 52 platos).                            | ☐         |
| M-04 | Productos duplicados o sin sección | Recorrer las 6 cartas.                                                                           | Ninguno duplicado ni sin sección (excepto QA-002, nombres repetidos). | ☐         |
| D-01 | Muestra de 20 platos               | Elegir 20 platos al azar: nombre, precio, variantes y foto, contra Supabase y contra berypez.pe. | 20 de 20 coinciden. Ver [F0-Q4](f0-q4-catalogo.md).                   | ☐         |

## 5. Dependencias

- **Datos de la dueña:** horarios, teléfonos y fotos definitivos (P-06, C-14).
- **Axel:** F1-04 (etiquetas y alérgenos) para cerrar C-08 y C-09; F1-12 (animaciones) para A-04.
