from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class MedidaCorporalCrear(BaseModel):
    usuario_id: int
    fecha_medicion: date
    peso: Decimal | None = None
    altura: Decimal | None = None
    pecho: Decimal | None = None
    cintura: Decimal | None = None
    cadera: Decimal | None = None
    brazo_izquierdo: Decimal | None = None
    brazo_derecho: Decimal | None = None
    muslo_izquierdo: Decimal | None = None
    muslo_derecho: Decimal | None = None


class MedidaCorporalActualizar(BaseModel):
    fecha_medicion: date
    peso: Decimal | None = None
    altura: Decimal | None = None
    pecho: Decimal | None = None
    cintura: Decimal | None = None
    cadera: Decimal | None = None
    brazo_izquierdo: Decimal | None = None
    brazo_derecho: Decimal | None = None
    muslo_izquierdo: Decimal | None = None
    muslo_derecho: Decimal | None = None


class MedidaCorporalRespuesta(BaseModel):
    id: int
    usuario_id: int
    fecha_medicion: date
    peso: Decimal | None
    altura: Decimal | None
    pecho: Decimal | None
    cintura: Decimal | None
    cadera: Decimal | None
    brazo_izquierdo: Decimal | None
    brazo_derecho: Decimal | None
    muslo_izquierdo: Decimal | None
    muslo_derecho: Decimal | None

    model_config = ConfigDict(from_attributes=True)