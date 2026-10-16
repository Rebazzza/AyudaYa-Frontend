# API para el Frontend · Donaciones Monetarias y Verificación

Guía de los endpoints relacionados con **fondos/donaciones monetarias (RF42, RF43, RF44)** y la **verificación de donaciones de bienes**, tal como están implementados en el backend.

> Última revisión sobre el código en `src/main/java/com/donaciones`.
> Puedes probar cada endpoint campo por campo en **Swagger**: `http://localhost:8080/swagger-ui.html`

---

## 1. Datos generales

| Concepto | Valor |
|---|---|
| URL base | `http://localhost:8080/api/v1` |
| Formato | `application/json` (salvo multiparte y descarga de imágenes) |
| Documentación interactiva | `/swagger-ui.html` |

### Envoltorio de respuesta

Todas las respuestas usan este sobre:

```json
{
  "timestamp": "2026-10-15T14:00:00.123",
  "status": 200,
  "message": "Donación monetaria registrada correctamente",
  "path": "/api/v1/donaciones-monetarias",
  "data": { }
}
```

En caso de error, el campo `data` se sustituye por `error`:

```json
{ "timestamp": "...", "status": 400, "message": "monto: El monto debe ser mayor a 0",
  "path": "...", "error": "Bad Request" }
```

### Códigos de estado a manejar

| Código | Significado | Cuándo ocurre |
|---|---|---|
| `200` `201` | OK / Creado | operación correcta |
| `400` | Petición inválida | validación de campos, estado inexistente, falta el motivo del rechazo, tamaño de página > 100, eliminación de un aporte verificado |
| `403` | Sin permiso | el verificador no tiene rol de administrador u organización |
| `404` | No existe | id de donación o de usuario inexistente |
| `409` | Conflicto | el número de operación ya está registrado |

---

## 2. Valores de los enums

Usar exactamente estos strings (el backend acepta minúsculas y sinónimos, pero no es lo recomendado):

| Campo | Valores |
|---|---|
| `estado` / `estadoVerificacion` | `PENDIENTE` · `VERIFICADO` · `RECHAZADO` |
| `metodoPago` | `YAPE` · `PLIN` · `TRANSFERENCIA` |
| `moneda` | `PEN` · `USD` |

---

## 3. RF42 · Registrar una donación monetaria

### 3.1 Con foto del voucher (multipart) — `POST /donaciones-monetarias/con-comprobante`

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `idUsuario` | number | **sí** | id del donante logueado |
| `monto` | number | **sí** | `> 0`, ej. `50.00` |
| `moneda` | string | no | `PEN` (por defecto) o `USD` |
| `metodoPago` | string | **sí** | `YAPE` / `PLIN` / `TRANSFERENCIA` |
| `numeroOperacion` | string | **sí** | ≤ 50 caracteres, solo `A-Z a-z 0-9 - _` (sin espacios) |
| `comprobante` | **file** | **sí** | JPG, PNG o WebP · máx. **5 MB** |

```js
const fd = new FormData();
fd.append('idUsuario', 7);
fd.append('monto', 50);
fd.append('moneda', 'PEN');
fd.append('metodoPago', 'YAPE');
fd.append('numeroOperacion', '4962187580551');
fd.append('comprobante', inputFile.files[0]);

await fetch('/api/v1/donaciones-monetarias/con-comprobante', {
  method: 'POST',
  body: fd   // NO poner Content-Type: el navegador lo añade solo
});
```

La donación queda en estado `PENDIENTE`.

### 3.2 Sin foto (JSON) — `POST /donaciones-monetarias`

Mismos campos, pero en JSON y con `comprobanteUrl` (string opcional) en lugar del archivo:

```json
{
  "idUsuario": 7,
  "monto": 50.00,
  "moneda": "PEN",
  "metodoPago": "YAPE",
  "numeroOperacion": "4962187580551",
  "comprobanteUrl": "https://..."
}
```

### 3.3 Adjuntar o reemplazar la foto después — `POST /donaciones-monetarias/{id}/comprobante`

Multipart con el campo `comprobante` (file, obligatorio). Si ya había una foto, la reemplaza.

### 3.4 Ver la foto del voucher — `GET /donaciones-monetarias/{id}/comprobante`

> **Devuelve los bytes de la imagen directamente, no el sobre JSON.**

- Sin comprobante adjunto → `404`.
- Alternativa más simple: usar el campo `comprobanteUrl` de la respuesta (ruta `/uploads/comprobantes/xxx.png`), que ya se sirve públicamente y funciona tal cual en un `<img :src>`.

### 3.5 Aportes de un donante — `GET /donaciones-monetarias/usuario/{idUsuario}`

Devuelve una lista directa en `data`, **sin paginar**.

### 3.6 Detalle y eliminación

| Método | Ruta | Notas |
|---|---|---|
| `GET` | `/donaciones-monetarias/{id}` | detalle de un aporte |
| `DELETE` | `/donaciones-monetarias/{id}` | `400` si el aporte está `VERIFICADO` (protege el consolidado) |

---

## 4. RF43 · Verificación de aportes monetarios

### 4.1 Listado con filtros — `GET /donaciones-monetarias`

Parámetros de consulta (todos opcionales):

| Parámetro | Tipo | Notas |
|---|---|---|
| `estadoVerificacion` | string | `PENDIENTE` para la cola de revisión |
| `metodoPago` | string | |
| `moneda` | string | |
| `idUsuario` | number | |
| `busqueda` | string | nº de operación o nombre del donante |
| `fechaDesde` | ISO-8601 | `2026-01-01T00:00:00` |
| `fechaHasta` | ISO-8601 | |
| `pagina` | number | empieza en **0** (defecto 0) |
| `tamanio` | number | defecto 20, máximo **100** |

```
GET /api/v1/donaciones-monetarias?estadoVerificacion=PENDIENTE&tamanio=20&pagina=0
```

`data` tiene esta forma:

```json
{
  "contenido": [ /* items */ ],
  "pagina": 0,
  "tamanio": 20,
  "totalElementos": 4,
  "totalPaginas": 1
}
```

### 4.2 Verificar o rechazar — `PUT /donaciones-monetarias/{id}/verificar`

```json
{
  "estado": "VERIFICADO",
  "observacionVerificacion": "El voucher es legible y el monto coincide",
  "idVerificador": 9
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `estado` | **sí** | `PENDIENTE`, `VERIFICADO` o `RECHAZADO` |
| `observacionVerificacion` | **sí si `RECHAZADO`** | motivo del rechazo, máx. 500 caracteres |
| `idVerificador` | recomendado | id del admin; si no existe → `404` |

### 4.3 Campos que devuelve cada aporte

| Campo | Descripción |
|---|---|
| `idDonacionMonetaria` | id del aporte |
| `idUsuario` / `nombreDonante` | donante |
| `monto` | monto en la moneda indicada |
| `moneda` | `PEN` o `USD` |
| `metodoPago` | `YAPE` / `PLIN` / `TRANSFERENCIA` |
| `numeroOperacion` | |
| `comprobanteUrl` | ruta pública de la foto |
| `tieneComprobante` | boolean, útil para mostrar aviso de "falta evidencia" |
| `estadoVerificacion` | `PENDIENTE` / `VERIFICADO` / `RECHAZADO` |
| `verificadoPor` | id de quien verificó |
| `observacionesVerificacion` | motivo del rechazo u observación |
| `fechaRegistro` | |
| `fechaVerificacion` | |

---

## 5. RF44 · Panel de recaudación

`GET /donaciones-monetarias/panel` — `GET /donaciones-monetarias/total` devuelve lo mismo (se mantiene por compatibilidad).

```json
{
  "totalRecaudadoPEN": 150.00,
  "totalRecaudadoUSD": 20.00,
  "montoPendientePEN": 40.00,
  "montoRechazadoPEN": 10.00,
  "donacionesVerificadas": 3,
  "donacionesPendientes": 4,
  "donacionesRechazadas": 1,
  "totalDonaciones": 8,
  "desglosePorMoneda": [
    { "concepto": "PEN", "etiqueta": "Sol peruano", "monto": 150.00, "cantidadDonaciones": 3 },
    { "concepto": "USD", "etiqueta": "Dólar estadounidense", "monto": 20.00, "cantidadDonaciones": 2 }
  ],
  "desglosePorMetodoPago": [
    { "concepto": "YAPE", "etiqueta": "Yape", "monto": 100.00, "cantidadDonaciones": 2 }
  ],
  "serieMensual": [
    { "anio": 2026, "mes": 10, "periodo": "2026-10", "monto": 60.00, "cantidadDonaciones": 2 }
  ]
}
```

| Campo | Uso sugerido |
|---|---|
| `totalRecaudadoPEN` / `totalRecaudadoUSD` | tarjetas principales del dashboard |
| `desglosePorMoneda` | tabla o gráfico por moneda |
| `desglosePorMetodoPago` | gráfico de torta Yape/Plin/Transferencia (**solo PEN**) |
| `serieMensual` | gráfico de líneas, últimos 12 meses (**solo PEN**) |
| `donacionesVerificadas` / `Pendientes` / `Rechazadas` | tarjetas de estado |
| `montoPendientePEN` | "en espera de verificación" |
| `montoRechazadoPEN` | "no ingresó" |

> ⚠️ **Los montos van separados por moneda.** El backend no aplica tipo de cambio: suma soles y dólares por apartado. `desglosePorMetodoPago` y `serieMensual` solo incluyen soles.
>
> ⚠️ El consolidado **solo cuenta aportes `VERIFICADO`**. Los `PENDIENTE` y `RECHAZADO` aparecen únicamente en los contadores y en `montoPendientePEN` / `montoRechazadoPEN`.

---

## 6. Verificación de donaciones de bienes (administrador)

### 6.1 Verificar o rechazar — `PUT /donaciones/{id}/verificar`

```json
{
  "estado": "VERIFICADO",
  "observacion": "Cantidades y estado coinciden con lo declarado",
  "idVerificador": 9
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `estado` | **sí** | `PENDIENTE` / `VERIFICADO` / `RECHAZADO` |
| `observacion` | **sí si `RECHAZADO`** | motivo, máx. 500 caracteres |
| `idVerificador` | **sí** | el rol debe ser `Administrador` u `Organizacion`; si no → `403` |

- La verificación es **independiente de `estadoActual`**: no cambia `REGISTRADO` / `EN_TRANSITO` / `EN_ALMACEN`.
- Una donación `RECHAZADA` **no puede pasar a `EN_TRANSITO` ni `EN_ALMACEN`** hasta volver a verificarse.
- Cada verificación deja entrada en el historial y notifica al donante y a la organización.

### 6.2 Cola de revisión — `GET /donaciones/verificacion`

| Parámetro | Notas |
|---|---|
| `estadoVerificacion` | `PENDIENTE` para la cola |
| `idUsuario` | |
| `estadoActual` | `REGISTRADO`, `EN_TRANSITO`, … |
| `busqueda` | código de seguimiento o nombre del donante |
| `pagina` / `tamanio` | igual que en monetarias (máx. 100) |

```
GET /api/v1/donaciones/verificacion?estadoVerificacion=PENDIENTE
```

`DonacionResponse` incluye ahora `estadoVerificacion`, `verificadoPor`, `observacionesVerificacion` y `fechaVerificacion`.

---

## 7. Resumen de endpoints

### Donaciones monetarias

| Método | Ruta | Rol |
|---|---|---|
| `POST` | `/api/v1/donaciones-monetarias` | Donante |
| `POST` | `/api/v1/donaciones-monetarias/con-comprobante` | Donante |
| `POST` | `/api/v1/donaciones-monetarias/{id}/comprobante` | Donante |
| `GET` | `/api/v1/donaciones-monetarias/{id}/comprobante` | Cualquiera |
| `GET` | `/api/v1/donaciones-monetarias` | Administración |
| `GET` | `/api/v1/donaciones-monetarias/{id}` | Cualquiera |
| `GET` | `/api/v1/donaciones-monetarias/usuario/{idUsuario}` | Donante |
| `PUT` | `/api/v1/donaciones-monetarias/{id}/verificar` | Administración |
| `DELETE` | `/api/v1/donaciones-monetarias/{id}` | Administración |
| `GET` | `/api/v1/donaciones-monetarias/panel` · `/total` | Administración |

### Donaciones de bienes

| Método | Ruta | Rol |
|---|---|---|
| `PUT` | `/api/v1/donaciones/{id}/verificar` | Administrador / Organización |
| `GET` | `/api/v1/donaciones/verificacion` | Administración |

---

## 8. Advertencias importantes para el frontend

1. **No hay JWT ni sesión.** El backend no sabe quién hace la llamada: hay que enviar siempre `idUsuario` o `idVerificador` en el body o en la query. No se pueden ocultar estos endpoints por rol desde el backend.
2. **Diferencia de validación de rol:** en donaciones de **bienes** sí se valida que el verificador sea administrador u organización (`403`). En **monetarias** solo se comprueba que el usuario exista.
3. **En multiparte**, los campos van como campos de formulario (como en el ejemplo de JS), no como JSON dentro del form.
4. **`numeroOperacion` no admite espacios ni símbolos** distintos de `-` y `_`. Si el voucher trae un número con puntos o barras, hay que limpiarlo antes de enviarlo.
5. La foto del comprobante se limita a **5 MB** aunque el resto de la aplicación permita hasta 10 MB.
6. **No se puede eliminar un aporte `VERIFICADO`** (error 400). Hay que pasarlo primero a `RECHAZADO` o `PENDIENTE`.
