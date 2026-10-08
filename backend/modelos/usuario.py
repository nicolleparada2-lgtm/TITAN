from sqlalchemy import Column, Integer, String, DateTime, text

from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(120), nullable=False)
    nombre_usuario = Column(String(50), nullable=False, unique=True)
    correo = Column(String(150), nullable=False, unique=True)
    contrasena_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="USUARIO")
    estado = Column(String(20), nullable=False, default="ACTIVO")
    fecha_creacion = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )