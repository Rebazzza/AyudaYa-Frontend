# Especificaciones Funcionales — Frontend AyudaYa

Este documento describe las especificaciones y requerimientos que cumple el frontend de **AyudaYa**, una Plataforma Nacional de Donaciones (ONG) construida en Angular.

- **Stack:** Angular (standalone components), Tailwind CSS, Leaflet, servicios REST contra `http://localhost:8080/api/v1`.
- **Rol** se controla mediante guards y la propiedad `nombreRol` del usuario.

---

## Índice de funcionalidades

| # | Módulo | Ruta(s) | Rol mínimo |
|---|--------|---------|------------|
| 1 | Autenticación (Login / Registro) | `/login`, `/registro` | Invitado |
| 2 | Dashboard (panel principal) | `/` | Autenticado |
| 3 | Locales de recepción | `/locales`, `/locales/nuevo`, `/locales/:id` | Autenticado (crear: solo Admin) |
| 4 | Donaciones de insumos (registro/listado) | `/donaciones`, `/donaciones/nueva` | Autenticado |
| 5 | Trazabilidad/seguimiento de donación | `/donaciones/:id`, `/seguimiento` | Autenticado |
| 6 | Donación monetaria | `/donaciones/monetaria` | Autenticado |
| 7 | Verificación de fondos | `/verificar-fondos` | Solo Admin |
| 8 | Seguimiento de kits | `/kits/seguimiento` | Autenticado |
| 9 | Categorías de insumos | `/categorias` | Autenticado (editar: no-donante) |
| 10 | Gestión de trabajadores | `/trabajadores` | Solo Admin |
| 11 | Notificaciones | `/notificaciones` | Autenticado |
| 12 | Almacén — Corroboración | `/almacen/verificar` | Autenticado (necesita perfil trabajador) |
| 13 | Almacén — Inventario | `/almacen/inventario` | Autenticado |
| 14 | Almacén — Etiquetas QR | `/almacen/etiquetas` | Autenticado |
| 15 | Almacén — Armar kits | `/almacen/kits` | Autenticado |
| 16 | Componente transversal: Navbar | — | Según rol |

---

## 1. Autenticación

### Login (`/login`)
- Permite iniciar sesión aceptando **correo o DNI**.
- Alternar perfil visual (Soy Donante / Personal de Acopio); mostrar/ocultar contraseña.
- **"Recordarme en este dispositivo"**: guarda sesión en `localStorage`, o en `sessionStorage` si no está marcado.
- Botones alternativos: **DNIe/Clave Digital** y **Google** (placeholders).
- Redirección tras login a la URL guardada en `?redirect=` (sanitizada contra open-redirect).
- Validación: ambos campos no vacíos.

### Registro (`/registro`)
- Crear cuenta como **Donante** o **Personal de Apoyo** (pestañas).
- Campos: DNI (8 dígitos), nombres, apellidos, correo, teléfono (9 dígitos), contraseña + confirmación.
- **Solo Donante:** subida de fotos de DNI frontal y reverso (opcional, JPG/PNG/WebP, máx. 10 MB, con preview).
- Validaciones: contraseñas coinciden, `minlength="8"`, formatos de archivo válidos.
- Al registrarse, inicia sesión automáticamente y navega a `/`.

---

## 2. Dashboard (`/`)

- Saludo por hora del día, nombre, iniciales y chip de rol.
- **KPIs:** donaciones (solo las suyas si es Donante), cantidad declarada, notificaciones sin leer, total de locales.
- Distribución por estado de donaciones (Registrado, En tránsito, En almacén, Verificado, Entregado, Anulado).
- **Solo Admin:** banner "Total recaudado" (S/) y atajo a Verificar fondos.
- Donaciones recientes (5) y notificaciones recientes (5).
- **Accesos rápidos dinámicos por rol** + botón "Nueva donación".

---

## 3. Locales de recepción

### Listado (`/locales`)
- Tarjetas: nombre, dirección, teléfono, lat/long, capacidad en m³.
- **Solo Admin** ve botón "+ Registrar local". Otros roles solo lectura.

### Registro (`/locales/nuevo`) — solo Admin
- Formulario: nombre, dirección, latitud, longitud, capacidad (mín. 0.01), teléfono.
- Solo soporta `registrar` (POST). Sin edición ni eliminación en frontend.

### Detalle (`/locales/:id`)
- Datos del local + **mapa de Google Maps embebido** (iframe sanitizado), enlace "Ver en Google Maps", estado Activo/Inactivo.

---

## 4. Donaciones de insumos

### Listado (`/donaciones`)
- Tabla: código de seguimiento, fecha, donante, local, estado, acción "Ver".
- Filtros: búsqueda en cliente (donante, código, local) y filtro por estado (servidor).
- El **Donante solo ve sus donaciones**; trabajador y admin ven todas.
- Estados: `REGISTRADO`, `EN_TRANSITO`, `EN_ALMACEN`, `VERIFICADO`, `ENTREGADO`, `ANULADO`, `RECHAZADA`.

### Registro (`/donaciones/nueva`)
- Cabecera: local de recepción y donante.
  - Donante → se fija a sí mismo; otro rol → elige un donante o **crea uno nuevo** desde modal.
- **Filas dinámicas de insumos:** categoría (muestra unidad), descripción (máx. 200), cantidad (mín. 0.01), fecha de vencimiento (opcional).
- Validaciones: local obligatorio, donante obligatorio, al menos una fila con categoría y cantidad > 0.
- Éxito: muestra el **código de seguimiento** generado, con opciones "Ver detalle" / "Registrar otra donación".

---

## 5. Trazabilidad / Seguimiento de donación

Rutas: `/donaciones/:id` y `/seguimiento` (búsqueda por código).

**Información mostrada:**
- Resumen: código (copiar / descargar comprobante PDF), donante + DNI, local, trabajador, fecha de expiración.
- **Stepper:** Registrado → En tránsito → Verificado → Entregado (En almacén se normaliza a "En tránsito").
- Mapa de ubicación (GPS del último escaneo o local actual).
- Tabla de insumos: cantidad declarada (prometida) vs verificada.
- Galería de evidencias (hasta 3 imágenes, lightbox).
- Historial de movimientos (timeline) / notificaciones al donante.

**Acciones por rol:**
- **Trabajador/Admin:** escanear punto GPS (geolocalización, alta precisión), cambiar estado, subir/eliminar evidencias (`EVIDENCIA_RECEPCION`), notificar al donante.
- **Donante (dueño):** anular solo si estado `REGISTRADO` (según `puedeAnular`).
- **Cualquier autenticado:** descargar comprobante PDF, copiar código.

**Máquina de transiciones:**
```
REGISTRADO → EN_TRANSITO, EN_ALMACEN, ANULADO
EN_TRANSITO → VERIFICADO
EN_ALMACEN  → VERIFICADO
VERIFICADO  → ENTREGADO
ENTREGADO/ANULADO → (terminal)
```

---

## 6. Donación monetaria (`/donaciones/monetaria`)

- Aporte en soles (S/) mediante **YAPE, PLIN o TRANSFERENCIA**.
- Campos: monto (> 0), método de pago, número de operación.
- Adjuntar **captura del comprobante** (opcional, JPG/PNG/WebP, con preview y estado de subida).
- Estado inicial **PENDIENTE** hasta verificación. Moneda fija `PEN`.

---

## 7. Verificación de fondos (`/verificar-fondos`) — solo Admin

- Total recaudado en soles.
- Listado de donaciones monetarias con monto, donante, nº de operación, método, moneda, fecha.
- Ver **pendientes**, abrir voucher (`comprobanteUrl`).
- **Verificar** (`VERIFICADO`) o **Rechazar** (`RECHAZADO`); recalcula el total.
- Botón "Reintentar" ante errores de carga.

---

## 8. Seguimiento de kits (`/kits/seguimiento`)

- Búsqueda de kit por código (`KIT-2026-XXXXXX`).
- Muestra: código, nombre, centro de acopio, fecha de armado, estado (`DISPONIBLE`, `RESERVADO`, `ENTREGADO`) y contenido (categoría, cantidad, unidad).

---

## 9. Categorías de insumos (`/categorias`)

- **CRUD completo** del catálogo de insumos.
- Datos: nombre (máx. 50), unidad de medida (máx. 20), flag "requiere refrigeración".
- **Donante:** solo lectura. **No-donante (Apoyo/Admin):** crear, editar, eliminar (con confirmación).

---

## 10. Gestión de trabajadores (`/trabajadores`) — solo Admin

- Listado: nombre completo, DNI, local, cargo, fecha de contratación.
- **Crear/Editar:** usuario disponible (se filtran los ya trabajadores), local, cargo (máx. 50), fecha opcional.
- Validaciones: usuario, local y cargo obligatorios.
- Sin eliminación en frontend.

---

## 11. Notificaciones (`/notificaciones`)

- Bandeja del usuario actual con estado leída/no leída y fecha.
- Marcar como leída (`PUT /notificaciones/:id/leido`).
- Eliminar (`DELETE /notificaciones/:id`).

---

## 12. Almacén — Corroboración de recepción (`/almacen/verificar`)

**Requiere perfil de trabajador** (si no lo tiene, muestra error y bloquea).

- Buscar donación por código o seleccionarla de la lista de verificables (excluye ANULADO/RECHAZADA).
- **Tabla de insumos interactiva:** cantidad "Recibido (Real)"; detecta **incidencia**: `EXCEDENTE` o `FALTANTE` (badge).
- **Panel resumen:** total de ítems, ítems con incidencias, nº de evidencias, estado del GPS.
- **Capturar GPS** (geolocalización) para el punto de recepción.
- Adjuntar hasta **3 evidencias fotográficas** (JPG/PNG/WebP, 10 MB).
- **Validar y Confirmar Recepción** (habilitado al completar cantidades ≥ 0). Con incidencias muestra modal de confirmación.
- Envía `POST /almacen/corroborar` y luego sube evidencias `EVIDENCIA_RECEPCION`.

---

## 13. Almacén — Inventario (`/almacen/inventario`)

- Selección de centro de acopio o **"Todos los centros"** (consolidado por categoría).
- **Stock verificado por categoría:** tarjetas con stock total, unidad, icono de refrigeración y badge de incidencias.
- **Alertas de caducidad:** crítica si `diasRestantes <= 5`, próxima si < 15 días (banner destacado).

---

## 14. Almacén — Etiquetas QR (`/almacen/etiquetas`)

- Lista donaciones en estado **EN_ALMACEN**.
- Selección individual o "seleccionar todas".
- **Imprimir etiquetas:** genera y descarga PDF A4 recortable (3x4) mediante `POST /documentos/etiquetas-qr`.
- Utilidad de prueba: "Probar plantilla de correo" (`POST /documentos/notificar-test`) para validar envíos de correo sin afectar datos reales.

---

## 15. Almacén — Armar kits (`/almacen/kits`)

- Selecciona centro de acopio; muestra **inventario verificado disponible** (categoría, stock, unidad, refrigeración).
- Configura **nombre del kit**, **cantidad de kits** (≥ 1) y **filas de insumos por kit** (categoría + cantidad, con indicador de stock disponible).
- **Armar kits** (`POST /kits/armar`): valida local, nombre, cantidad e insumos; muestra códigos creados (`KIT-...`), toast de éxito/error (p. ej. stock insuficiente), refresca inventario.
- **Descargar etiquetas QR** de los kits recién creados.

---

## 16. Navbar (componente transversal)

- **No autenticado:** Iniciar sesión / Registrarse.
- **Autenticado:** Inicio, Locales, Donaciones; **Donante** → Donación monetaria; **Trabajador/Admin** → Verificar, Inventario, Etiquetas, Armar kits; todos → Kits, Categorías, Notificaciones; **Admin** → Fondos, Trabajadores.
- Muestra nombre de usuario y botón **Salir** (limpia sesión).
- Menú móvil con toggle y auto-ocultado al hacer scroll.

---

## Requerimientos transversales

### Autenticación y sesión
- `AuthService` (login/register), `SessionService` (bucket `localStorage`/`sessionStorage`, clave `ayudaya_user`).
- Guards:
  - `authGuard` → redirige a `/login?redirect=<ruta>` si no hay sesión.
  - `adminGuard` → redirige a `/` si no es Administrador.
  - `guestGuard` → redirige a `/` si ya hay sesión.
- Registro auto-loguea al usuario.

### Roles
- **Administrador:** guard `adminGuard` (trabajadores, verificar-fondos, locales/nuevo), KPIs de recaudación.
- **Donante:** solo sus donaciones; anula en estado REGISTRADO; registra (es el donante por defecto); donación monetaria; categorías solo lectura.
- **Personal de Apoyo:** operaciones de almacén, corroboración (requiere perfil trabajador), evidencias, escaneo GPS, cambio de estado.
- Roles registrables: `DONANTE | PERSONAL_APOYO`. **Administrador no es registrable desde el frontend.**

### Infraestructura
- **Lazy loading** en todas las rutas (`loadComponent`).
- `provideHttpClient()` y router; sin interceptores HTTP (sesión en storage).
- **Pipe `SafeUrlPipe`** para iframes de Google Maps.
- **Geolocalización** del navegador en escaneo GPS y corroboración.
- **Descarga de PDFs** (comprobantes y etiquetas QR) mediante `DocumentoService.descargarBlob`.
- Frontend con componentes standalone + signals, Tailwind CSS y Angular Material Symbols.

---

## Matriz CRUD soportada

| Entidad | Crear | Leer | Editar | Eliminar |
|---|---|---|---|---|
| Usuario | Registro (+ donante en formulario) | Sí (listar) | No | No |
| Local | Sí (solo Admin) | Sí | No | No |
| Donación insumos | Sí | Sí | No directo (estados/anular) | No |
| Donación monetaria | Sí | Sí | No (solo verificación de estado) | No |
| Categoría | Sí (no donante) | Sí | Sí (no donante) | Sí (no donante) |
| Trabajador | Sí (Admin) | Sí | Sí (Admin) | No |
| Notificación | No (backend) | Sí | No (marcar leída) | Sí |
| Kit | Sí (armar) | Sí (por código) | No | No |