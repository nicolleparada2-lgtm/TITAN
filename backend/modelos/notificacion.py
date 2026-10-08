from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String
)
from sqlalchemy.sql import func

from database import Base


class Notificacion(Base):
    __tablename__ = "notificaciones"

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

    titulo = Column(
        String(150),
        nullable=False
    )

    mensaje = Column(
        String(500),
        nullable=False
    )

    tipo = Column(
        String(30),
        nullable=False
    )

    leida = Column(
        Boolean,
        nullable=False,
        default=False
    )

    fecha_creacion = Column(
        DateTime,
        server_default=func.now()
    )