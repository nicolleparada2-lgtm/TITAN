
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DatosPersonales(BaseModel):
    nombre_completo: str = Field(min_length=2, max_length=120)
    nombre_usuario: str = Field(min_length=3, max_length=50)
    correo: str = Field(min_length=5, max_length=254)

    @field_validator(
        "nombre_completo",
        "nombre_usuario",
        "correo"
    )
    @classmethod
    def limpiar_campos(cls, valor: str) -> str:
        return valor.strip()

    @field_validator("nombre_completo")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        if len(valor) < 2:
            raise ValueError(
                "El nombre completo debe tener al menos 2 caracteres"
            )

        return valor

    @field_validator("nombre_usuario")
    @classmethod
    def validar_usuario(cls, valor: str) -> str:
        if len(valor) < 3:
            raise ValueError(
                "El nombre de usuario debe tener al menos 3 caracteres"
            )

        if any(caracter.isspace() for caracter in valor):
            raise ValueError(
                "El nombre de usuario no puede contener espacios"
            )

        return valor

    @field_validator("correo")
    @classmethod
    def validar_correo(cls, valor: str) -> str:
        valor = valor.lower()

        partes = valor.split("@")

        if (
            len(partes) != 2
            or not partes[0]
            or "." not in partes[1]
            or partes[1].startswith(".")
            or partes[1].endswith(".")
            or any(caracter.isspace() for caracter in valor)
        ):
            raise ValueError(
                "Ingresa un correo electrónico válido"
            )

        return valor


class UsuarioCrear(DatosPersonales):
    contrasena: str = Field(min_length=8, max_length=128)


class UsuarioAdministrar(BaseModel):
    rol: Literal["ADMIN", "ENTRENADOR", "USUARIO"]
    estado: Literal["ACTIVO", "INACTIVO"]


class PerfilActualizar(DatosPersonales):
    pass


class ContrasenaActualizar(BaseModel):
    contrasena_actual: str = Field(min_length=1)
    contrasena_nueva: str = Field(min_length=8, max_length=128)


class UsuarioRespuesta(BaseModel):
    id: int
    nombre_completo: str
    nombre_usuario: str
    correo: str
    rol: str
    estado: str
    fecha_creacion: datetime | None

    model_config = ConfigDict(from_attributes=True)
