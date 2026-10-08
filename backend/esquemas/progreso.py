from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ProgresoPesoRespuesta(BaseModel):
    fecha: date
    peso: Decimal


class ProgresoMedidasRespuesta(BaseModel):
    fecha: date
    pecho: Decimal | None
    cintura: Decimal | None
    cadera: Decimal | None
    brazo_izquierdo: Decimal | None
    brazo_derecho: Decimal | None
    muslo_izquierdo: Decimal | None
    muslo_derecho: Decimal | None


class ResumenProgresoRespuesta(BaseModel):
    usuario_id: int
    total_sesiones: int
    total_objetivos: int
    objetivos_en_progreso: int
    objetivos_completados: int
    peso_inicial: Decimal | None
    peso_actual: Decimal | None
    cambio_peso: Decimal | None