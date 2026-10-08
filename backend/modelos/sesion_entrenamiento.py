from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from database import Base


class SesionEntrenamiento(Base):
    __tablename__ = "sesiones_entrenamiento"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    rutina_id = Column(
        Integer,
        ForeignKey("rutinas.id"),
        nullable=True
    )

    fecha_inicio = Column(
        DateTime,
        nullable=False
    )

    fecha_fin = Column(
        DateTime,
        nullable=True
    )

    notas = Column(
        String(500),
        nullable=True
    )