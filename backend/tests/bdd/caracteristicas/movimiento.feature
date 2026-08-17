# language: es
Característica: Gestión de movimientos
  Como persona usuaria de la aplicación
  Quiero registrar y consultar los movimientos de mis cuentas
  Para llevar el control de mis gastos e ingresos

  Escenario: Alta correcta de un movimiento de cargo
    Dado que existen la cuenta "ES00 1234" y la categoría "Alimentación"
    Cuando creo un movimiento en esa cuenta con importe "-20.31" y saldo "3636.54"
    Entonces el movimiento aparece en el listado de movimientos de esa cuenta

  Escenario: Los movimientos se listan del más reciente al más antiguo
    Dado que existen la cuenta "ES00 1234" y la categoría "Alimentación"
    Y esa cuenta tiene un movimiento en la fecha "2026-01-01"
    Y esa cuenta tiene un movimiento en la fecha "2026-01-15"
    Cuando consulto el listado de movimientos de esa cuenta
    Entonces el primero de la lista es el de la fecha "2026-01-15"
