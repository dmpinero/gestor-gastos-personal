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
    Y reimporto el Excel editado para el resumen anual de 2026
    Y consulto el resumen anual de 2026
    Entonces la importación actualiza 1 celda
    Y el concepto muestra el importe ajustado "-60.00" en el mes 1

  Escenario: Importar un Excel de conceptos previstos crea categoría, subcategoría y concepto
    Cuando importo un Excel de conceptos previstos con la fila "Suscripciones" / "Streaming" / "mensual" / "-9.99"
    Entonces la importación de conceptos previstos crea 1 concepto
    Y la importación de conceptos previstos crea la categoría "Suscripciones"
    Y la importación de conceptos previstos crea la subcategoría "Streaming"

  Escenario: Reimportar el mismo Excel de conceptos previstos omite el concepto por duplicado
    Dado que ya se importó un Excel de conceptos previstos con la fila "Suscripciones" / "Streaming" / "mensual" / "-9.99"
    Cuando reimporto el mismo Excel de conceptos previstos
    Entonces la importación de conceptos previstos omite 1 concepto por duplicado
