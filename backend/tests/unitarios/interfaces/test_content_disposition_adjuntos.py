from gestor_gastos.interfaces.api.v1.enrutadores.adjuntos import _content_disposition_inline


def test_nombre_solo_ascii_usa_filename_simple() -> None:
    cabecera = _content_disposition_inline("factura.pdf")

    assert cabecera == 'inline; filename="factura.pdf"'


def test_nombre_con_caracteres_no_ascii_usa_filename_extendido_rfc5987() -> None:
    # "€" no es representable en latin-1, la codificación de las cabeceras
    # HTTP: construir aquí un `filename="..."` literal hace que Starlette
    # lance un UnicodeEncodeError al enviar la respuesta (bug original).
    cabecera = _content_disposition_inline("20261010 Mercadona 20,56 €.pdf")

    assert cabecera == "inline; filename*=utf-8''20261010%20Mercadona%2020%2C56%20%E2%82%AC.pdf"
    cabecera.encode("latin-1")
