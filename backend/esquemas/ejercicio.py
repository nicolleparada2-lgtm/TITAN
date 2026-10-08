from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --------------------------------------------------
# Esquemas de grupos musculares
# --------------------------------------------------

class GrupoMuscularCrear(BaseModel):
    nombre: str


class GrupoMuscularRespuesta(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------
# Esquemas de ejercicios
# --------------------------------------------------

class EjercicioCrear(BaseModel):
    grupo_muscular_id: int
    nombre: str
    descripcion: str | None = None
    instrucciones: str | None = None


class EjercicioActualizar(BaseModel):
    grupo_muscular_id: int
    nombre: str
    descripcion: str | None = None
    instrucciones: str | None = None


class EjercicioRespuesta(BaseModel):
    id: int
    grupo_muscular_id: int
    nombre: str
    descripcion: str | None
    instrucciones: str | None
    fecha_creacion: datetime | None

    model_config = ConfigDict(from_attributes=True)