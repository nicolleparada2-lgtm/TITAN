from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.usuario import Usuario
from modelos.medida_corporal import MedidaCorporal
from modelos.sesion_entrenamiento import SesionEntrenamiento
from modelos.objetivo import Objetivo
from esquemas.progreso import (
    ProgresoPesoRespuesta,
    ProgresoMedidasRespuesta,
    ResumenProgresoRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    verificar_acceso_usuario
)


router = APIRouter(
    tags=["Progreso"]
)


# --------------------------------------------------
# Verificar que el usuario exista
# --------------------------------------------------

def verificar_usuario(
    usuario_id: int,
    db: Session
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

    return usuario


# --------------------------------------------------
# Evolución del peso
# --------------------------------------------------

@router.get(
    "/usuarios/{usuario_id}/progreso/peso",
    response_model=list[ProgresoPesoRespuesta]
)
def obtener_progreso_peso(
    usuario_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    verificar_usuario(
        usuario_id=usuario_id,
        db=db
    )

    verificar_acceso_usuario(
        usuario_id=usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    medidas = (
        db.query(MedidaCorporal)
        .filter(
            MedidaCorporal.usuario_id == usuario_id,
            MedidaCorporal.peso.isnot(None)
        )
        .order_by(MedidaCorporal.fecha_medicion.asc())
        .all()
    )

    return [
        ProgresoPesoRespuesta(
            fecha=medida.fecha_medicion,
            peso=medida.peso
        )
        for medida in medidas
    ]


# --------------------------------------------------
# Evolución de medidas corporales
# --------------------------------------------------

@router.get(
    "/usuarios/{usuario_id}/progreso/medidas",
    response_model=list[ProgresoMedidasRespuesta]
)
def obtener_progreso_medidas(
    usuario_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    verificar_usuario(
        usuario_id=usuario_id,
        db=db
    )

    verificar_acceso_usuario(
        usuario_id=usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    medidas = (
        db.query(MedidaCorporal)
        .filter(
            MedidaCorporal.usuario_id == usuario_id
        )
        .order_by(MedidaCorporal.fecha_medicion.asc())
        .all()
    )

    return [
        ProgresoMedidasRespuesta(
            fecha=medida.fecha_medicion,
            pecho=medida.pecho,
            cintura=medida.cintura,
            cadera=medida.cadera,
            brazo_izquierdo=medida.brazo_izquierdo,
            brazo_derecho=medida.brazo_derecho,
            muslo_izquierdo=medida.muslo_izquierdo,
            muslo_derecho=medida.muslo_derecho
        )
        for medida in medidas
    ]


# --------------------------------------------------
# Resumen general de progreso
# --------------------------------------------------

@router.get(
    "/usuarios/{usuario_id}/progreso/resumen",
    response_model=ResumenProgresoRespuesta
)
def obtener_resumen_progreso(
    usuario_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    verificar_usuario(
        usuario_id=usuario_id,
        db=db
    )

    verificar_acceso_usuario(
        usuario_id=usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    total_sesiones = (
        db.query(SesionEntrenamiento)
        .filter(
            SesionEntrenamiento.usuario_id == usuario_id
        )
        .count()
    )

    objetivos = (
        db.query(Objetivo)
        .filter(
            Objetivo.usuario_id == usuario_id
        )
        .all()
    )

    total_objetivos = len(objetivos)

    objetivos_en_progreso = sum(
        1
        for objetivo in objetivos
        if objetivo.estado == "EN_PROGRESO"
    )

    objetivos_completados = sum(
        1
        for objetivo in objetivos
        if objetivo.estado == "COMPLETADO"
    )

    medidas_peso = (
        db.query(MedidaCorporal)
        .filter(
            MedidaCorporal.usuario_id == usuario_id,
            MedidaCorporal.peso.isnot(None)
        )
        .order_by(MedidaCorporal.fecha_medicion.asc())
        .all()
    )

    peso_inicial = None
    peso_actual = None
    cambio_peso = None

    if medidas_peso:
        peso_inicial = medidas_peso[0].peso
        peso_actual = medidas_peso[-1].peso
        cambio_peso = peso_actual - peso_inicial

    return ResumenProgresoRespuesta(
        usuario_id=usuario_id,
        total_sesiones=total_sesiones,
        total_objetivos=total_objetivos,
        objetivos_en_progreso=objetivos_en_progreso,
        objetivos_completados=objetivos_completados,
        peso_inicial=peso_inicial,
        peso_actual=peso_actual,
        cambio_peso=cambio_peso
    )