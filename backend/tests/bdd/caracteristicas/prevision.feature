# language: es
Característica: Resumen anual de previsión
  Como persona usuaria de la aplicación
  Quiero configurar conceptos previstos con su periodicidad e importe
  Para ver en el resumen anual lo real ya registrado y lo previsto para el resto de meses

  Escenario: El resumen anual combina el importe real de un mes con el previsto en los demás
    Dado que existe la categoría "Suscripciones" con un concepto previsto mensual de importe "-4.99"
    Y existe la cuenta "ES00 1234" con un movimiento en esa categoría en la fecha "2026-03-15" e importe "-4.99"
    Cuando consulto el resumen anual de 2026
    Entonces el concepto muestra el importe real "-4.99" en el mes 3
    Y el concepto muestra el importe previsto "-4.99" en el mes 4

  Escenario: Un ajuste manual en una celda tiene prioridad sobre el importe real y el previsto
    Dado que existe la categoría "Suscripciones" con un concepto previsto mensual de importe "-4.99"
    Y existe la cuenta "ES00 1234" con un movimiento en esa categoría en la fecha "2026-03-15" e importe "-4.99"
    Y se ajusta manualmente el importe del mes 3 de 2026 a "-1.00"
    Y se ajusta manualmente el importe del mes 4 de 2026 a "-2.00"
    Cuando consulto el resumen anual de 2026
    Entonces el concepto muestra el importe ajustado "-1.00" en el mes 3
    Y el concepto muestra el importe ajustado "-2.00" en el mes 4

  Escenario: Editar el Excel exportado y reimportarlo actualiza solo la celda cambiada
    Dado que existe la categoría "Suscripciones" con un concepto previsto mensual de importe "-4.99"
    Cuando exporto el Excel del resumen anual de 2026
    Y edito en el Excel exportado el importe del mes 1 a "-60.00"
    Y reimporto el Excel editado
    Y consulto el resumen anual de 2026
    Entonces la importación actualiza 1 celda
    Y el concepto muestra el importe ajustado "-60.00" en el mes 1

  Escenario: Exportar un rango de años y reimportar cambios en ambos actualiza cada año
    Dado que existe la categoría "Suscripciones" con un concepto previsto mensual de importe "-4.99"
    Cuando exporto el Excel del resumen anual de 2026 a 2027
    Y edito en el Excel exportado el importe del mes 1 de 2026 a "-60.00"
    Y edito en el Excel exportado el importe del mes 2 de 2027 a "-70.00"
    Y reimporto el Excel editado
    Entonces la importación actualiza 2 celdas

  Escenario: Importar un Excel de conceptos previstos crea categoría, subcategoría y concepto
    Cuando importo un Excel de conceptos previstos con la fila "Suscripciones" / "Streaming" / "mensual" / "-9.99"
    Entonces la importación de conceptos previstos crea 1 concepto
    Y la importación de conceptos previstos crea la categoría "Suscripciones"
    Y la importación de conceptos previstos crea la subcategoría "Streaming"

  Escenario: Reimportar el mismo Excel de conceptos previstos omite el concepto por duplicado
    Dado que ya se importó un Excel de conceptos previstos con la fila "Suscripciones" / "Streaming" / "mensual" / "-9.99"
    Cuando reimporto el mismo Excel de conceptos previstos
    Entonces la importación de conceptos previstos omite 1 concepto por duplicado

  Escenario: Una asociación hace que el resumen anual encuentre el importe real en otra categoría
    Dado que existe la categoría "Comida" con un concepto previsto mensual de importe "-200.00"
    Y existe la categoría "Alimentación" con un movimiento de "-150.00" en la fecha "2026-03-15"
    Cuando consulto el resumen anual de 2026
    Entonces el concepto muestra el importe previsto "-200.00" en el mes 3
    Cuando asocio la categoría "Comida" del resumen anual con la categoría "Alimentación" de movimientos
    Y consulto el resumen anual de 2026
    Entonces el concepto muestra el importe real "-150.00" en el mes 3

  Escenario: Una asociación por descripción hace que el resumen anual encuentre el importe real de un movimiento suelto
    Dado que existe la categoría "Impuestos" con un concepto previsto mensual de importe "-40.00"
    Y existe la categoría "Varios" con un movimiento de descripción "Recibo Ayuntamiento Las Rozas" e importe "-40.00" en la fecha "2026-03-15"
    Cuando consulto el resumen anual de 2026
    Entonces el concepto muestra el importe previsto "-40.00" en el mes 3
    Cuando asocio la categoría "Impuestos" del resumen anual con la descripción "Ayuntamiento Las Rozas" de movimientos
    Y consulto el resumen anual de 2026
    Entonces el concepto muestra el importe real "-40.00" en el mes 3

  Escenario: Cargar el acumulado real sobrescribe un ajuste manual existente
    Dado que existe la categoría "Suscripciones" con un concepto previsto mensual de importe "-4.99"
    Y existe la cuenta "ES00 1234" con un movimiento en esa categoría en la fecha "2026-03-15" e importe "-4.99"
    Y se ajusta manualmente el importe del mes 3 de 2026 a "-1.00"
    Cuando cargo el acumulado real del concepto en 2026
    Entonces la carga actualiza 1 mes
    Cuando consulto el resumen anual de 2026
    Entonces el concepto muestra el importe ajustado "-4.99" en el mes 3

  Escenario: Listar los movimientos de un concepto en un mes incluye los de categoría y los de descripción
    Dado que existe la categoría "Comida" con un concepto previsto mensual de importe "-200.00"
    Y existe la categoría "Alimentación" con un movimiento de "-150.00" en la fecha "2026-03-15"
    Y existe la categoría "Varios" con un movimiento de descripción "Reembolso comida trabajo" e importe "-25.00" en la fecha "2026-03-20"
    Cuando asocio la categoría "Comida" del resumen anual con la categoría "Alimentación" de movimientos
    Y asocio la categoría "Comida" del resumen anual con la descripción "comida trabajo" de movimientos
    Y listo los movimientos del concepto en el mes 3 de 2026
    Entonces se listan 2 movimientos

  Escenario: Editar una asociación existente cambia la categoría real usada por el resumen anual
    Dado que existe la categoría "Comida" con un concepto previsto mensual de importe "-200.00"
    Y existe la categoría "Alimentación" con un movimiento de "-150.00" en la fecha "2026-03-15"
    Cuando asocio la categoría "Comida" del resumen anual con la categoría "Alimentación" de movimientos
    Y consulto el resumen anual de 2026
    Entonces el concepto muestra el importe real "-150.00" en el mes 3
    Dado existe la categoría "Congelados" con un movimiento de "-90.00" en la fecha "2026-03-20"
    Cuando edito la asociación del resumen anual para usar la categoría "Congelados" de movimientos
    Y consulto el resumen anual de 2026
    Entonces el concepto muestra el importe real "-90.00" en el mes 3
