from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String
)
from sqlalchemy.sql import func

from database import Base


class Mensualidad(Base):
    __tablename__ = "mensualidades"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    plan_id = Column(
        Integer,
        ForeignKey("planes.id"),
        nullable=False
    )

    fecha_inicio = Column(
        Date,
        nullable=False
    )

    fecha_fin = Column(
        Date,
        nullable=False
    )

    monto = Column(
        Numeric(10, 2),
        nullable=False
    )

    fecha_pago = Column(
        DateTime,
        server_default=func.now()
    )

    estado = Column(
        String(20),
        nullable=False,
        default="VIGENTE"
    )