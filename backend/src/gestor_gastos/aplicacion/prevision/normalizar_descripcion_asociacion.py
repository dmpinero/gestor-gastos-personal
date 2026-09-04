def normalizar_descripcion_asociacion(descripcion: str) -> str:
    """Recorta espacios y colapsa espacios múltiples internos.

    Los movimientos importados de extractos bancarios a veces traen espacios
    dobles (p.ej. "SANITAS S A  DE SEGUROS"); sin esta normalización la
    asociación por descripción no encontraría esos movimientos.
    """
    return " ".join(descripcion.split())
