from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.rutina import Rutina
from modelos.ejercicio import Ejercicio
from modelos.ejercicio_rutina import EjercicioRutina
from modelos.usuario import Usuario
from esquemas.rutina import (
    RutinaCrear,
    RutinaActualizar,
    RutinaRespuesta
)
from esquemas.ejercicio_rutina import (
    EjercicioRutinaCrear,
    EjercicioRutinaRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    verificar_acceso_usuario,
    verificar_gestion_usuario
)


router = APIRouter(
    tags=["Rutinas"]
)


# --------------------------------------------------
# Listar rutinas
# --------------------------------------------------

@router.get(
    "/rutinas",
    response_model=list[RutinaRespuesta]
)
def listar_rutinas(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    # ADMIN puede ver todas las rutinas.
    if usuario_actual.rol == "ADMIN":
        return (
            db.query(Rutina)
            .order_by(Rutina.id)
            .all()
        )

    # ENTRENADOR puede ver sus propias rutinas y las
    # rutinas de los usuarios que tiene asignados.
    if usuario_actual.rol == "ENTRENADOR":
        from modelos.entrenador_usuario import EntrenadorUsuario

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
            db.query(Rutina)
            .filter(Rutina.usuario_id.in_(ids_usuarios))
            .order_by(Rutina.id)
            .all()
        )

    # USUARIO solo puede ver sus propias rutinas.
    return (
        db.query(Rutina)
        .filter(Rutina.usuario_id == usuario_actual.id)
        .order_by(Rutina.id)
        .all()
    )


# --------------------------------------------------
# Obtener una rutina
# --------------------------------------------------

@router.get(
    "/rutinas/{rutina_id}",
    response_model=RutinaRespuesta
)
def obtener_rutina(
    rutina_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    verificar_acceso_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    return rutina


# --------------------------------------------------
# Crear rutina
# --------------------------------------------------

@router.post(
    "/rutinas",
    response_model=RutinaRespuesta,
    status_code=201
)
def crear_rutina(
    datos: RutinaCrear,
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

    nueva_rutina = Rutina(
        usuario_id=datos.usuario_id,
        nombre=datos.nombre,
        descripcion=datos.descripcion
    )

    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    return nueva_rutina


# --------------------------------------------------
# Actualizar rutina
# --------------------------------------------------

@router.put(
    "/rutinas/{rutina_id}",
    response_model=RutinaRespuesta
)
def actualizar_rutina(
    rutina_id: int,
    datos: RutinaActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    # Primero verificamos que pueda modificar la rutina actual.
    verificar_gestion_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
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

    # También verificamos que tenga permiso sobre el usuario
    # al que se quiere asignar la rutina.
    verificar_gestion_usuario(
        usuario_id=datos.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    rutina.usuario_id = datos.usuario_id
    rutina.nombre = datos.nombre
    rutina.descripcion = datos.descripcion

    db.commit()
    db.refresh(rutina)

    return rutina


# --------------------------------------------------
# Eliminar rutina
# --------------------------------------------------

@router.delete(
    "/rutinas/{rutina_id}"
)
def eliminar_rutina(
    rutina_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    db.delete(rutina)
    db.commit()

    return {
        "mensaje": "Rutina eliminada correctamente"
    }


# --------------------------------------------------
# Listar ejercicios de una rutina
# --------------------------------------------------

@router.get(
    "/rutinas/{rutina_id}/ejercicios",
    response_model=list[EjercicioRutinaRespuesta]
)
def listar_ejercicios_rutina(
    rutina_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    verificar_acceso_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicios_rutina = (
        db.query(EjercicioRutina)
        .filter(EjercicioRutina.rutina_id == rutina_id)
        .order_by(EjercicioRutina.orden_ejercicio)
        .all()
    )

    return ejercicios_rutina


# --------------------------------------------------
# Agregar ejercicio a una rutina
# --------------------------------------------------

@router.post(
    "/rutinas/{rutina_id}/ejercicios",
    response_model=EjercicioRutinaRespuesta,
    status_code=201
)
def agregar_ejercicio_rutina(
    rutina_id: int,
    datos: EjercicioRutinaCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicio = (
        db.query(Ejercicio)
        .filter(Ejercicio.id == datos.ejercicio_id)
        .first()
    )

    if ejercicio is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio no encontrado"
        )

    nuevo_ejercicio_rutina = EjercicioRutina(
        rutina_id=rutina_id,
        ejercicio_id=datos.ejercicio_id,
        series=datos.series,
        repeticiones=datos.repeticiones,
        descanso_segundos=datos.descanso_segundos,
        orden_ejercicio=datos.orden_ejercicio
    )

    db.add(nuevo_ejercicio_rutina)
    db.commit()
    db.refresh(nuevo_ejercicio_rutina)

    return nuevo_ejercicio_rutina


# --------------------------------------------------
# Eliminar ejercicio de una rutina
# --------------------------------------------------

@router.delete(
    "/rutinas/{rutina_id}/ejercicios/{ejercicio_rutina_id}"
)
def eliminar_ejercicio_rutina(
    rutina_id: int,
    ejercicio_rutina_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    rutina = (
        db.query(Rutina)
        .filter(Rutina.id == rutina_id)
        .first()
    )

    if rutina is None:
        raise HTTPException(
            status_code=404,
            detail="Rutina no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=rutina.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicio_rutina = (
        db.query(EjercicioRutina)
        .filter(
            EjercicioRutina.id == ejercicio_rutina_id,
            EjercicioRutina.rutina_id == rutina_id
        )
        .first()
    )

    if ejercicio_rutina is None:
        raise HTTPException(
            status_code=404,
            detail="El ejercicio no pertenece a esta rutina"
        )

    db.delete(ejercicio_rutina)
    db.commit()

    return {
        "mensaje": "Ejercicio eliminado de la rutina correctamente"
    }