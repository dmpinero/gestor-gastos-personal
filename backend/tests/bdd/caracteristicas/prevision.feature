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
