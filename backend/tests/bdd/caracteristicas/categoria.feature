# language: es
Característica: Gestión de categorías y subcategorías
  Como persona usuaria de la aplicación
  Quiero organizar mis categorías en una jerarquía
  Para clasificar mejor mis movimientos

  Escenario: Alta correcta de una categoría
    Dado que no existe la categoría "Alimentación"
    Cuando creo una categoría con nombre "Alimentación"
    Entonces la categoría aparece en el listado de categorías

  Escenario: Alta de una subcategoría bajo una categoría existente
    Dado que existe la categoría "Ocio y viajes"
    Cuando creo la subcategoría "Cafeterías y restaurantes" en esa categoría
    Entonces la subcategoría aparece bajo "Ocio y viajes" en el listado jerárquico
