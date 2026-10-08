from pydantic import BaseModel, ConfigDict


class EjercicioEntrenamientoCrear(BaseModel):
    ejercicio_id: int
    orden_ejercicio: int
    notas: str | None = None


class EjercicioEntrenamientoActualizar(BaseModel):
    ejercicio_id: int
    orden_ejercicio: int
    notas: str | None = None


class EjercicioEntrenamientoRespuesta(BaseModel):
    id: int
    sesion_id: int
    ejercicio_id: int
    orden_ejercicio: int
    notas: str | None

    model_config = ConfigDict(from_attributes=True)