from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ObjetivoCrear(BaseModel):
    usuario_id: int
    titulo: str
    descripcion: str | None = None
    tipo_objetivo: str
    valor_objetivo: Decimal
    unidad: str
    fecha_inicio: date
    fecha_objetivo: date | None = None


class ObjetivoActualizar(BaseModel):
    titulo: str
    descripcion: str | None = None
    tipo_objetivo: str
    valor_objetivo: Decimal
    unidad: str
    fecha_inicio: date
    fecha_objetivo: date | None = None
    estado: str


class ObjetivoRespuesta(BaseModel):
    id: int
    usuario_id: int
    titulo: str
    descripcion: str | None
    tipo_objetivo: str
    valor_objetivo: Decimal
    unidad: str
    fecha_inicio: date
    fecha_objetivo: date | None
    estado: str

    model_config = ConfigDict(from_attributes=True)