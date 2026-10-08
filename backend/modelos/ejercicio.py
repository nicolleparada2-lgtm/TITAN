from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text

from database import Base


class Ejercicio(Base):
    __tablename__ = "ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    grupo_muscular_id = Column(
        Integer,
        ForeignKey("grupos_musculares.id"),
        nullable=False
    )
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(500))
    instrucciones = Column(Text)
    fecha_creacion = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )