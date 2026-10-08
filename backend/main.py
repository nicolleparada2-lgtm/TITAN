from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, obtener_db
from modelos.usuario import Usuario
from esquemas.usuario import (
    UsuarioCrear,
    UsuarioAdministrar,
    PerfilActualizar,
    ContrasenaActualizar,
    UsuarioRespuesta
)
from esquemas.autenticacion import (
    LoginDatos,
    TokenRespuesta
)
from seguridad.contrasenas import (
    generar_hash,
    verificar_contrasena
)
from seguridad.jwt import crear_token_acceso
from seguridad.autenticacion import (
    obtener_usuario_actual,
    requerir_admin
)

from rutas.ejercicios import router as ejercicios_router
from rutas.rutinas import router as rutinas_router
from rutas.entrenamientos import router as entrenamientos_router
from rutas.objetivos import router as objetivos_router
from rutas.medidas import router as medidas_router
from rutas.entrenadores import router as entrenadores_router
from rutas.progreso import router as progreso_router
from rutas.mensualidades import router as mensualidades_router
from rutas.notificaciones import router as notificaciones_router


app = FastAPI(
    title="Gestor de Gimnasio API",
    description=(
        "API para la gestión de ejercicios, rutinas, "
        "entrenamientos y progreso."
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(ejercicios_router)
app.include_router(rutinas_router)
app.include_router(entrenamientos_router)
app.include_router(objetivos_router)
app.include_router(medidas_router)
app.include_router(entrenadores_router)
app.include_router(progreso_router)
app.include_router(mensualidades_router)
app.include_router(notificaciones_router)


@app.get("/")
def inicio():
    return {
        "mensaje": (
            "API del Gestor de Gimnasio "
            "funcionando correctamente"
        )
    }


@app.get("/probar-base-datos")
def probar_base_datos():
    with engine.connect() as conexion:
        resultado = conexion.execute(
            text("SELECT current_database();")
        )

        nombre_base_datos = resultado.scalar()

    return {
        "conexion": "correcta",
        "base_datos": nombre_base_datos
    }


@app.get(
    "/usuarios",
    response_model=list[UsuarioRespuesta]
)
def listar_usuarios(
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(requerir_admin)
):
    return (
        db.query(Usuario)
        .order_by(Usuario.id)
        .all()
    )


@app.get(
    "/usuarios/{usuario_id}",
    response_model=UsuarioRespuesta
)
def obtener_usuario(
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

    return usuario


@app.post(
    "/usuarios",
    response_model=UsuarioRespuesta,
    status_code=201
)
def crear_usuario(
    datos: UsuarioCrear,
    db: Session = Depends(obtener_db)
):
    usuario_existente = (
        db.query(Usuario)
        .filter(
            Usuario.nombre_usuario == datos.nombre_usuario
        )
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail=(
                "El nombre de usuario ya está registrado"
            )
        )

    correo_existente = (
        db.query(Usuario)
        .filter(
            Usuario.correo == datos.correo
        )
        .first()
    )

    if correo_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo ya está registrado"
        )

    nuevo_usuario = Usuario(
        nombre_completo=datos.nombre_completo,
        nombre_usuario=datos.nombre_usuario,
        correo=datos.correo,
        contrasena_hash=generar_hash(
            datos.contrasena
        ),
        rol="USUARIO",
        estado="ACTIVO"
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


@app.patch(
    "/usuarios/{usuario_id}",
    response_model=UsuarioRespuesta
)
def administrar_usuario(
    usuario_id: int,
    datos: UsuarioAdministrar,
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

    roles_validos = [
        "ADMIN",
        "ENTRENADOR",
        "USUARIO"
    ]

    estados_validos = [
        "ACTIVO",
        "INACTIVO"
    ]

    if datos.rol not in roles_validos:
        raise HTTPException(
            status_code=400,
            detail=(
                "Rol inválido. Los roles permitidos son: "
                "ADMIN, ENTRENADOR y USUARIO"
            )
        )

    if datos.estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=(
                "Estado inválido. Los estados permitidos "
                "son: ACTIVO e INACTIVO"
            )
        )

    usuario.rol = datos.rol
    usuario.estado = datos.estado

    db.commit()
    db.refresh(usuario)

    return usuario


@app.post(
    "/login",
    response_model=TokenRespuesta
)
def iniciar_sesion(
    datos: LoginDatos,
    db: Session = Depends(obtener_db)
):
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.nombre_usuario
            == datos.nombre_usuario
        )
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "Nombre de usuario o contraseña "
                "incorrectos"
            )
        )

    if not verificar_contrasena(
        datos.contrasena,
        usuario.contrasena_hash
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Nombre de usuario o contraseña "
                "incorrectos"
            )
        )

    if usuario.estado != "ACTIVO":
        raise HTTPException(
            status_code=403,
            detail=(
                "El usuario no se encuentra activo"
            )
        )

    token = crear_token_acceso(
        usuario_id=usuario.id,
        nombre_usuario=usuario.nombre_usuario,
        rol=usuario.rol
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get(
    "/mi-perfil",
    response_model=UsuarioRespuesta
)
def obtener_mi_perfil(
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    return usuario_actual


@app.put(
    "/mi-perfil",
    response_model=UsuarioRespuesta
)
def actualizar_mi_perfil(
    datos: PerfilActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    nombre_completo = datos.nombre_completo.strip()
    nombre_usuario = datos.nombre_usuario.strip()
    correo = datos.correo.strip().lower()

    if not nombre_completo:
        raise HTTPException(
            status_code=400,
            detail="El nombre completo es obligatorio"
        )

    if not nombre_usuario:
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario es obligatorio"
        )

    if not correo:
        raise HTTPException(
            status_code=400,
            detail="El correo es obligatorio"
        )

    usuario_existente = (
        db.query(Usuario)
        .filter(
            Usuario.nombre_usuario == nombre_usuario,
            Usuario.id != usuario_actual.id
        )
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail=(
                "El nombre de usuario ya está registrado"
            )
        )

    correo_existente = (
        db.query(Usuario)
        .filter(
            Usuario.correo == correo,
            Usuario.id != usuario_actual.id
        )
        .first()
    )

    if correo_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo ya está registrado"
        )

    usuario_actual.nombre_completo = nombre_completo
    usuario_actual.nombre_usuario = nombre_usuario
    usuario_actual.correo = correo

    db.commit()
    db.refresh(usuario_actual)

    return usuario_actual


@app.put("/mi-perfil/contrasena")
def actualizar_mi_contrasena(
    datos: ContrasenaActualizar,
    db: Session = Depends(obtener_db),
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):
    if not verificar_contrasena(
        datos.contrasena_actual,
        usuario_actual.contrasena_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta"
        )

    contrasena_nueva = datos.contrasena_nueva.strip()

    if len(contrasena_nueva) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "La nueva contraseña debe tener "
                "mínimo 8 caracteres"
            )
        )

    if verificar_contrasena(
        contrasena_nueva,
        usuario_actual.contrasena_hash
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La nueva contraseña debe ser diferente "
                "a la contraseña actual"
            )
        )

    usuario_actual.contrasena_hash = generar_hash(
        contrasena_nueva
    )

    db.commit()

    return {
        "mensaje": "Contraseña actualizada correctamente"
    }