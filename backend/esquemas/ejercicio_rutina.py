from pydantic import BaseModel, ConfigDict


class EjercicioRutinaCrear(BaseModel):
    ejercicio_id: int
    series: int
    repeticiones: int
    descanso_segundos: int | None = None
    orden_ejercicio: int


class EjercicioRutinaRespuesta(BaseModel):
    id: int
    rutina_id: int
    ejercicio_id: int
    series: int
    repeticiones: int
    descanso_segundos: int | None
    orden_ejercicio: int

    model_config = ConfigDict(from_attributes=True)