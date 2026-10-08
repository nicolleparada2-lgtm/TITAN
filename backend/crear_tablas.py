
from database import Base, engine

from modelos import (
    ejercicio,
    ejercicio_entrenamiento,
    ejercicio_rutina,
    entrenador_usuario,
    grupo_muscular,
    medida_corporal,
    mensualidad,
    notificacion,
    objetivo,
    plan,
    rutina,
    serie_entrenamiento,
    sesion_entrenamiento,
    usuario,
)


def crear_tablas():
    Base.metadata.create_all(bind=engine)
    print("Tablas de TITAN creadas o verificadas correctamente.")


if __name__ == "__main__":
    crear_tablas()
