from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PlanRespuesta(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    precio: Decimal
    duracion_dias: int
    estado: str

    model_config = ConfigDict(from_attributes=True)