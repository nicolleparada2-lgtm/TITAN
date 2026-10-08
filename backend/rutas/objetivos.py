from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.objetivo import Objetivo
from modelos.usuario import Usuario
from modelos.entrenador_usuario import EntrenadorUsuario
from esquemas.objetivo import (
    ObjetivoCrear,
    ObjetivoActualizar,
    ObjetivoRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    verificar_acceso_usuario,
    verificar_gestion_usuario
)


router = APIRouter(
    tags=["Objetivos"]
)


# --------------------------------------------------
# Listar objetivos
# --------------------------------------------------

@router.get(
    "/objetivos",
    response_model=list[ObjetivoRespuesta]
)
def listar_objetivos(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    # ADMIN puede ver todos los objetivos.
    if usuario_actual.rol == "ADMIN":
        return (
            db.query(Objetivo)
            .order_by(Objetivo.id)
            .all()
        )

    # ENTRENADOR puede ver sus objetivos y los objetivos
    # de los usuarios que tiene asignados.
    if usuario_actual.rol == "ENTRENADOR":
        usuarios_asignados = (
            db.query(EntrenadorUsuario.usuario_id)
            .filter(
                EntrenadorUsuario.entrenador_id == usuario_actual.id
            )
            .all()
        )

        ids_usuarios = [
            usuario_id
            for (usuario_id,) in usuarios_asignados
        ]

        ids_usuarios.append(usuario_actual.id)

        return (
            db.query(Objetivo)
            .filter(Objetivo.usuario_id.in_(ids_usuarios))
            .order_by(Objetivo.id)
            .all()
        )

    # USUARIO solo puede ver sus propios objetivos.
    return (
        db.query(Objetivo)
        .filter(Objetivo.usuario_id == usuario_actual.id)
        .order_by(Objetivo.id)
        .all()
    )


# --------------------------------------------------
# Obtener un objetivo
# --------------------------------------------------

@router.get(
    "/objetivos/{objetivo_id}",
    response_model=ObjetivoRespuesta
)
def obtener_objetivo(
    objetivo_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    objetivo = (
        db.query(Objetivo)
        .filter(Objetivo.id == objetivo_id)
        .first()
    )

    if objetivo is None:
        raise HTTPException(
            status_code=404,
            detail="Objetivo no encontrado"
        )

    verificar_acceso_usuario(
        usuario_id=objetivo.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    return objetivo


# --------------------------------------------------
# Listar objetivos de un usuario
# --------------------------------------------------

@router.get(
    "/usuarios/{usuario_id}/objetivos",
    response_model=list[ObjetivoRespuesta]
)
def listar_objetivos_usuario(
    usuario_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    verificar_acceso_usuario(
        usuario_id=usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    objetivos = (
        db.query(Objetivo)
        .filter(Objetivo.usuario_id == usuario_id)
        .order_by(Objetivo.id)
        .all()
    )

    return objetivos


# --------------------------------------------------
# Crear objetivo
# --------------------------------------------------

@router.post(
    "/objetivos",
    response_model=ObjetivoRespuesta,
    status_code=201
)
def crear_objetivo(
    datos: ObjetivoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
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

    verificar_gestion_usuario(
        usuario_id=datos.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    if (
        datos.fecha_objetivo is not None
        and datos.fecha_objetivo < datos.fecha_inicio
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha objetivo no puede ser "
                "anterior a la fecha de inicio"
            )
        )

    nuevo_objetivo = Objetivo(
        usuario_id=datos.usuario_id,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        tipo_objetivo=datos.tipo_objetivo,
        valor_objetivo=datos.valor_objetivo,
        unidad=datos.unidad,
        fecha_inicio=datos.fecha_inicio,
        fecha_objetivo=datos.fecha_objetivo,
        estado="EN_PROGRESO"
    )

    db.add(nuevo_objetivo)
    db.commit()
    db.refresh(nuevo_objetivo)

    return nuevo_objetivo


# --------------------------------------------------
# Actualizar objetivo
# --------------------------------------------------

@router.put(
    "/objetivos/{objetivo_id}",
    response_model=ObjetivoRespuesta
)
def actualizar_objetivo(
    objetivo_id: int,
    datos: ObjetivoActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    objetivo = (
        db.query(Objetivo)
        .filter(Objetivo.id == objetivo_id)
        .first()
    )

    if objetivo is None:
        raise HTTPException(
            status_code=404,
            detail="Objetivo no encontrado"
        )

    verificar_gestion_usuario(
        usuario_id=objetivo.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    if (
        datos.fecha_objetivo is not None
        and datos.fecha_objetivo < datos.fecha_inicio
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha objetivo no puede ser "
                "anterior a la fecha de inicio"
            )
        )

    objetivo.titulo = datos.titulo
    objetivo.descripcion = datos.descripcion
    objetivo.tipo_objetivo = datos.tipo_objetivo
    objetivo.valor_objetivo = datos.valor_objetivo
    objetivo.unidad = datos.unidad
    objetivo.fecha_inicio = datos.fecha_inicio
    objetivo.fecha_objetivo = datos.fecha_objetivo
    objetivo.estado = datos.estado

    db.commit()
    db.refresh(objetivo)

    return objetivo


# --------------------------------------------------
# Eliminar objetivo
# --------------------------------------------------

@router.delete(
    "/objetivos/{objetivo_id}"
)
def eliminar_objetivo(
    objetivo_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    objetivo = (
        db.query(Objetivo)
        .filter(Objetivo.id == objetivo_id)
        .first()
    )

    if objetivo is None:
        raise HTTPException(
            status_code=404,
            detail="Objetivo no encontrado"
        )

    verificar_gestion_usuario(
        usuario_id=objetivo.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    db.delete(objetivo)
    db.commit()

    return {
        "mensaje": "Objetivo eliminado correctamente"
    }