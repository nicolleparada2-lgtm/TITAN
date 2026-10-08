from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RutinaCrear(BaseModel):
    usuario_id: int
    nombre: str
    descripcion: str | None = None


class RutinaActualizar(BaseModel):
    usuario_id: int
    nombre: str
    descripcion: str | None = None


class RutinaRespuesta(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    descripcion: str | None
    fecha_creacion: datetime | None

    model_config = ConfigDict(from_attributes=True)