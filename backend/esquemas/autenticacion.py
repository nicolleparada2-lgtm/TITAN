from pydantic import BaseModel


class LoginDatos(BaseModel):
    nombre_usuario: str
    contrasena: str


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str