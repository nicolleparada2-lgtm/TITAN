from pydantic import BaseModel, ConfigDict


class GrupoMuscularRespuesta(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)