from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import obtener_db
from modelos.medida_corporal import MedidaCorporal
from modelos.usuario import Usuario
from modelos.entrenador_usuario import EntrenadorUsuario
from esquemas.medida_corporal import (
    MedidaCorporalCrear,
    MedidaCorporalActualizar,
    MedidaCorporalRespuesta
)
from seguridad.autenticacion import (
    obtener_usuario_actual,
    verificar_acceso_usuario,
    verificar_gestion_usuario
)


router = APIRouter(
    tags=["Medidas corporales"]
)


# --------------------------------------------------
# Listar medidas corporales
# --------------------------------------------------

@router.get(
    "/medidas",
    response_model=list[MedidaCorporalRespuesta]
)
def listar_medidas(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    # ADMIN puede ver todas las medidas.
    if usuario_actual.rol == "ADMIN":
        return (
            db.query(MedidaCorporal)
            .order_by(MedidaCorporal.fecha_medicion.desc())
            .all()
        )

    # ENTRENADOR puede ver sus propias medidas y las
    # medidas de los usuarios que tiene asignados.
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
            db.query(MedidaCorporal)
            .filter(
                MedidaCorporal.usuario_id.in_(ids_usuarios)
            )
            .order_by(MedidaCorporal.fecha_medicion.desc())
            .all()
        )

    # USUARIO solo puede ver sus propias medidas.
    return (
        db.query(MedidaCorporal)
        .filter(
            MedidaCorporal.usuario_id == usuario_actual.id
        )
        .order_by(MedidaCorporal.fecha_medicion.desc())
        .all()
    )


# --------------------------------------------------
# Obtener una medida corporal
# --------------------------------------------------

@router.get(
    "/medidas/{medida_id}",
    response_model=MedidaCorporalRespuesta
)
def obtener_medida(
    medida_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    medida = (
        db.query(MedidaCorporal)
        .filter(MedidaCorporal.id == medida_id)
        .first()
    )

    if medida is None:
        raise HTTPException(
            status_code=404,
            detail="Medida corporal no encontrada"
        )

    verificar_acceso_usuario(
        usuario_id=medida.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    return medida


# --------------------------------------------------
# Listar medidas de un usuario
# --------------------------------------------------

@router.get(
    "/usuarios/{usuario_id}/medidas",
    response_model=list[MedidaCorporalRespuesta]
)
def listar_medidas_usuario(
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

    medidas = (
        db.query(MedidaCorporal)
        .filter(
            MedidaCorporal.usuario_id == usuario_id
        )
        .order_by(MedidaCorporal.fecha_medicion.asc())
        .all()
    )

    return medidas


# --------------------------------------------------
# Crear medida corporal
# --------------------------------------------------

@router.post(
    "/medidas",
    response_model=MedidaCorporalRespuesta,
    status_code=201
)
def crear_medida(
    datos: MedidaCorporalCrear,
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

    nueva_medida = MedidaCorporal(
        usuario_id=datos.usuario_id,
        fecha_medicion=datos.fecha_medicion,
        peso=datos.peso,
        altura=datos.altura,
        pecho=datos.pecho,
        cintura=datos.cintura,
        cadera=datos.cadera,
        brazo_izquierdo=datos.brazo_izquierdo,
        brazo_derecho=datos.brazo_derecho,
        muslo_izquierdo=datos.muslo_izquierdo,
        muslo_derecho=datos.muslo_derecho
    )

    db.add(nueva_medida)
    db.commit()
    db.refresh(nueva_medida)

    return nueva_medida


# --------------------------------------------------
# Actualizar medida corporal
# --------------------------------------------------

@router.put(
    "/medidas/{medida_id}",
    response_model=MedidaCorporalRespuesta
)
def actualizar_medida(
    medida_id: int,
    datos: MedidaCorporalActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    medida = (
        db.query(MedidaCorporal)
        .filter(MedidaCorporal.id == medida_id)
        .first()
    )

    if medida is None:
        raise HTTPException(
            status_code=404,
            detail="Medida corporal no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=medida.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    medida.fecha_medicion = datos.fecha_medicion
    medida.peso = datos.peso
    medida.altura = datos.altura
    medida.pecho = datos.pecho
    medida.cintura = datos.cintura
    medida.cadera = datos.cadera
    medida.brazo_izquierdo = datos.brazo_izquierdo
    medida.brazo_derecho = datos.brazo_derecho
    medida.muslo_izquierdo = datos.muslo_izquierdo
    medida.muslo_derecho = datos.muslo_derecho

    db.commit()
    db.refresh(medida)

    return medida


# --------------------------------------------------
# Eliminar medida corporal
# --------------------------------------------------

@router.delete(
    "/medidas/{medida_id}"
)
def eliminar_medida(
    medida_id: int,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    medida = (
        db.query(MedidaCorporal)
        .filter(MedidaCorporal.id == medida_id)
        .first()
    )

    if medida is None:
        raise HTTPException(
            status_code=404,
            detail="Medida corporal no encontrada"
        )

    verificar_gestion_usuario(
        usuario_id=medida.usuario_id,
        usuario_actual=usuario_actual,
        db=db
    )

    db.delete(medida)
    db.commit()

    return {
        "mensaje": "Medida corporal eliminada correctamente"
    }