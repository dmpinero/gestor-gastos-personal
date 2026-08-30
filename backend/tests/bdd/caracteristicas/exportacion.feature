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
    Entonces el Excel exportado contiene las hojas "Cuentas", "Categorías", "Subcategorías", "Movimientos", "Conceptos previstos", "Ajustes mensuales", "Asociaciones" y "Asociaciones por descripción"
    Y la hoja "Cuentas" del Excel exportado contiene la cuenta "ES00 1234"
    Y la hoja "Movimientos" del Excel exportado contiene un movimiento con descripción "Netflix"

  Escenario: Importar un backup sustituye todos los datos existentes por los del Excel
    Dado que existe la cuenta "ES00 1234"
    Y existe la categoría "Suscripciones" con la subcategoría "Streaming"
    Y existe un movimiento en esa cuenta y esa subcategoría con descripción "Netflix" e importe "-9.99"
    Y he exportado todos los datos
    Y existe la cuenta "ES00 9999"
    Cuando importo el backup exportado
    Entonces la restauración importa 1 cuenta, 1 categoría y 1 movimiento
    Y solo existe la cuenta "ES00 1234"
