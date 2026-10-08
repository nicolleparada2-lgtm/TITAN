from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SesionEntrenamientoCrear(BaseModel):
    usuario_id: int
    rutina_id: int | None = None
    fecha_inicio: datetime
    notas: str | None = None


class SesionEntrenamientoActualizar(BaseModel):
    rutina_id: int | None = None
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    notas: str | None = None


class SesionEntrenamientoRespuesta(BaseModel):
    id: int
    usuario_id: int
    rutina_id: int | None
    fecha_inicio: datetime
    fecha_fin: datetime | None
    notas: str | None

    model_config = ConfigDict(from_attributes=True)