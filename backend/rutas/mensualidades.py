from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from esquemas.mensualidad import (
    MensualidadActualizar,
    MensualidadCrear,
    MensualidadRespuesta
)
from esquemas.plan import PlanRespuesta
from modelos.mensualidad import Mensualidad
from modelos.plan import Plan
from modelos.usuario import Usuario
from seguridad.autenticacion import (
    obtener_usuario_actual,
    requerir_admin
)


router = APIRouter(
    prefix="/mensualidades",
    tags=["Mensualidades"]
)


def obtener_plan(
    plan_id: int,
    db: Session
) -> Plan:
    plan = (
        db.query(Plan)
        .filter(Plan.id == plan_id)
        .first()
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Plan no encontrado"
        )

    return plan


def obtener_mensualidad(
    mensualidad_id: int,
    db: Session
) -> Mensualidad:
    mensualidad = (
        db.query(Mensualidad)
        .filter(Mensualidad.id == mensualidad_id)
        .first()
    )

    if mensualidad is None:
        raise HTTPException(
            status_code=404,
            detail="Mensualidad no encontrada"
        )

    return mensualidad


def calcular_fecha_fin(
    fecha_inicio: date,
    duracion_dias: int
) -> date:
    return fecha_inicio + timedelta(
        days=duracion_dias - 1
    )


def calcular_estado(
    fecha_inicio: date,
    fecha_fin: date
) -> str:
    hoy = date.today()

    if fecha_inicio <= hoy <= fecha_fin:
        return "VIGENTE"

    return "VENCIDA"


def actualizar_estado(
    mensualidad: Mensualidad,
    db: Session
) -> None:
    nuevo_estado = calcular_estado(
        mensualidad.fecha_inicio,
        mensualidad.fecha_fin
    )

    if mensualidad.estado != nuevo_estado:
        mensualidad.estado = nuevo_estado
        db.commit()
        db.refresh(mensualidad)


def verificar_periodo_disponible(
    usuario_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    db: Session,
    mensualidad_id: int | None = None
) -> None:
    consulta = (
        db.query(Mensualidad)
        .filter(
            Mensualidad.usuario_id == usuario_id,
            Mensualidad.fecha_inicio <= fecha_fin,
            Mensualidad.fecha_fin >= fecha_inicio
        )
    )

    if mensualidad_id is not None:
        consulta = consulta.filter(
            Mensualidad.id != mensualidad_id
        )

    existente = consulta.first()

    if existente is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "El usuario ya tiene una mensualidad "
                "registrada para ese periodo"
            )
        )


# --------------------------------------------------
# PLANES DISPONIBLES
# Usuarios autenticados
# --------------------------------------------------

@router.get(
    "/planes",
    response_model=list[PlanRespuesta]
)
def listar_planes(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    return (
        db.query(Plan)
        .filter(Plan.estado == "ACTIVO")
        .order_by(Plan.precio)
        .all()
    )


# --------------------------------------------------
# LISTAR TODAS LAS MENSUALIDADES
# Solo ADMIN
# --------------------------------------------------

@router.get(
    "",
    response_model=list[MensualidadRespuesta]
)
def listar_mensualidades(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    mensualidades = (
        db.query(Mensualidad)
        .order_by(Mensualidad.fecha_pago.desc())
        .all()
    )

    for mensualidad in mensualidades:
        actualizar_estado(
            mensualidad,
            db
        )

    return mensualidades


# --------------------------------------------------
# MIS MENSUALIDADES
# Solo cuenta USUARIO
# --------------------------------------------------

@router.get(
    "/mis-mensualidades",
    response_model=list[MensualidadRespuesta]
)
def listar_mis_mensualidades(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    if usuario_actual.rol != "USUARIO":
        raise HTTPException(
            status_code=403,
            detail=(
                "Las mensualidades aplican únicamente "
                "a cuentas con rol USUARIO"
            )
        )

    mensualidades = (
        db.query(Mensualidad)
        .filter(
            Mensualidad.usuario_id == usuario_actual.id
        )
        .order_by(Mensualidad.fecha_pago.desc())
        .all()
    )

    for mensualidad in mensualidades:
        actualizar_estado(
            mensualidad,
            db
        )

    return mensualidades


# --------------------------------------------------
# MENSUALIDADES DE UN USUARIO
# Solo ADMIN
# --------------------------------------------------

@router.get(
    "/usuario/{usuario_id}",
    response_model=list[MensualidadRespuesta]
)
def listar_mensualidades_usuario(
    usuario_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
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

    if usuario.rol != "USUARIO":
        raise HTTPException(
            status_code=400,
            detail=(
                "Las mensualidades solo pueden pertenecer "
                "a cuentas con rol USUARIO"
            )
        )

    mensualidades = (
        db.query(Mensualidad)
        .filter(
            Mensualidad.usuario_id == usuario_id
        )
        .order_by(Mensualidad.fecha_pago.desc())
        .all()
    )

    for mensualidad in mensualidades:
        actualizar_estado(
            mensualidad,
            db
        )

    return mensualidades


# --------------------------------------------------
# CONSULTAR UNA MENSUALIDAD
# ADMIN o propietario
# --------------------------------------------------

@router.get(
    "/{mensualidad_id}",
    response_model=MensualidadRespuesta
)
def consultar_mensualidad(
    mensualidad_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    mensualidad = obtener_mensualidad(
        mensualidad_id,
        db
    )

    if (
        usuario_actual.rol != "ADMIN"
        and mensualidad.usuario_id != usuario_actual.id
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "No tienes permisos para consultar "
                "esta mensualidad"
            )
        )

    actualizar_estado(
        mensualidad,
        db
    )

    return mensualidad


# --------------------------------------------------
# CREAR MENSUALIDAD
# Solo ADMIN
# --------------------------------------------------

@router.post(
    "",
    response_model=MensualidadRespuesta,
    status_code=201
)
def crear_mensualidad(
    datos: MensualidadCrear,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id == datos.usuario_id
        )
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
            detail=(
                "Solo se pueden registrar mensualidades "
                "para cuentas con rol USUARIO"
            )
        )

    plan = obtener_plan(
        datos.plan_id,
        db
    )

    if plan.estado != "ACTIVO":
        raise HTTPException(
            status_code=400,
            detail="El plan seleccionado no está activo"
        )

    if plan.duracion_dias <= 0:
        raise HTTPException(
            status_code=400,
            detail="La duración del plan no es válida"
        )

    fecha_fin = calcular_fecha_fin(
        datos.fecha_inicio,
        plan.duracion_dias
    )

    verificar_periodo_disponible(
        usuario_id=datos.usuario_id,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=fecha_fin,
        db=db
    )

    mensualidad = Mensualidad(
        usuario_id=datos.usuario_id,
        plan_id=plan.id,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=fecha_fin,
        monto=plan.precio,
        estado=calcular_estado(
            datos.fecha_inicio,
            fecha_fin
        )
    )

    db.add(mensualidad)
    db.commit()
    db.refresh(mensualidad)

    return mensualidad


# --------------------------------------------------
# ACTUALIZAR MENSUALIDAD
# Solo ADMIN
# --------------------------------------------------

@router.put(
    "/{mensualidad_id}",
    response_model=MensualidadRespuesta
)
def actualizar_mensualidad(
    mensualidad_id: int,
    datos: MensualidadActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    mensualidad = obtener_mensualidad(
        mensualidad_id,
        db
    )

    plan = obtener_plan(
        datos.plan_id,
        db
    )

    if plan.estado != "ACTIVO":
        raise HTTPException(
            status_code=400,
            detail="El plan seleccionado no está activo"
        )

    if plan.duracion_dias <= 0:
        raise HTTPException(
            status_code=400,
            detail="La duración del plan no es válida"
        )

    fecha_fin = calcular_fecha_fin(
        datos.fecha_inicio,
        plan.duracion_dias
    )

    verificar_periodo_disponible(
        usuario_id=mensualidad.usuario_id,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
        mensualidad_id=mensualidad.id
    )

    mensualidad.plan_id = plan.id
    mensualidad.fecha_inicio = datos.fecha_inicio
    mensualidad.fecha_fin = fecha_fin
    mensualidad.monto = plan.precio
    mensualidad.estado = calcular_estado(
        datos.fecha_inicio,
        fecha_fin
    )

    db.commit()
    db.refresh(mensualidad)

    return mensualidad


# --------------------------------------------------
# ELIMINAR MENSUALIDAD
# Solo ADMIN
# --------------------------------------------------

@router.delete(
    "/{mensualidad_id}"
)
def eliminar_mensualidad(
    mensualidad_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    mensualidad = obtener_mensualidad(
        mensualidad_id,
        db
    )

    db.delete(mensualidad)
    db.commit()

    return {
        "mensaje": "Mensualidad eliminada correctamente"
    }