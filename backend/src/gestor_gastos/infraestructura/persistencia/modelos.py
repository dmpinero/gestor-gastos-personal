import datetime
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gestor_gastos.infraestructura.persistencia.sesion import Base


class CuentaBancariaModelo(Base):
    __tablename__ = "cuentas_bancarias"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_cuenta: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    alias: Mapped[str | None] = mapped_column(String(120))
    entidad_bancaria: Mapped[str | None] = mapped_column(String(120))
    moneda: Mapped[str | None] = mapped_column(String(10))
    titular: Mapped[str | None] = mapped_column(String(200))

    movimientos: Mapped[list["MovimientoModelo"]] = relationship(back_populates="cuenta")


class CategoriaModelo(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True, index=True)

    subcategorias: Mapped[list["SubcategoriaModelo"]] = relationship(back_populates="categoria")
    movimientos: Mapped[list["MovimientoModelo"]] = relationship(back_populates="categoria")


class SubcategoriaModelo(Base):
    __tablename__ = "subcategorias"
    __table_args__ = (UniqueConstraint("categoria_id", "nombre"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))

    categoria: Mapped[CategoriaModelo] = relationship(back_populates="subcategorias")
    movimientos: Mapped[list["MovimientoModelo"]] = relationship(back_populates="subcategoria")


class MovimientoModelo(Base):
    __tablename__ = "movimientos"
    __table_args__ = (
        UniqueConstraint(
            "cuenta_id",
            "fecha_valor",
            "importe",
            "saldo",
            "descripcion",
            name="uq_movimiento_deduplicacion",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cuenta_id: Mapped[int] = mapped_column(ForeignKey("cuentas_bancarias.id"))
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    subcategoria_id: Mapped[int | None] = mapped_column(ForeignKey("subcategorias.id"))
    fecha_valor: Mapped[datetime.date] = mapped_column(Date)
    descripcion: Mapped[str] = mapped_column(String(500))
    comentario: Mapped[str | None] = mapped_column(String(500))
    importe: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    saldo: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    cuenta: Mapped[CuentaBancariaModelo] = relationship(back_populates="movimientos")
    categoria: Mapped[CategoriaModelo] = relationship(back_populates="movimientos")
    subcategoria: Mapped[SubcategoriaModelo | None] = relationship(back_populates="movimientos")
