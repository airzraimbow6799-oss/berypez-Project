# F0-Q4 · Revisión del catálogo importado

**Responsable:** Rafael (QA) · **Fecha:** 2026-11-15 · **Rama revisada:** `main` (`82882e2`)

## Alcance y método

Se compara lo que Axel carga en Supabase (`data/catalog/catalog.json`) contra la copia de berypez.pe
de la que sale (`data/catalog/raw.json`, tomada el 2026-11-15 06:31 UTC con la API pública, solo lectura).

La comparación es automática y **no usa el código de importación de Axel**, para no repetir sus mismos errores:
[`tests/unit/catalog-integridad.test.ts`](../../tests/unit/catalog-integridad.test.ts) (18 pruebas, corren en `npm test` y
en la CI). El comportamiento en la carta se cubre con [`tests/e2e/carta.spec.ts`](../../tests/e2e/carta.spec.ts).

**Qué NO cubre todavía** (queda pendiente, ver el final):

- El contenido real de Supabase `berypez-dev` (necesita el `.env.local` de Axel).
- Una segunda lectura de berypez.pe en vivo para detectar cambios posteriores al snapshot.

## Resultado

| Criterio de F0-Q4                    | Resultado                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Cantidad de productos                | ✅ **107** (108 en berypez.pe menos 1 duplicado)                                                                    |
| 6 cartas                             | ✅ Marina 52 · Criolla 23 · Berycafé 19 · Piqueos 12 · El Bar 12 · Vegetariana 5 (un plato puede estar en 2 cartas) |
| Sin «(Copiar)»                       | ✅ El único omitido es `Ceviche de conchas negras (Copiar)` (id 2353)                                               |
| Sin «Nov 24»                         | ✅ La sección «Nov 24» no existe; tampoco «Sin categorizar»                                                         |
| Sin productos sin carta ni categoría | ✅ Los 107 están en alguna carta y en una sección existente; no hay secciones vacías                                |
| Precios                              | ✅ Los 107 coinciden con berypez.pe; todos entre S/ 3 y S/ 200                                                      |
| Variantes                            | ✅ Las 76 variantes coinciden en cantidad, precio y stock                                                           |
| Fotos                                | ⚠️ 106 de 107 (falta **Dúo vegetariano**); los 106 archivos existen en `public/catalog` y tienen texto alternativo  |
| Textos                               | ✅ Sin caracteres rotos, HTML ni entidades; sin espacios sobrantes ni descripciones vacías                          |

## Hallazgos

Para abrirlos en GitHub con las etiquetas `bug`, `fase-1` y la severidad indicada.

### QA-001 · El filtro «Sin picante» no oculta ningún plato — severidad **alta**

- **Pasos:** abrir `/carta/marina` → tocar el filtro «Sin picante».
- **Esperado:** desaparecen los platos picantes.
- **Real:** se muestran los mismos 52 platos. El filtro solo quita productos con la etiqueta `picante`, y **ninguno de los 107 la tiene**
  (hay 13 etiquetados en total: 6 «compartir», 5 «vegetariano», 2 «niños»; 0 «picante»).
- **Por qué importa:** quien pide «sin picante» (niños, personas mayores) sigue viendo ceviches con ají limo y rocoto
  (por ejemplo: Ceviche al rojo vivo, Ceviche Berypez, Tiradito de pescado). Es un filtro que promete algo que no cumple.
- **Causa probable:** F1-04 (etiquetas `tags`, `allergens`, `portion`) está pendiente; el filtro ya existe pero no hay datos.
- **Prueba:** `tests/e2e/carta.spec.ts` · «el filtro “Sin picante” oculta los platos picantes». Está marcada `test.fail`: pasa mientras el
  bug exista y avisa sola cuando se corrija (entonces se quita la anotación).
- **Para cerrar:** etiquetar los platos picantes (la dueña debe confirmar cuáles) o esconder el filtro hasta tener los datos.

### QA-002 · Dos platos con el mismo nombre «Arroz con mariscos» — severidad **media**

- **Dónde:** Carta Marina. Id 288 (sección Arroces, S/ 42.00, individual) e id 332 (sección Fuentes, S/ 80.00 la media fuente y S/ 155.00 la fuente).
- **Real:** en el buscador y en la carta aparecen dos tarjetas con el mismo título. El id 332 tiene como descripción solo «Arroz con mariscos».
- **Esperado:** poder distinguirlas sin abrirlas.
- **Sugerencia:** renombrar la segunda («Arroz con mariscos · fuente») y darle una descripción. Es un dato que viene así de berypez.pe: decisión de la dueña o de Axel.
- **Prueba:** `catalog-integridad.test.ts` lista los nombres repetidos conocidos; si aparece otro, falla.

### QA-003 · «Dúo vegetariano» no tiene foto — severidad **media**

- **Real:** la tarjeta muestra «Foto próximamente». Axel ya lo sabe (106 fotos en su README).
- **Para cerrar:** pedir la foto a la dueña. La prueba lista este producto como excepción conocida; si se agrega la foto o falta otra, avisa.

### QA-004 · Alérgenos y porciones vacíos en todo el catálogo — severidad **media**

- **Real:** 0 de 107 productos tienen `allergens` y 0 tienen `portion`. Hoy la web no muestra alérgenos, y es un dato que un restaurante
  de mariscos debería poder dar. También hay pocas etiquetas de «Para niños» (2) y «Vegetariano» (5), así que esos filtros devuelven pocos platos.
- **Para cerrar:** F1-04 (Axel) con los datos que confirme la dueña. Mientras tanto, definir con ella si la demo muestra alérgenos.

### Observación (no es bug)

- La **Carta Vegetariana tiene solo 5 platos**. Confirmar con la dueña que es lo esperado.

## Pendiente de F0-Q4

1. **Supabase real:** con el `.env.local` de `berypez-dev`, contar productos, variantes y fotos en la base y en Storage y compararlos con
   `catalog.json` (la prueba de arriba revisa el archivo, no la base).
2. **Frescura:** volver a leer berypez.pe (una sola vez, solo lectura, como indica el README) y comparar con el snapshot por si la dueña cambió precios.
3. **Muestra manual de 20 platos** (F1-Q4): nombre, precio, variantes y foto en el celular, contra Supabase.
