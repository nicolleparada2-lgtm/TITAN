from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.entrenador_usuario import EntrenadorUsuario
from modelos.usuario import Usuario
from esquemas.entrenador_usuario import (
    EntrenadorUsuarioCrear,
    EntrenadorUsuarioRespuesta
)
from esquemas.usuario import UsuarioRespuesta
from seguridad.autenticacion import (
    obtener_usuario_actual,
    requerir_admin
)


router = APIRouter(
    tags=["Entrenadores"]
)


# --------------------------------------------------
# Listar todas las asignaciones
# Solo ADMIN
# --------------------------------------------------

@router.get(
    "/entrenador-usuarios",
    response_model=list[EntrenadorUsuarioRespuesta]
)
def listar_asignaciones(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    asignaciones = (
        db.query(EntrenadorUsuario)
        .order_by(EntrenadorUsuario.id)
        .all()
    )

    return asignaciones


# --------------------------------------------------
# Obtener usuarios asignados a un entrenador
# ADMIN puede consultar cualquier entrenador.
# ENTRENADOR solo puede consultar sus propios usuarios.
# --------------------------------------------------

@router.get(
    "/entrenadores/{entrenador_id}/usuarios",
    response_model=list[UsuarioRespuesta]
)
def listar_usuarios_entrenador(
    entrenador_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    entrenador = (
        db.query(Usuario)
        .filter(Usuario.id == entrenador_id)
        .first()
    )

    if entrenador is None:
        raise HTTPException(
            status_code=404,
            detail="Entrenador no encontrado"
        )

    if entrenador.rol != "ENTRENADOR":
        raise HTTPException(
            status_code=400,
            detail="El usuario indicado no tiene rol de ENTRENADOR"
        )

    # ADMIN puede consultar los usuarios de cualquier entrenador.
    if usuario_actual.rol == "ADMIN":
        pass

    # ENTRENADOR solo puede consultar sus propios usuarios asignados.
    elif (
        usuario_actual.rol == "ENTRENADOR"
        and usuario_actual.id == entrenador_id
    ):
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail=(
                "No tienes permisos para consultar "
                "los usuarios de este entrenador"
            )
        )

    usuarios = (
        db.query(Usuario)
        .join(
            EntrenadorUsuario,
            Usuario.id == EntrenadorUsuario.usuario_id
        )
        .filter(
            EntrenadorUsuario.entrenador_id == entrenador_id
        )
        .order_by(Usuario.id)
        .all()
    )

    return usuarios


# --------------------------------------------------
# Crear asignación entrenador-usuario
# Solo ADMIN
# --------------------------------------------------

@router.post(
    "/entrenador-usuarios",
    response_model=EntrenadorUsuarioRespuesta,
    status_code=201
)
def crear_asignacion(
    datos: EntrenadorUsuarioCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    entrenador = (
        db.query(Usuario)
        .filter(Usuario.id == datos.entrenador_id)
        .first()
    )

    if entrenador is None:
        raise HTTPException(
            status_code=404,
            detail="Entrenador no encontrado"
        )

    if entrenador.rol != "ENTRENADOR":
        raise HTTPException(
            status_code=400,
            detail="El usuario indicado no tiene rol de ENTRENADOR"
        )

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == datos.usuario_id)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    if usuario.rol != "USUARIO":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden asignar usuarios con rol USUARIO"
        )

    asignacion_existente = (
        db.query(EntrenadorUsuario)
        .filter(
            EntrenadorUsuario.entrenador_id
            == datos.entrenador_id,
            EntrenadorUsuario.usuario_id
            == datos.usuario_id
        )
        .first()
    )

    if asignacion_existente:
        raise HTTPException(
            status_code=400,
            detail="El usuario ya está asignado a este entrenador"
        )

    nueva_asignacion = EntrenadorUsuario(
        entrenador_id=datos.entrenador_id,
        usuario_id=datos.usuario_id
    )

    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)

    return nueva_asignacion


# --------------------------------------------------
# Eliminar asignación
# Solo ADMIN
# --------------------------------------------------

@router.delete(
    "/entrenador-usuarios/{asignacion_id}"
)
def eliminar_asignacion(
    asignacion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    asignacion = (
        db.query(EntrenadorUsuario)
        .filter(EntrenadorUsuario.id == asignacion_id)
        .first()
    )

    if asignacion is None:
        raise HTTPException(
            status_code=404,
            detail="Asignación no encontrada"
        )

    db.delete(asignacion)
    db.commit()

    return {
        "mensaje": "Asignación eliminada correctamente"
    }