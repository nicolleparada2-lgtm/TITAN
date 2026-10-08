from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionRespuesta(BaseModel):
    id: int
    usuario_id: int
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    fecha_creacion: datetime | None

    model_config = ConfigDict(from_attributes=True)