from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.usuario import Usuario
from modelos.rutina import Rutina
from modelos.ejercicio import Ejercicio
from modelos.entrenador_usuario import EntrenadorUsuario
from modelos.sesion_entrenamiento import SesionEntrenamiento
from modelos.ejercicio_entrenamiento import EjercicioEntrenamiento
from modelos.serie_entrenamiento import SerieEntrenamiento
from esquemas.sesion_entrenamiento import (
    SesionEntrenamientoCrear,
    SesionEntrenamientoActualizar,
    SesionEntrenamientoRespuesta
)
from esquemas.ejercicio_entrenamiento import (
    EjercicioEntrenamientoCrear,
    EjercicioEntrenamientoActualizar,
    EjercicioEntrenamientoRespuesta
)
from esquemas.serie_entrenamiento import (
    SerieEntrenamientoCrear,
    SerieEntrenamientoActualizar,
    SerieEntrenamientoRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    verificar_acceso_usuario,
    verificar_gestion_usuario
)


router = APIRouter(
    tags=["Entrenamientos"]
)


# --------------------------------------------------
# Función auxiliar: obtener sesión de un ejercicio
# --------------------------------------------------

def obtener_sesion_de_ejercicio(
    ejercicio_entrenamiento: EjercicioEntrenamiento,
    db: Session
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(
            SesionEntrenamiento.id
            == ejercicio_entrenamiento.sesion_id
        )
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    return sesion


# --------------------------------------------------
# Función auxiliar: obtener sesión de una serie
# --------------------------------------------------

def obtener_sesion_de_serie(
    serie: SerieEntrenamiento,
    db: Session
):
    ejercicio_entrenamiento = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.id
            == serie.ejercicio_entrenamiento_id
        )
        .first()
    )

    if ejercicio_entrenamiento is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio realizado no encontrado"
        )

    return obtener_sesion_de_ejercicio(
        ejercicio_entrenamiento,
        db
    )


# --------------------------------------------------
# Listar sesiones
# --------------------------------------------------

@router.get(
    "/sesiones",
    response_model=list[SesionEntrenamientoRespuesta]
)
def listar_sesiones(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    if usuario_actual.rol == "ADMIN":
        return (
            db.query(SesionEntrenamiento)
            .order_by(SesionEntrenamiento.fecha_inicio.desc())
            .all()
        )

    if usuario_actual.rol == "ENTRENADOR":
        usuarios_asignados = (
            db.query(EntrenadorUsuario.usuario_id)
            .filter(
                EntrenadorUsuario.entrenador_id
                == usuario_actual.id
            )
            .all()
        )

        ids_usuarios = [
            usuario_id
            for (usuario_id,) in usuarios_asignados
        ]

        ids_usuarios.append(usuario_actual.id)

        return (
            db.query(SesionEntrenamiento)
            .filter(
                SesionEntrenamiento.usuario_id.in_(
                    ids_usuarios
                )
            )
            .order_by(SesionEntrenamiento.fecha_inicio.desc())
            .all()
        )

    return (
        db.query(SesionEntrenamiento)
        .filter(
            SesionEntrenamiento.usuario_id
            == usuario_actual.id
        )
        .order_by(SesionEntrenamiento.fecha_inicio.desc())
        .all()
    )


# --------------------------------------------------
# Obtener una sesión
# --------------------------------------------------

@router.get(
    "/sesiones/{sesion_id}",
    response_model=SesionEntrenamientoRespuesta
)
def obtener_sesion(
    sesion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_acceso_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    return sesion


# --------------------------------------------------
# Crear una sesión
# --------------------------------------------------

@router.post(
    "/sesiones",
    response_model=SesionEntrenamientoRespuesta,
    status_code=201
)
def crear_sesion(
    datos: SesionEntrenamientoCrear,
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

    if datos.rutina_id is not None:
        rutina = (
            db.query(Rutina)
            .filter(Rutina.id == datos.rutina_id)
            .first()
        )

        if rutina is None:
            raise HTTPException(
                status_code=404,
                detail="Rutina no encontrada"
            )

        if rutina.usuario_id != datos.usuario_id:
            raise HTTPException(
                status_code=400,
                detail="La rutina no pertenece al usuario indicado"
            )

    nueva_sesion = SesionEntrenamiento(
        usuario_id=datos.usuario_id,
        rutina_id=datos.rutina_id,
        fecha_inicio=datos.fecha_inicio,
        notas=datos.notas
    )

    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)

    return nueva_sesion


# --------------------------------------------------
# Actualizar una sesión
# --------------------------------------------------

@router.put(
    "/sesiones/{sesion_id}",
    response_model=SesionEntrenamientoRespuesta
)
def actualizar_sesion(
    sesion_id: int,
    datos: SesionEntrenamientoActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    if datos.rutina_id is not None:
        rutina = (
            db.query(Rutina)
            .filter(Rutina.id == datos.rutina_id)
            .first()
        )

        if rutina is None:
            raise HTTPException(
                status_code=404,
                detail="Rutina no encontrada"
            )

        if rutina.usuario_id != sesion.usuario_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "La rutina no pertenece al "
                    "usuario de la sesión"
                )
            )

    if (
        datos.fecha_fin is not None
        and datos.fecha_fin < datos.fecha_inicio
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha de finalización no puede "
                "ser anterior a la fecha de inicio"
            )
        )

    sesion.rutina_id = datos.rutina_id
    sesion.fecha_inicio = datos.fecha_inicio
    sesion.fecha_fin = datos.fecha_fin
    sesion.notas = datos.notas

    db.commit()
    db.refresh(sesion)

    return sesion


# --------------------------------------------------
# Finalizar una sesión
# --------------------------------------------------

@router.patch(
    "/sesiones/{sesion_id}/finalizar",
    response_model=SesionEntrenamientoRespuesta
)
def finalizar_sesion(
    sesion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    if sesion.fecha_fin is not None:
        raise HTTPException(
            status_code=400,
            detail="La sesión ya fue finalizada"
        )

    sesion.fecha_fin = datetime.now()

    db.commit()
    db.refresh(sesion)

    return sesion


# --------------------------------------------------
# Eliminar una sesión
# --------------------------------------------------

@router.delete(
    "/sesiones/{sesion_id}"
)
def eliminar_sesion(
    sesion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    db.delete(sesion)
    db.commit()

    return {
        "mensaje": (
            "Sesión de entrenamiento eliminada correctamente"
        )
    }


# --------------------------------------------------
# Listar ejercicios realizados en una sesión
# --------------------------------------------------

@router.get(
    "/sesiones/{sesion_id}/ejercicios",
    response_model=list[EjercicioEntrenamientoRespuesta]
)
def listar_ejercicios_sesion(
    sesion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_acceso_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicios = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.sesion_id == sesion_id
        )
        .order_by(EjercicioEntrenamiento.orden_ejercicio)
        .all()
    )

    return ejercicios


# --------------------------------------------------
# Agregar ejercicio realizado a una sesión
# --------------------------------------------------

@router.post(
    "/sesiones/{sesion_id}/ejercicios",
    response_model=EjercicioEntrenamientoRespuesta,
    status_code=201
)
def agregar_ejercicio_sesion(
    sesion_id: int,
    datos: EjercicioEntrenamientoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
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

    nuevo_ejercicio = EjercicioEntrenamiento(
        sesion_id=sesion_id,
        ejercicio_id=datos.ejercicio_id,
        orden_ejercicio=datos.orden_ejercicio,
        notas=datos.notas
    )

    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)

    return nuevo_ejercicio


# --------------------------------------------------
# Actualizar ejercicio realizado
# --------------------------------------------------

@router.put(
    "/sesiones/{sesion_id}/ejercicios/{ejercicio_entrenamiento_id}",
    response_model=EjercicioEntrenamientoRespuesta
)
def actualizar_ejercicio_sesion(
    sesion_id: int,
    ejercicio_entrenamiento_id: int,
    datos: EjercicioEntrenamientoActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicio_entrenamiento = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.id
            == ejercicio_entrenamiento_id,
            EjercicioEntrenamiento.sesion_id == sesion_id
        )
        .first()
    )

    if ejercicio_entrenamiento is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio realizado no encontrado"
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

    ejercicio_entrenamiento.ejercicio_id = (
        datos.ejercicio_id
    )
    ejercicio_entrenamiento.orden_ejercicio = (
        datos.orden_ejercicio
    )
    ejercicio_entrenamiento.notas = datos.notas

    db.commit()
    db.refresh(ejercicio_entrenamiento)

    return ejercicio_entrenamiento


# --------------------------------------------------
# Eliminar ejercicio realizado de una sesión
# --------------------------------------------------

@router.delete(
    "/sesiones/{sesion_id}/ejercicios/{ejercicio_entrenamiento_id}"
)
def eliminar_ejercicio_sesion(
    sesion_id: int,
    ejercicio_entrenamiento_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    sesion = (
        db.query(SesionEntrenamiento)
        .filter(SesionEntrenamiento.id == sesion_id)
        .first()
    )

    if sesion is None:
        raise HTTPException(
            status_code=404,
            detail="Sesión de entrenamiento no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    ejercicio_entrenamiento = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.id
            == ejercicio_entrenamiento_id,
            EjercicioEntrenamiento.sesion_id == sesion_id
        )
        .first()
    )

    if ejercicio_entrenamiento is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio realizado no encontrado"
        )

    db.delete(ejercicio_entrenamiento)
    db.commit()

    return {
        "mensaje": (
            "Ejercicio eliminado de la sesión correctamente"
        )
    }


# --------------------------------------------------
# Listar series de un ejercicio realizado
# --------------------------------------------------

@router.get(
    "/ejercicios-entrenamiento/{ejercicio_entrenamiento_id}/series",
    response_model=list[SerieEntrenamientoRespuesta]
)
def listar_series(
    ejercicio_entrenamiento_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    ejercicio_entrenamiento = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.id
            == ejercicio_entrenamiento_id
        )
        .first()
    )

    if ejercicio_entrenamiento is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio realizado no encontrado"
        )

    sesion = obtener_sesion_de_ejercicio(
        ejercicio_entrenamiento,
        db
    )

    verificar_acceso_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    series = (
        db.query(SerieEntrenamiento)
        .filter(
            SerieEntrenamiento.ejercicio_entrenamiento_id
            == ejercicio_entrenamiento_id
        )
        .order_by(SerieEntrenamiento.numero_serie)
        .all()
    )

    return series


# --------------------------------------------------
# Registrar una serie
# --------------------------------------------------

@router.post(
    "/ejercicios-entrenamiento/{ejercicio_entrenamiento_id}/series",
    response_model=SerieEntrenamientoRespuesta,
    status_code=201
)
def crear_serie(
    ejercicio_entrenamiento_id: int,
    datos: SerieEntrenamientoCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    ejercicio_entrenamiento = (
        db.query(EjercicioEntrenamiento)
        .filter(
            EjercicioEntrenamiento.id
            == ejercicio_entrenamiento_id
        )
        .first()
    )

    if ejercicio_entrenamiento is None:
        raise HTTPException(
            status_code=404,
            detail="Ejercicio realizado no encontrado"
        )

    sesion = obtener_sesion_de_ejercicio(
        ejercicio_entrenamiento,
        db
    )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    nueva_serie = SerieEntrenamiento(
        ejercicio_entrenamiento_id=ejercicio_entrenamiento_id,
        numero_serie=datos.numero_serie,
        repeticiones=datos.repeticiones,
        peso=datos.peso
    )

    db.add(nueva_serie)
    db.commit()
    db.refresh(nueva_serie)

    return nueva_serie


# --------------------------------------------------
# Actualizar una serie
# --------------------------------------------------

@router.put(
    "/series/{serie_id}",
    response_model=SerieEntrenamientoRespuesta
)
def actualizar_serie(
    serie_id: int,
    datos: SerieEntrenamientoActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    serie = (
        db.query(SerieEntrenamiento)
        .filter(SerieEntrenamiento.id == serie_id)
        .first()
    )

    if serie is None:
        raise HTTPException(
            status_code=404,
            detail="Serie no encontrada"
        )

    sesion = obtener_sesion_de_serie(
        serie,
        db
    )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    serie.numero_serie = datos.numero_serie
    serie.repeticiones = datos.repeticiones
    serie.peso = datos.peso

    db.commit()
    db.refresh(serie)

    return serie


# --------------------------------------------------
# Eliminar una serie
# --------------------------------------------------

@router.delete(
    "/series/{serie_id}"
)
def eliminar_serie(
    serie_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    serie = (
        db.query(SerieEntrenamiento)
        .filter(SerieEntrenamiento.id == serie_id)
        .first()
    )

    if serie is None:
        raise HTTPException(
            status_code=404,
            detail="Serie no encontrada"
        )

    sesion = obtener_sesion_de_serie(
        serie,
        db
    )

    verificar_gestion_usuario(
        usuario_id=sesion.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    db.delete(serie)
    db.commit()

    return {
        "mensaje": "Serie eliminada correctamente"
    }