from sqlalchemy import Column, Integer, Numeric, ForeignKey

from database import Base


class SerieEntrenamiento(Base):
    __tablename__ = "series_entrenamiento"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ejercicio_entrenamiento_id = Column(
        Integer,
        ForeignKey(
            "ejercicios_entrenamiento.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    numero_serie = Column(
        Integer,
        nullable=False
    )

    repeticiones = Column(
        Integer,
        nullable=False
    )

    peso = Column(
        Numeric(6, 2),
        nullable=True
    )