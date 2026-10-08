from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class SerieEntrenamientoCrear(BaseModel):
    numero_serie: int
    repeticiones: int
    peso: Decimal | None = None


class SerieEntrenamientoActualizar(BaseModel):
    numero_serie: int
    repeticiones: int
    peso: Decimal | None = None


class SerieEntrenamientoRespuesta(BaseModel):
    id: int
    ejercicio_entrenamiento_id: int
    numero_serie: int
    repeticiones: int
    peso: Decimal | None

    model_config = ConfigDict(from_attributes=True)