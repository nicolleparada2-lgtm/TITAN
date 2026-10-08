from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class MensualidadCrear(BaseModel):
    usuario_id: int
    plan_id: int
    fecha_inicio: date


class MensualidadActualizar(BaseModel):
    plan_id: int
    fecha_inicio: date


class MensualidadRespuesta(BaseModel):
    id: int
    usuario_id: int
    plan_id: int
    fecha_inicio: date
    fecha_fin: date
    monto: Decimal
    fecha_pago: datetime | None
    estado: str

    model_config = ConfigDict(from_attributes=True)