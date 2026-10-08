from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text

from database import Base


class Rutina(Base):
    __tablename__ = "rutinas"

    id = Column(Integer, primary_key=True, index=True)

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    descripcion = Column(
        String(500)
    )

    fecha_creacion = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )