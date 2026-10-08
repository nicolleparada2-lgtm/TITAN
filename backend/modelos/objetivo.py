from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey

from database import Base


class Objetivo(Base):
    __tablename__ = "objetivos"

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
        String(120),
        nullable=False
    )

    descripcion = Column(
        String(500),
        nullable=True
    )

    tipo_objetivo = Column(
        String(30),
        nullable=False
    )

    valor_objetivo = Column(
        Numeric(8, 2),
        nullable=False
    )

    unidad = Column(
        String(20),
        nullable=False
    )

    fecha_inicio = Column(
        Date,
        nullable=False
    )

    fecha_objetivo = Column(
        Date,
        nullable=True
    )

    estado = Column(
        String(20),
        nullable=False,
        default="EN_PROGRESO"
    )