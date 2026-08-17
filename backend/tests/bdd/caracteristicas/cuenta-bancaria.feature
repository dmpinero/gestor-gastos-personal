# language: es
Característica: Gestión de cuentas bancarias
  Como persona usuaria de la aplicación
  Quiero dar de alta y consultar mis cuentas bancarias
  Para poder asociarles movimientos

  Escenario: Alta correcta de una cuenta
    Dado que no existe ninguna cuenta con número "ES00 1234"
    Cuando creo una cuenta bancaria con ese número
    Entonces la cuenta aparece en el listado de cuentas

  Escenario: No se permite un número de cuenta duplicado
    Dado que ya existe una cuenta con número "ES00 1234"
    Cuando intento crear otra cuenta con el mismo número
    Entonces la API rechaza la operación con un conflicto
