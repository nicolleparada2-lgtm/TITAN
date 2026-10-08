from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, text

from database import Base


class EntrenadorUsuario(Base):
    __tablename__ = "entrenador_usuarios"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    entrenador_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    usuario_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    fecha_asignacion = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        UniqueConstraint(
            "entrenador_id",
            "usuario_id",
            name="uq_entrenador_usuario"
        ),
    )