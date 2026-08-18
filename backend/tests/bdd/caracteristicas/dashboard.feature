# language: es
Característica: Resumen del panel principal
  Como persona usuaria de la aplicación
  Quiero ver un resumen de mis finanzas
  Para conocer mi situación económica de un vistazo

  Escenario: Consultar el resumen con cuentas y movimientos existentes
    Dado que existen la cuenta "ES00 1234" y la categoría "Alimentación"
    Y esa cuenta tiene un movimiento con importe "-20.00" y saldo "980.00"
    Y existe la categoría "Nómina"
    Y esa cuenta tiene un movimiento de la categoría "Nómina" con importe "1500.00" y saldo "2480.00"
    Cuando consulto el resumen del panel principal
    Entonces el saldo global es "2480.00"
    Y el gasto acumulado de la categoría "Alimentación" es "-20.00"
    Y el ingreso acumulado de la categoría "Nómina" es "1500.00"
