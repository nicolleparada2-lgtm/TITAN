# TITAN 

TITAN es una aplicación web desarrollada para administrar los procesos de un gimnasio y facilitar el seguimiento del entrenamiento personal de sus usuarios.

La plataforma centraliza la gestión de usuarios, entrenadores, ejercicios, rutinas, sesiones de entrenamiento, objetivos, medidas corporales, progreso físico y membresías, mediante una interfaz organizada según el rol de cada persona.

## 1. Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Frontend | Angular, TypeScript, HTML y CSS |
| Backend | Python y FastAPI |
| Base de datos | PostgreSQL |
| ORM | SQLAlchemy |
| Validación de datos | Pydantic |
| Autenticación | JWT |
| Seguridad de contraseñas | Argon2 |
| Gráficas | Chart.js |
| Control de versiones | Git y GitHub |

La comunicación entre frontend y backend se realiza mediante peticiones HTTP a una API REST, utilizando JSON para el intercambio de información.

## 2. Funcionalidades principales

### Gestión de usuarios

- Registro e inicio de sesión.
- Administración de usuarios y asignación de roles.
- Activación e inactivación de cuentas.
- Consulta y actualización del perfil.
- Cambio de contraseña.
- Control de acceso según el rol.

### Gestión de ejercicios y rutinas

- Catálogo de ejercicios organizados por grupos musculares.
- Búsqueda y consulta de ejercicios.
- Creación, edición y eliminación de ejercicios según los permisos.
- Creación y administración de rutinas personalizadas.
- Asociación de ejercicios con rutinas.
- Configuración de series, repeticiones y tiempos de descanso.

### Seguimiento de entrenamientos

- Registro de sesiones de entrenamiento.
- Asociación de ejercicios a cada sesión.
- Registro de series, repeticiones y pesos utilizados.
- Historial de sesiones realizadas.
- Consulta de los entrenamientos de usuarios asignados.

### Objetivos y progreso físico

- Creación y seguimiento de objetivos personales.
- Registro de peso, altura y medidas corporales.
- Consulta del historial de mediciones.
- Visualización de indicadores de progreso.
- Gráficas para analizar la evolución física.

### Gestión de membresías

- Consulta de planes de membresía.
- Administración de mensualidades.
- Seguimiento de fechas de inicio y vencimiento.
- Identificación de membresías próximas a vencer.
- Consulta del plan actual e historial de membresías.
- Notificaciones relacionadas con la cuenta y las membresías.

## 3. Roles del sistema

TITAN cuenta con tres roles principales:

### Administrador — ADMIN

Responsable de la administración general del gimnasio.

Puede gestionar usuarios, asignar roles, administrar ejercicios, relacionar entrenadores con usuarios y controlar las mensualidades.

### Entrenador — ENTRENADOR

Responsable del acompañamiento y seguimiento físico de los usuarios asignados.

Puede consultar las personas bajo su seguimiento y acceder a sus rutinas, entrenamientos, objetivos, medidas corporales e indicadores de progreso, de acuerdo con sus permisos.

### Usuario — USUARIO

Tiene acceso a su espacio personal de entrenamiento.

Puede consultar ejercicios, administrar sus rutinas, registrar entrenamientos, establecer objetivos, guardar medidas corporales, visualizar su progreso y consultar su membresía.

## 4. Arquitectura del sistema

La aplicación utiliza una arquitectura cliente-servidor dividida en tres componentes principales:

```text
Angular
   |
   | HTTP / JSON
   v
FastAPI
   |
   | SQLAlchemy
   v
PostgreSQL
```

**Angular:** presenta la interfaz y permite la interacción del usuario.

**FastAPI:** recibe las solicitudes, ejecuta las validaciones y reglas de negocio, y devuelve las respuestas correspondientes.

**SQLAlchemy:** permite trabajar con los datos mediante modelos de Python.

**PostgreSQL:** almacena de forma persistente la información del sistema.

## 5. Estructura del proyecto

```text
gestor_gimnasio/
|
|-- backend/
|   |-- esquemas/
|   |-- modelos/
|   |-- rutas/
|   |-- seguridad/
|   |-- database.py
|   |-- main.py
|   |-- requirements.txt
|   `-- .env.example
|
|-- database/
|   `-- TITAN-MER.pdf
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   `-- app/
|   |       |-- core/
|   |       |-- layout/
|   |       `-- pages/
|   |-- angular.json
|   |-- package.json
|   `-- package-lock.json
|
|-- .gitignore
`-- README.md
```

### Backend

El backend está organizado en módulos:

- `modelos/`: representación de las tablas mediante SQLAlchemy.
- `esquemas/`: validación de solicitudes y respuestas mediante Pydantic.
- `rutas/`: endpoints de los diferentes módulos.
- `seguridad/`: autenticación, contraseñas y tokens JWT.
- `database.py`: configuración de la conexión con PostgreSQL.
- `main.py`: aplicación principal de FastAPI y registro de rutas.

### Frontend

El frontend está organizado en:

- `core/`: servicios, guards e interceptores.
- `layout/`: estructura visual compartida.
- `pages/`: pantallas correspondientes a las funcionalidades.
- `public/`: recursos estáticos de la aplicación.

## 6. Base de datos

TITAN utiliza PostgreSQL como sistema de gestión de bases de datos relacionales.

El modelo contempla las siguientes entidades:

- Usuarios.
- Entrenador-usuarios.
- Grupos musculares.
- Ejercicios.
- Rutinas.
- Ejercicios de rutina.
- Sesiones de entrenamiento.
- Ejercicios de entrenamiento.
- Series de entrenamiento.
- Objetivos.
- Medidas corporales.
- Planes.
- Mensualidades.
- Notificaciones.

Las relaciones entre estas entidades permiten administrar la información de manera estructurada y reducir la duplicación innecesaria de datos.

El diagrama del modelo relacional está disponible en:

`database/TITAN-MER.pdf`

## 7. Seguridad

La aplicación incorpora mecanismos de seguridad para proteger las cuentas y controlar el acceso a los recursos.

- Autenticación mediante tokens JWT.
- Almacenamiento de contraseñas mediante hash.
- Verificación de identidad para acceder a recursos protegidos.
- Control de permisos mediante roles.
- Guards de Angular para proteger rutas.
- Interceptor HTTP para incorporar el token de autenticación a las solicitudes.
- Validación de datos mediante esquemas Pydantic.
- Restricción de acceso a información personal y datos de usuarios asignados.

Las credenciales privadas se almacenan en archivos de entorno excluidos del control de versiones.

## 8. Requisitos de instalación

Para ejecutar TITAN localmente se requiere:

- Python con soporte para las dependencias del backend.
- Node.js y npm compatibles con la versión de Angular del proyecto.
- PostgreSQL.
- Git.
- Un editor de código, como Visual Studio Code.

## 9. Ejecución del proyecto

### 9.1. Clonar el repositorio

```bash
git clone https://github.com/nicolleparada2-lgtm/TITAN.git
cd TITAN
```

### 9.2. Configurar el backend

Desde la carpeta principal:

```powershell
cd backend
python -m venv .venv
```

En Windows, activar el entorno virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

Instalar las dependencias:

```powershell
pip install -r requirements.txt
```

Crear el archivo `.env` tomando como referencia `.env.example` y establecer los valores reales de conexión a PostgreSQL y autenticación JWT.

### 9.3. Configurar PostgreSQL

Crear una base de datos local en PostgreSQL y configurar sus datos de conexión en `backend/.env`.

Variables utilizadas:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_de_la_base_de_datos
DB_USER=postgres
DB_PASSWORD=tu_contrasena
JWT_SECRET_KEY=tu_clave_secreta
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
```

La base de datos debe disponer de las tablas definidas por los modelos SQLAlchemy antes de realizar las operaciones de la aplicación.

El archivo `TITAN-MER.pdf` documenta el modelo relacional, pero no es un script de creación de tablas.

### 9.4. Iniciar FastAPI

Desde `backend`, con el entorno virtual activo:

```powershell
uvicorn main:app --reload
```

Direcciones locales:

- API: `http://localhost:8000`
- Documentación Swagger: `http://localhost:8000/docs`
- Documentación ReDoc: `http://localhost:8000/redoc`

### 9.5. Configurar el frontend

Abrir otra terminal y entrar a la carpeta `frontend`:

```powershell
cd frontend
npm install
```

Iniciar Angular:

```powershell
npm start
```

Abrir la aplicación en:

`http://localhost:4200`

Es necesario mantener en ejecución tanto el backend como el frontend para utilizar la plataforma.

## 10. API REST

El backend utiliza endpoints HTTP para consultar y administrar la información.

Los principales métodos empleados son:

| Método | Utilidad |
|---|---|
| GET | Consultar información. |
| POST | Crear registros o enviar datos. |
| PATCH | Actualizar parcialmente información. |
| DELETE | Eliminar registros. |

La API emplea respuestas JSON y códigos HTTP para informar el resultado de cada operación.

La documentación interactiva de los endpoints está disponible en Swagger, mediante `/docs`.

## 11. Interfaz de usuario

La interfaz de TITAN está diseñada para facilitar el acceso a las funcionalidades según el rol.

Incluye formularios de autenticación, paneles de inicio, tablas, filtros, tarjetas informativas, formularios de registro y edición, así como gráficas de progreso.

La aplicación incorpora opciones de apariencia clara y oscura, además de una navegación organizada para cada tipo de usuario.

## 12. Documentación del proyecto

La documentación incluye:

- Modelo relacional de la base de datos.
- Organización del backend y frontend.
- Descripción de tecnologías.
- Funcionalidades y permisos por rol.
- Instrucciones de instalación y ejecución.
- Mockups de las principales pantallas de la aplicación.

---

**TITAN — Entrena · Progresa · Mejora**