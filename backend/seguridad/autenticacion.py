from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.usuario import Usuario
from modelos.entrenador_usuario import EntrenadorUsuario
from seguridad.jwt import verificar_token


esquema_seguridad = HTTPBearer()


# --------------------------------------------------
# Obtener usuario autenticado
# --------------------------------------------------

def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad),
    db: Session = Depends(obtener_db)
):
    token = credenciales.credentials
    datos_token = verificar_token(token)

    usuario_id = datos_token.get("sub")

    if usuario_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == int(usuario_id))
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Usuario no encontrado"
        )

    if usuario.estado != "ACTIVO":
        raise HTTPException(
            status_code=403,
            detail="El usuario no se encuentra activo"
        )

    return usuario


# --------------------------------------------------
# Requerir ADMIN
# --------------------------------------------------

def requerir_admin(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Se requiere rol ADMIN"
        )

    return usuario_actual


# --------------------------------------------------
# Requerir ADMIN o ENTRENADOR
# --------------------------------------------------

def requerir_admin_entrenador(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol not in ["ADMIN", "ENTRENADOR"]:
        raise HTTPException(
            status_code=403,
            detail="Se requiere rol ADMIN o ENTRENADOR"
        )

    return usuario_actual


# --------------------------------------------------
# Comprobar relación entrenador-usuario
# --------------------------------------------------

def es_usuario_asignado(
    entrenador_id: int,
    usuario_id: int,
    db: Session
) -> bool:
    asignacion = (
        db.query(EntrenadorUsuario)
        .filter(
            EntrenadorUsuario.entrenador_id == entrenador_id,
            EntrenadorUsuario.usuario_id == usuario_id
        )
        .first()
    )

    return asignacion is not None


# --------------------------------------------------
# Verificar acceso a los datos de un usuario
# --------------------------------------------------

def verificar_acceso_usuario(
    usuario_id: int,
    usuario_actual: Usuario,
    db: Session
) -> None:
    # ADMIN puede consultar cualquier usuario.
    if usuario_actual.rol == "ADMIN":
        return

    # Cada persona puede consultar sus propios datos.
    if usuario_actual.id == usuario_id:
        return

    # ENTRENADOR puede consultar usuarios que tenga asignados.
    if usuario_actual.rol == "ENTRENADOR":
        if es_usuario_asignado(
            entrenador_id=usuario_actual.id,
            usuario_id=usuario_id,
            db=db
        ):
            return

    raise HTTPException(
        status_code=403,
        detail="No tienes permisos para acceder a los datos de este usuario"
    )


# --------------------------------------------------
# Verificar si puede gestionar datos de un usuario
# --------------------------------------------------

def verificar_gestion_usuario(
    usuario_id: int,
    usuario_actual: Usuario,
    db: Session
) -> None:
    # ADMIN puede gestionar cualquier usuario.
    if usuario_actual.rol == "ADMIN":
        return

    # Cada usuario puede gestionar sus propios datos.
    if usuario_actual.id == usuario_id:
        return

    # ENTRENADOR puede gestionar usuarios asignados.
    if usuario_actual.rol == "ENTRENADOR":
        if es_usuario_asignado(
            entrenador_id=usuario_actual.id,
            usuario_id=usuario_id,
            db=db
        ):
            return

    raise HTTPException(
        status_code=403,
        detail="No tienes permisos para modificar los datos de este usuario"
    )