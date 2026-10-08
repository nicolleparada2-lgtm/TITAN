from sqlalchemy import Column, Integer, ForeignKey

from database import Base


class EjercicioRutina(Base):
    __tablename__ = "ejercicios_rutina"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    rutina_id = Column(
        Integer,
        ForeignKey(
            "rutinas.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    ejercicio_id = Column(
        Integer,
        ForeignKey("ejercicios.id"),
        nullable=False
    )

    series = Column(
        Integer,
        nullable=False
    )

    repeticiones = Column(
        Integer,
        nullable=False
    )

    descanso_segundos = Column(
        Integer
    )

    orden_ejercicio = Column(
        Integer,
        nullable=False
    )