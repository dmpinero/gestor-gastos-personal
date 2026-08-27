# language: es
Característica: Exportación completa de datos
  Como persona usuaria de la aplicación
  Quiero poder exportar toda la información almacenada a un único Excel
  Para tener una copia de seguridad de mis cuentas, categorías y movimientos

  Escenario: Exportar los datos genera un Excel con una hoja por cada tabla
    Dado que existe la cuenta "ES00 1234"
    Y existe la categoría "Suscripciones" con la subcategoría "Streaming"
    Y existe un movimiento en esa cuenta y esa subcategoría con descripción "Netflix" e importe "-9.99"
    Cuando exporto todos los datos
    Entonces el Excel exportado contiene las hojas "Cuentas", "Categorías", "Subcategorías", "Movimientos", "Conceptos previstos" y "Ajustes mensuales"
    Y la hoja "Cuentas" del Excel exportado contiene la cuenta "ES00 1234"
    Y la hoja "Movimientos" del Excel exportado contiene un movimiento con descripción "Netflix"
