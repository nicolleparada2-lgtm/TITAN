from sqlalchemy import Column, Integer, Numeric, String

from database import Base


class Plan(Base):
    __tablename__ = "planes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(80),
        nullable=False,
        unique=True
    )

    descripcion = Column(
        String(500)
    )

    precio = Column(
        Numeric(10, 2),
        nullable=False
    )

    duracion_dias = Column(
        Integer,
        nullable=False,
        default=30
    )

    estado = Column(
        String(20),
        nullable=False,
        default="ACTIVO"
    )