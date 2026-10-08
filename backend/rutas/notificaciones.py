from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from esquemas.notificacion import NotificacionRespuesta
from modelos.mensualidad import Mensualidad
from modelos.notificacion import Notificacion
from modelos.plan import Plan
from modelos.usuario import Usuario
from seguridad.autenticacion import obtener_usuario_actual


router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)


def crear_notificacion_si_no_existe(
    usuario_id: int,
    titulo: str,
    mensaje: str,
    tipo: str,
    db: Session
) -> None:
    existente = (
        db.query(Notificacion)
        .filter(
            Notificacion.usuario_id == usuario_id,
            Notificacion.titulo == titulo,
            Notificacion.mensaje == mensaje,
            Notificacion.tipo == tipo
        )
        .first()
    )

    if existente is not None:
        return

    notificacion = Notificacion(
        usuario_id=usuario_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        leida=False
    )

    db.add(notificacion)


def generar_notificaciones_mensualidad(
    usuario_id: int,
    db: Session
) -> None:
    hoy = date.today()

    mensualidad = (
        db.query(Mensualidad)
        .filter(
            Mensualidad.usuario_id == usuario_id
        )
        .order_by(Mensualidad.fecha_fin.desc())
        .first()
    )

    if mensualidad is None:
        return

    plan = (
        db.query(Plan)
        .filter(
            Plan.id == mensualidad.plan_id
        )
        .first()
    )

    nombre_plan = (
        plan.nombre
        if plan is not None
        else "actual"
    )

    dias_restantes = (
        mensualidad.fecha_fin - hoy
    ).days

    if dias_restantes < 0:
        mensualidad.estado = "VENCIDA"

        titulo = "Tu mensualidad ha vencido"

        mensaje = (
            f"Tu Plan {nombre_plan} venció el "
            f"{mensualidad.fecha_fin.strftime('%d/%m/%Y')}. "
            "Renueva tu mensualidad para mantener vigente "
            "tu membresía."
        )

        crear_notificacion_si_no_existe(
            usuario_id=usuario_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo="MENSUALIDAD_VENCIDA",
            db=db
        )

    elif dias_restantes <= 5:
        mensualidad.estado = "VIGENTE"

        titulo = "Tu mensualidad vence pronto"

        if dias_restantes == 0:
            mensaje = (
                f"Tu Plan {nombre_plan} vence hoy. "
                "Renueva tu mensualidad para mantener "
                "vigente tu membresía."
            )
        elif dias_restantes == 1:
            mensaje = (
                f"Tu Plan {nombre_plan} vence mañana, "
                f"{mensualidad.fecha_fin.strftime('%d/%m/%Y')}. "
                "Recuerda renovar tu mensualidad."
            )
        else:
            mensaje = (
                f"Tu Plan {nombre_plan} vence en "
                f"{dias_restantes} días, el "
                f"{mensualidad.fecha_fin.strftime('%d/%m/%Y')}. "
                "Recuerda renovar tu mensualidad."
            )

        crear_notificacion_si_no_existe(
            usuario_id=usuario_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo="MENSUALIDAD_POR_VENCER",
            db=db
        )

    db.commit()


@router.get(
    "",
    response_model=list[NotificacionRespuesta]
)
def listar_mis_notificaciones(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    if usuario_actual.rol == "USUARIO":
        generar_notificaciones_mensualidad(
            usuario_actual.id,
            db
        )

    return (
        db.query(Notificacion)
        .filter(
            Notificacion.usuario_id == usuario_actual.id
        )
        .order_by(
            Notificacion.fecha_creacion.desc()
        )
        .all()
    )


@router.get(
    "/no-leidas",
    response_model=list[NotificacionRespuesta]
)
def listar_notificaciones_no_leidas(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    if usuario_actual.rol == "USUARIO":
        generar_notificaciones_mensualidad(
            usuario_actual.id,
            db
        )

    return (
        db.query(Notificacion)
        .filter(
            Notificacion.usuario_id == usuario_actual.id,
            Notificacion.leida.is_(False)
        )
        .order_by(
            Notificacion.fecha_creacion.desc()
        )
        .all()
    )


@router.patch(
    "/{notificacion_id}/leer",
    response_model=NotificacionRespuesta
)
def marcar_como_leida(
    notificacion_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    notificacion = (
        db.query(Notificacion)
        .filter(
            Notificacion.id == notificacion_id
        )
        .first()
    )

    if notificacion is None:
        raise HTTPException(
            status_code=404,
            detail="Notificación no encontrada"
        )

    if notificacion.usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "No tienes permisos para modificar "
                "esta notificación"
            )
        )

    notificacion.leida = True

    db.commit()
    db.refresh(notificacion)

    return notificacion


@router.patch(
    "/leer-todas"
)
def marcar_todas_como_leidas(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    notificaciones = (
        db.query(Notificacion)
        .filter(
            Notificacion.usuario_id == usuario_actual.id,
            Notificacion.leida.is_(False)
        )
        .all()
    )

    for notificacion in notificaciones:
        notificacion.leida = True

    db.commit()

    return {
        "mensaje": "Notificaciones marcadas como leídas"
    }