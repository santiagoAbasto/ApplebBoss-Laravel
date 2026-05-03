# AppleBoss Laravel

Aplicación web para la gestion operativa y comercial de AppleBoss. El proyecto centraliza flujos de ventas, clientes, cotizaciones, inventario, servicios tecnicos, reportes y automatizaciones internas en una arquitectura Laravel + React.

## Resumen

Este repositorio contiene dos capas:

- La raiz del proyecto incluye orquestacion local, Docker y dependencias auxiliares.
- La aplicacion principal vive en [`src/`](/Users/user/Desktop/ApplebBoss-Laravel/src), donde estan Laravel, Inertia, React y la logica de negocio.

## Funcionalidades Principales

- Gestion de clientes para perfiles `admin` y `vendedor`.
- Registro de ventas, egresos y servicios tecnicos.
- Modulos de productos Apple, computadoras, celulares y productos generales.
- Cotizaciones con soporte para exportacion y flujos de WhatsApp.
- Paneles y dashboards por rol.
- Reportes y exportaciones.
- Integracion con Google Drive.
- Automatizaciones y procesos en cola.

## Stack Tecnologico

- Backend: PHP 8.2, Laravel 12, Eloquent, Sanctum.
- Frontend: React 18, Inertia.js, Vite, Tailwind CSS.
- UI y visualizacion: ApexCharts, Chart.js, React Bootstrap, Framer Motion.
- Documentos e integraciones: DomPDF, Google API Client, Flysystem Google Drive.
- Base de datos: PostgreSQL.
- Infraestructura local: Docker Compose, Apache, Node 18, Adminer.

## Estructura Del Repositorio

```text
.
|-- Dockerfile
|-- docker-compose.yml
|-- package.json
|-- README.md
`-- src/
    |-- app/
    |-- bootstrap/
    |-- config/
    |-- database/
    |-- public/
    |-- resources/
    |-- routes/
    |-- storage/
    `-- package.json
```

## Requisitos

- PHP 8.2+
- Composer
- Node.js 18+
- npm
- PostgreSQL 15+ o Docker

## Instalacion Local

1. Clonar el repositorio.
2. Entrar a la aplicacion:

```bash
cd src
```

3. Instalar dependencias:

```bash
composer install
npm install
```

4. Crear el entorno local a partir del ejemplo:

```bash
cp .env.example .env
php artisan key:generate
```

5. Configurar la base de datos y variables necesarias en `.env`.

6. Ejecutar migraciones:

```bash
php artisan migrate
```

7. Levantar el entorno de desarrollo:

```bash
composer run dev
```

Esto inicia servidor Laravel, cola, logs y Vite en paralelo segun la configuracion del proyecto.

## Ejecucion Con Docker

Desde la raiz del repositorio:

```bash
docker compose up --build
```

Servicios incluidos:

- `app`: aplicacion Laravel sobre Apache.
- `queue`: worker de colas.
- `db`: PostgreSQL.
- `node`: Vite en modo desarrollo.
- `adminer`: administrador de base de datos.
- `n8n`: servicio auxiliar de automatizacion local.

## Variables De Entorno

El repositorio incluye una plantilla segura en [`src/.env.example`](/Users/user/Desktop/ApplebBoss-Laravel/src/.env.example).

Variables destacadas:

- Aplicacion: `APP_NAME`, `APP_ENV`, `APP_URL`, `APP_DEBUG`
- Base de datos: `DB_*`
- Mail: `MAIL_*`
- Google Drive: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_DRIVE_FOLDER_ID`
- Automatizacion: `AUTOMATION_TOKEN`

## Seguridad

- Nunca subas `.env`, llaves privadas, tokens ni credenciales reales.
- Usa variables de entorno o un secret manager para entornos compartidos.
- Revisa cualquier configuracion local de `docker-compose.yml` antes de desplegar fuera de desarrollo.
- Mantene `APP_DEBUG=false` y `APP_ENV=production` en produccion.

## Build Y Produccion

Para preparar assets del frontend:

```bash
cd src
npm run build
```

Checklist minimo recomendado para produccion:

- Configurar variables de entorno reales fuera del repositorio.
- Ejecutar `php artisan migrate --force`.
- Compilar assets con `npm run build`.
- Cachear configuracion y rutas:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

- Ejecutar workers de cola bajo un supervisor.
- Configurar backups, monitoreo y rotacion de logs.

## Scripts Utiles

En [`src/package.json`](/Users/user/Desktop/ApplebBoss-Laravel/src/package.json):

- `npm run dev`: frontend con Vite.
- `npm run build`: build de produccion.

En [`src/composer.json`](/Users/user/Desktop/ApplebBoss-Laravel/src/composer.json):

- `composer run dev`: entorno completo local.
- `composer test`: limpia config y ejecuta tests.

## Estado Del Proyecto

Proyecto en evolucion activa. Antes de publicar una version o desplegar a produccion, conviene revisar:

- configuracion de servicios externos,
- credenciales locales en infraestructura auxiliar,
- estado de migraciones y colas,
- cambios pendientes sin commitear.

## Licencia

Este proyecto se distribuye segun la politica interna del equipo o propietario del software. Si vas a hacerlo publico, defini una licencia explicita antes de abrir contribuciones externas.
