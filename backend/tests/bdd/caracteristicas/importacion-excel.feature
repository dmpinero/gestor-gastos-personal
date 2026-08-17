# language: es
Característica: Importación de movimientos desde Excel
  Como persona usuaria de la aplicación
  Quiero importar un extracto bancario en Excel
  Para no introducir los movimientos uno a uno

  Escenario: Importación correcta de un fichero nuevo
    Dado un fichero Excel de movimientos válido
    Cuando lo importo
    Entonces el resumen indica que se importaron 5 movimientos
    Y se ha creado la cuenta del fichero

  Escenario: Reimportar el mismo fichero no duplica movimientos
    Dado un fichero Excel de movimientos válido ya importado previamente
    Cuando lo importo de nuevo
    Entonces el resumen indica que se omitieron 5 movimientos por duplicado

  Escenario: Extensión de fichero no soportada
    Dado un fichero con extensión ".csv"
    Cuando lo importo
    Entonces la API rechaza el fichero con un error de validación
