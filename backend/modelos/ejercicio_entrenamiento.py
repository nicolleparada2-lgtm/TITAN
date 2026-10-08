from sqlalchemy import Column, Integer, String, ForeignKey

from database import Base


class EjercicioEntrenamiento(Base):
    __tablename__ = "ejercicios_entrenamiento"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    sesion_id = Column(
        Integer,
        ForeignKey(
            "sesiones_entrenamiento.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    ejercicio_id = Column(
        Integer,
        ForeignKey("ejercicios.id"),
        nullable=False
    )

    orden_ejercicio = Column(
        Integer,
        nullable=False
    )

    notas = Column(
        String(500),
        nullable=True
    )