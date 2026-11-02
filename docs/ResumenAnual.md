# Resumen anual

Explicación completa, en detalle, de la opción de menú **Resumen anual**:
qué es, para qué sirve y cómo funciona cada una de sus partes.

## 1. Qué es y qué problema resuelve

Es la pantalla de **planificación presupuestaria** de la aplicación: a
diferencia de Movimientos o Historial (que solo muestran lo que ya ha
pasado), aquí se define de antemano qué se espera gastar o ingresar cada
mes del año — alquiler, nómina, suscripciones, impuestos, seguros...— y la
propia aplicación contrasta automáticamente esa previsión con los
movimientos reales que ya existan en esa categoría.

El resultado es una tabla tipo hoja de cálculo —una fila por concepto, una
columna por cada uno de los 12 meses— donde cada celda "se rellena sola"
con el dato más fiable disponible en cada momento: lo real si ya hay
movimientos registrados ese mes, o una estimación si todavía no los hay,
con la posibilidad de forzar manualmente cualquier celda cuando haga falta.

## 2. La tabla: cómo se calcula cada celda

Este es el corazón de la funcionalidad. Para cada concepto y cada mes, el
importe que se muestra se decide en este orden de prioridad, de mayor a
menor:

1. **Ajustado** (borde inferior punteado en ámbar): un valor que el propio
   usuario ha fijado a mano para esa celda concreta, pulsando directamente
   sobre ella. Tiene prioridad absoluta: aunque luego aparezcan movimientos
   reales ese mes, el ajuste manual sigue mandando hasta que se borre o se
   sobrescriba explícitamente.
2. **Real**: si no hay un ajuste manual pero sí hay movimientos reales de
   esa categoría (o de una categoría "asociada" a ella, ver más abajo) ese
   mes, se suman automáticamente sus importes.
3. **Previsto** (texto en cursiva y más tenue): si no hay ni ajuste ni
   movimientos reales todavía, se usa el importe previsto del concepto
   como simple estimación. Si además ese mes todavía no ha llegado (es
   futuro respecto a hoy), la celda se resalta con un fondo azul claro
   para distinguir "previsión de lo que viene" de "previsión de un mes ya
   pasado que aún no se ha conciliado con movimientos reales".
4. Si un concepto no es mensual (por ejemplo, trimestral) y un mes
   concreto no le corresponde según su periodicidad, y tampoco hay nada
   real ni ajustado ese mes, la celda simplemente se muestra vacía (0).

En resumen: **ajustado > real > previsto**, siempre en ese orden.

### Editar una celda a mano

Basta con hacer clic sobre el importe de cualquier celda para convertirla
en un campo de texto editable:

- Pulsar **Intro**, o simplemente hacer clic fuera, confirma el nuevo
  valor.
- Pulsar **Escape** cancela la edición sin guardar nada.
- Dejar el campo **vacío** y confirmar no pone la celda a cero: elimina el
  ajuste manual, de modo que la celda vuelve a calcularse sola (real o
  previsto, según corresponda).

### Ver qué movimientos hay detrás de una celda

Al pasar el ratón (o el foco del teclado) por encima de una celda con
importe real, aparece un pequeño icono de ojo y un tooltip:

- El **tooltip** muestra, si hay un único movimiento, su comentario (o su
  descripción si no tiene comentario); si hay varios, una línea por cada
  uno.
- El **icono de ojo** abre una ventana con el listado completo de esos
  movimientos, desde la que incluso se puede editar alguno (por ejemplo,
  cambiarle la categoría) sin salir de la pantalla. Si se edita un
  movimiento desde ahí, toda la tabla se refresca para reflejar el cambio.

Las celdas que son solo "previsto", o que valen exactamente 0, no muestran
este icono porque no hay nada real que inspeccionar.

### Pasar el ratón por el nombre de un concepto

Muestra un pequeño resumen con dos cifras del año completo:

- **Saldo del año (previsto)**: la suma de las 12 celdas tal y como se
  ven, incluyendo los meses que todavía son solo una estimación.
- **Saldo del año (actual)**: la suma solo de los meses que ya tienen un
  valor confirmado (real o ajustado), es decir, lo que ya es seguro a día
  de hoy, sin contar lo que aún está por confirmar.

## 3. Asociar conceptos: cuando "lo previsto" y "lo real" no coinciden

Un concepto previsto se crea con una categoría propia (por ejemplo,
"Comida"), pero los movimientos reales del día a día pueden estar
guardados con una categoría distinta (por ejemplo, "Alimentación") o no
tener categoría propia en absoluto (un recibo suelto con su propio
nombre). Para que la aplicación sepa relacionar ambas cosas existen dos
mecanismos, que se configuran desde **Gestión → Asociar conceptos** (el
botón "Asociar conceptos" de esta misma pantalla lleva directamente ahí):

- **Asociar por categoría**: "la categoría 'Comida' del resumen anual es,
  en realidad, la categoría 'Alimentación' de los movimientos". A partir
  de ese momento, la aplicación busca el importe real de ese concepto en
  la categoría asociada, no en la suya propia. Solo puede haber una
  asociación por cada categoría/subcategoría del resumen.
- **Asociar por descripción**: "cualquier movimiento cuya descripción
  contenga 'Ayuntamiento Las Rozas' cuenta también como real del concepto
  'Impuestos'", sin necesidad de que comparta categoría con nada más. Su
  importe se suma al de la categoría asociada si la hay, sin contar dos
  veces un mismo movimiento que cumpla ambas condiciones a la vez.

Gracias a esto, un concepto que al crearlo mostraba solo previsión pasa a
mostrar importes reales en cuanto se configura su asociación, sin tener
que tocar el concepto ni los movimientos en sí. Esta misma relación es la
que hace que, al navegar por una categoría desde Historial, también
aparezcan los movimientos que un concepto del resumen anual ha "adoptado"
mediante una asociación.

## 4. Controles de la pantalla

### Año

Un campo numérico. Cambiarlo recarga automáticamente toda la tabla con los
datos de ese año; no hace falta pulsar ningún botón aparte.

### Destacar mes

Un desplegable con los 12 meses (y la opción "Ninguno"). Sombrea en gris la
columna del mes elegido en toda la tabla —cabecera, celdas y fila de
totales— para poder centrarse visualmente en los gastos de un mes concreto
sin perder de vista el resto.

### Buscar

Un buscador que filtra las filas visibles por nombre del concepto,
categoría o subcategoría, a medida que se escribe. La fila de totales se
recalcula siempre sobre lo que realmente se está viendo filtrado, para que
nunca "no cuadre" con las filas visibles.

### Agrupar por categoría

Alterna entre dos formas de ver la misma información:

- **Todos los conceptos juntos**, una tabla plana con todas las filas.
- **Agrupado por categoría**: un bloque colapsable por cada categoría, con
  su propio subtotal mensual y su total anual; se puede desplegar o
  plegar cada categoría por separado haciendo clic sobre ella.

Dentro de cada categoría desplegada, las filas se comportan exactamente
igual que en la vista plana (se pueden editar celdas, ver movimientos,
etc.).

### Asociar conceptos

Lleva directamente a la pantalla donde se configuran las asociaciones por
categoría y por descripción explicadas en el punto 3.

### Importar Excel / Exportar a Excel

Pensado para el flujo "exportar a Excel → editar los importes fuera de la
aplicación (a mano o con fórmulas) → volver a importarlo":

- **Exportar** genera un fichero Excel con el resumen de uno o varios
  años seguidos (se elige "año desde" y "año hasta"). En el Excel, las
  celdas que son solo previsión aparecen en cursiva y las que son un
  ajuste manual, con un fondo amarillo suave, para distinguirlas a simple
  vista igual que en la pantalla.
- **Importar** solo actualiza las celdas cuyo importe en el Excel sea
  distinto del que ya hay en la aplicación. Volver a subir el mismo
  fichero sin cambiar nada no tiene ningún efecto. Dejar una celda vacía
  en el Excel equivale a borrar su ajuste manual (si lo tenía) para que
  vuelva a calcularse sola. Al terminar, se informa de cuántas celdas se
  han actualizado, cuántas se han revertido a su valor calculado, y
  cuántas filas del fichero correspondían a conceptos que ya no existen
  (y que, por tanto, se han ignorado).
- Cada fila del Excel lleva su propio año, así que un mismo fichero puede
  traer cambios de varios años distintos a la vez si se exportó un rango.

Nota: este importador es distinto del que sirve para dar de alta muchos
conceptos nuevos de golpe desde un Excel (ese otro vive en la pantalla
general de Importar, no aquí): el de esta pantalla nunca crea conceptos
nuevos, solo actualiza celdas de los que ya existen.

### Cargar acumulado real (todos los conceptos)

El botón del icono de recarga circular, junto a los de importar/exportar.
Pide confirmación antes de actuar porque es una operación que puede
afectar a muchos datos a la vez: para **todos** los conceptos y **todos**
los meses del año en curso que tengan movimientos reales asociados,
sobrescribe cualquier ajuste manual existente con el importe real
acumulado de esos movimientos. Los meses que no tienen movimientos
asociados no se tocan en absoluto. Si no hay nada que actualizar en ningún
concepto, se avisa de ello en vez de no hacer nada en silencio.

### Añadir concepto

Ver el punto 5.

## 5. Dar de alta o editar un concepto previsto

El formulario pide:

- **Categoría / Subcategoría**: con buscador, y un botón "+" para crear
  una categoría o subcategoría nueva sin salir del formulario.
- **Periodicidad**: Mensual, Trimestral, Semestral o Anual.
- **Mes de inicio**: solo aparece si la periodicidad no es mensual (por
  ejemplo, un seguro semestral que se paga en marzo y septiembre). Si se
  deja en blanco, se asume que empieza en enero.
- **Tipo**: Gasto o Ingreso. Decide en qué tabla aparecerá el concepto (la
  de Gastos o la de Ingresos).
- **Importe previsto**: siempre se introduce en positivo; es el Tipo
  elegido el que determina si se trata como gasto o como ingreso.

El desplegable de categorías se adapta al Tipo elegido, pero de forma
flexible: una categoría solo se oculta de la lista de "Gasto" si ya consta
que **solo** tiene movimientos de ingreso (y viceversa); una categoría sin
histórico todavía, o con movimientos de ambos tipos, se ofrece siempre.
Así, cambiar el Tipo después de haber elegido la categoría no hace que
esta desaparezca del formulario.

Desde la fila de cada concepto, en la propia tabla, se puede también:

- **Editar** el concepto (abre el mismo formulario relleno con sus datos
  actuales).
- **Eliminar** el concepto por completo.
- **Cargar su acumulado real**: la misma operación explicada en el punto
  4, pero limitada a ese único concepto.

## 6. Marcar un concepto como "Cancelado"

Debajo del nombre de cada concepto hay una casilla **Cancelado**. Al
marcarla, esa fila se muestra tachada —**solo para el año que se está
viendo en ese momento**—, útil para señalar visualmente una suscripción o
un gasto que ya no está vigente sin perder su histórico en años
anteriores. Si se cambia de año, esa misma fila puede estar cancelada en
2026 y no estarlo en 2027 (o al revés): son marcas completamente
independientes por año, no afectan al resto de años del mismo concepto. La
fila cancelada sigue contando con normalidad en los totales de ese mes: no
se oculta ni se excluye de ningún cálculo, es puramente una señal visual.

## 7. Resumen de todo lo que se puede hacer en esta pantalla

- Elegir el año que se quiere ver y, opcionalmente, destacar un mes
  concreto.
- Buscar conceptos por nombre, categoría o subcategoría.
- Alternar entre ver todos los conceptos juntos o agrupados por
  categoría.
- Dar de alta, editar o eliminar conceptos previstos (con su categoría,
  subcategoría, periodicidad, mes de inicio, tipo e importe).
- Asociar un concepto con la categoría o con descripciones reales de los
  movimientos, para que el importe real se calcule solo.
- Ajustar manualmente el importe de cualquier celda, o borrar ese ajuste.
- Consultar, celda a celda, qué movimientos reales la componen, y
  editarlos sin salir de la pantalla.
- Marcar un concepto como cancelado para un año concreto.
- Cargar el acumulado real sobre los ajustes existentes, de un concepto o
  de todos a la vez.
- Exportar el resumen (de uno o varios años) a Excel, y volver a
  importarlo tras editarlo, actualizando solo lo que haya cambiado.
