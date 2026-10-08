from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EntrenadorUsuarioCrear(BaseModel):
    entrenador_id: int
    usuario_id: int


class EntrenadorUsuarioRespuesta(BaseModel):
    id: int
    entrenador_id: int
    usuario_id: int
    fecha_asignacion: datetime | None

    model_config = ConfigDict(from_attributes=True)