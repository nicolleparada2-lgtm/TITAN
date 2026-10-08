from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.ejercicio import Ejercicio
from modelos.grupo_muscular import GrupoMuscular
from modelos.usuario import Usuario
from esquemas.ejercicio import (
    EjercicioCrear,
    EjercicioActualizar,
    EjercicioRespuesta,
    GrupoMuscularCrear,
    GrupoMuscularRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    requerir_admin,
    requerir_admin_entrenador
)


router = APIRouter(
    prefix="/ejercicios",
    tags=["Ejercicios"]
)


# --------------------------------------------------
# GRUPOS MUSCULARES
# --------------------------------------------------

@router.get(
    "/grupos-musculares",
    response_model=list[GrupoMuscularRespuesta]
)
def listar_grupos_musculares(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    grupos = (
        db.query(GrupoMuscular)
        .order_by(GrupoMuscular.nombre)
        .all()
    )

    return grupos


@router.post(
    "/grupos-musculares",
    response_model=GrupoMuscularRespuesta,
    status_code=201
)
def crear_grupo_muscular(
    datos: GrupoMuscularCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    grupo_existente = (
        db.query(GrupoMuscular)
        .filter(GrupoMuscular.nombre == datos.nombre)
        .first()
    )

    if grupo_existente:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un grupo muscular con ese nombre"
        )

    nuevo_grupo = GrupoMuscular(
        nombre=datos.nombre
    )

    db.add(nuevo_grupo)
    db.commit()
    db.refresh(nuevo_grupo)

    return nuevo_grupo


@router.delete(
    "/grupos-musculares/{grupo_id}"
)
def eliminar_grupo_muscular(
    grupo_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    grupo = (
        db.query(GrupoMuscular)
        .filter(GrupoMuscular.id == grupo_id)
        .first()
    )

    if grupo is None:
        raise HTTPException(
            status_code=404,
            detail="Grupo muscular no encontrado"
        )

    ejercicio_asociado = (
        db.query(Ejercicio)
        .filter(Ejercicio.grupo_muscular_id == grupo_id)
        .first()
    )

    if ejercicio_asociado:
        raise HTTPException(
            status_code=400,
            detail=(
                "No se puede eliminar el grupo muscular "
                "porque tiene ejercicios asociados"
            )
        )

    db.delete(grupo)
    db.commit()

    return {
        "mensaje": "Grupo muscular eliminado correctamente"
    }


# --------------------------------------------------
# EJERCICIOS
# --------------------------------------------------

@router.get(
    "",
    response_model=list[EjercicioRespuesta]
)
def listar_ejercicios(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    ejercicios = (
        db.query(Ejercicio)
        .order_by(Ejercicio.nombre)
        .all()
    )

    return ejercicios


@router.get(
    "/{ejercicio_id}",
    response_model=EjercicioRespuesta
)
def obtener_ejercicio(
    ejercicio_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    ejercicio = (
        db.query(Ejercicio)
        .filter(Ejercicio.id == ejercicio_id)
        .first()
    )

    if ejercicio is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio no encontrado"
        )

    return ejercicio


@router.post(
    "",
    response_model=EjercicioRespuesta,
    status_code=201
)
def crear_ejercicio(
    datos: EjercicioCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin_entrenador)
):
    grupo_muscular = (
        db.query(GrupoMuscular)
        .filter(GrupoMuscular.id == datos.grupo_muscular_id)
        .first()
    )

    if grupo_muscular is None:
        raise HTTPException(
            status_code=404,
            detail="Grupo muscular no encontrado"
        )

    nuevo_ejercicio = Ejercicio(
        grupo_muscular_id=datos.grupo_muscular_id,
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        instrucciones=datos.instrucciones
    )

    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)

    return nuevo_ejercicio


@router.put(
    "/{ejercicio_id}",
    response_model=EjercicioRespuesta
)
def actualizar_ejercicio(
    ejercicio_id: int,
    datos: EjercicioActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin_entrenador)
):
    ejercicio = (
        db.query(Ejercicio)
        .filter(Ejercicio.id == ejercicio_id)
        .first()
    )

    if ejercicio is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio no encontrado"
        )

    grupo_muscular = (
        db.query(GrupoMuscular)
        .filter(
            GrupoMuscular.id == datos.grupo_muscular_id
        )
        .first()
    )

    if grupo_muscular is None:
        raise HTTPException(
            status_code=404,
            detail="Grupo muscular no encontrado"
        )

    ejercicio.grupo_muscular_id = datos.grupo_muscular_id
    ejercicio.nombre = datos.nombre
    ejercicio.descripcion = datos.descripcion
    ejercicio.instrucciones = datos.instrucciones

    db.commit()
    db.refresh(ejercicio)

    return ejercicio


@router.delete(
    "/{ejercicio_id}"
)
def eliminar_ejercicio(
    ejercicio_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    ejercicio = (
        db.query(Ejercicio)
        .filter(Ejercicio.id == ejercicio_id)
        .first()
    )

    if ejercicio is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio no encontrado"
        )

    db.delete(ejercicio)
    db.commit()

    return {
        "mensaje": "Ejercicio eliminado correctamente"
    }