import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException


load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(
    os.getenv("JWT_EXPIRATION_MINUTES", "60")
)


def crear_token_acceso(
    usuario_id: int,
    nombre_usuario: str,
    rol: str
) -> str:
    ahora = datetime.now(timezone.utc)

    expiracion = ahora + timedelta(
        minutes=JWT_EXPIRATION_MINUTES
    )

    datos_token = {
        "sub": str(usuario_id),
        "nombre_usuario": nombre_usuario,
        "rol": rol,
        "iat": ahora,
        "exp": expiracion
    }

    token = jwt.encode(
        datos_token,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return token


def verificar_token(token: str) -> dict:
    try:
        datos = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        return datos

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="El token ha expirado"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )