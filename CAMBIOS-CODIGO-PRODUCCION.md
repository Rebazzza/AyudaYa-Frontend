# Cambios de código (fuera de los tests) — Consolidación de pruebas unitarias PUS.md

**Fecha:** 19-10-2026  
**Alcance:** comparación de `PUS.md` (PU-01 … PU-25) con los tests existentes, escritura de las pruebas faltantes y documentación de todo lo que se tocó en `src/main` para que esas pruebas existan o pasen.

---

## 1. Resultado de la suite

| Métrica | Antes | Después |
|---|---|---|
| Tests ejecutados | 146 | **173** (+27) |
| Fallos (`Failures`) | 0 | **0** |
| Errores (`Errors`) | 1 | **1** (el mismo, preexistente) |
| Archivos de test | 24 | **29** (5 nuevos) |

> El único error es `AyudaYaBackendApplicationTests.contextLoads`, que **ya fallaba antes de mis cambios**: es un `@SpringBootTest` que intenta conectar a MySQL local (`localhost:3306`) y en este entorno no hay base de datos levantada. No está relacionado con las PU nuevas.

---

## 2. Cambios en código de producción (`src/main`)

Se tocaron **5 archivos** de producción. Todos los cambios están en la rama de trabajo, sin commitear.

### 2.1 `entity/Trabajador.java` — nuevo campo `estadoActivo` (RF10 / PU-05)

```java
@Builder.Default
@Column(name = "estadoActivo")
private Boolean estadoActivo = true;

@PrePersist
public void prePersist() {
    if (estadoActivo == null) {
        estadoActivo = true;
    }
}
```

* **Por qué:** el PUS exige que la baja de un trabajador sea **lógica** (`estadoActivo = false`) y no un `DELETE`. La entidad no tenía ningún estado que apagar.
* **Impacto en BD:** con `spring.jpa.hibernate.ddl-auto=update` Hibernate agrega la columna `estadoActivo` automáticamente al arrancar.
* **Decisión de diseño:** la columna se creó **sin `NOT NULL`** a propósito. Si se marcara `NOT NULL`, los registros de trabajadores ya existentes quedarían todos con el valor implícito `false` (o fallaría la migración en modo estricto). Con `NULL` permitido:
  * filas nuevas → `true` (por `@Builder.Default` y `@PrePersist`);
  * filas antiguas → `NULL`, que se **interpreta como activo** (ver 2.2).

### 2.2 `service/TrabajadorService.java` — método `desactivarTrabajador(Integer id)`

```java
@Transactional
public TrabajadorResponse desactivarTrabajador(Integer id) {
    Trabajador trabajador = findByIdOrThrow(id);
    trabajador.setEstadoActivo(false);
    return toResponse(trabajadorRepository.save(trabajador));
}
```

* Además se añadió al mapeo `toResponse`:
  `.estadoActivo(!Boolean.FALSE.equals(trabajador.getEstadoActivo()))`
  → cualquier fila `NULL` (anterior a la columna) se reporta como **activa**.
* El método **no invoca** `delete()` ni `deleteById()`; la PU-05 verifica exactamente eso con `verify(..., never())`.

### 2.3 `dto/response/TrabajadorResponse.java` — nuevo atributo

```java
private Boolean estadoActivo;
```

Se agrega para que la baja lógica sea observable por el cliente (es un DTO de respuesta: es aditivo y **no rompe** a los consumidores existentes).

### 2.4 `controller/TrabajadorController.java` — nuevo endpoint

```
PATCH /api/v1/trabajadores/{id}/desactivar
```

* **Por qué:** sin endpoint el nuevo método del servicio sería código muerto inalcanzable desde la API.
* Documentado en Swagger con `@Operation` (RF10, baja lógica sin borrado físico).
* `DELETE /{id}` **se conservó igual** (borrado físico) para no romper el comportamiento actual de la API; ver recomendación en la sección 5.

### 2.5 `entity/Kit.java` — **corrección de bug** (PU-18 / PU-19)

```diff
+ @Builder.Default
  @OneToMany(mappedBy = "kit", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DetalleKit> detalles = new ArrayList<>();
```

* **Qué fallaba:** `KitServiceImpl.armarKits(...)` construye los kits con `Kit.builder()…build()`. Lombok **ignora** el inicializador `= new ArrayList<>()` cuando no hay `@Builder.Default`, así que `detalles` llegaba en `null` y `kit.agregarDetalle(...)` lanzaba `NullPointerException` en tiempo de ejecución.
* **Evidencia:** el nuevo `KitServiceTest` (PU-18/PU-19) revienta exactamente ahí sin este cambio; antes no había ningún test que ejercitara `armarKits`, por eso el bug pasaba desapercibido.
* **Impacto:** es un arreglo de comportamiento (antes era un 500 en runtime), no un cambio de regla de negocio. `Donacion` ya usaba `@Builder.Default` en su lista equivalente, con lo que este caso era una omisión.

---

## 3. Cambios que **NO** se hicieron en producción (adaptaciones solo de test)

Estos casos del `PUS.md` describen clases, métodos o mensajes que **no existen en el código actual**. Se cubrieron con la prueba sobre el comportamiento real **sin modificar `src/main`**; aquí queda la desviación documentada:

| PU | Lo que pide PUS.md | Lo que hay en el código | Cómo se cubrió |
|---|---|---|---|
| PU-01 / PU-02 | `usuarioService.registrarDonante(UsuarioRegistroDTO)` con rol `ROLE_DONANTE` | El registro vive en `AuthService.register(RegisterRequest)` y usa el rol **`Donante`** (`RolRegistrable.DONANTE`) | Tests nuevos sobre `AuthService.register` |
| PU-03 / PU-04 | Excepción `BadCredentialsException` | `InvalidCredentialsException("Credenciales incorrectas")` | Ya cubierto en `AuthServiceTest` |
| PU-07 | `CapacidadExcedidaException` | `BadRequestException`; la ocupación se estima **contando** donaciones `EN_ALMACEN`, no sumando m³ (el esquema no almacena volumen por donación) | Ya cubierto en `DonacionServiceCapacidadTest` |
| PU-10 | Error a nivel de servicio (`MethodArgumentNotValidException`) | La validación `@DecimalMin`/`cantidad > 0` ocurre en el DTO y se dispara en el **controlador** vía Bean Validation | Ya cubierto en `CantidadProductoValidationTest` (MockMvc + `GlobalExceptionHandler`) |
| PU-12 | Mensaje `"No se puede anular una donación que ya está en almacén"` | Mensaje real: `"Solo se puede anular una donación en estado REGISTRADO. Estado actual: EN_ALMACEN"` | Tests nuevos que afirman el mensaje real |
| PU-13 | `inventarioService.obtenerStockPorCategoria(idCategoria)` | No existe ese servicio/método; la consolidación la hace `AlmacenServiceImpl.obtenerInventarioPorLocal(idLocal)` agrupando por categoría | Test nuevo con los valores del PUS (10 + 15 + 5 = **30 kg**) |
| PU-14 | `findAll(Specification, Pageable)` sobre donaciones | Existe en `DonacionMonetariaServiceImpl.listarDonaciones` y como filtrado paginado en `listarPorVerificacion` y `buscarProductosInventario` | Ya cubierto en `DonacionMonetariaServiceTest`, `VerificacionDonacionServiceTest` y `BusquedaInventarioTest` (total de elementos, páginas y DTOs mapeados) |
| PU-15 | Incidencia `"EXCEDENTE"` | Texto real de la incidencia: **`"Excedente"`** (misma clase `clasificarIncidencia`) | Test nuevo con el valor real |
| PU-17 | Atributo `alertaAltaIncidencia = true` en la respuesta | No existe ese flag: cuando `incidencias > ítems / 2` el servicio llama `notificarAdministradores(...)` y guarda una `Notificacion` por cada administrador | Test nuevo que verifica la notificación interna (y su ausencia justo al 50 %) |
| PU-20 | Respuesta JSON con `dniDetectado` | `RespuestaIaDniDTO` solo tiene `esValido`, `confianza` y `mensaje` | Test que afirma `esValido` + `confianza` |
| PU-21 | `biometriaIaService.procesarVerificacionYPurgar` borrando `./uploads/temp_dni/dni_test.jpg` y verificando `imagenEvidenciaRepository.save` | El método es `UsuarioService.procesarVerificacionYPurgar`; la imagen se procesa **solo en memoria** (nunca se copia a disco) y el servicio **no tiene** repositorio de evidencias, por lo que no puede guardarla | Test que crea la carpeta temporal y verifica que **no queda ningún archivo** tras el proceso, y que `save` solo se usa para marcar `dniVerificado` |
| PU-22 | `ConnectException` (503) con purga del archivo | `IaVerificationServiceImpl` captura `RestClientException` y devuelve *fallback* con mensaje amigable | 2 tests: 503 con `MockRestServiceServer` y apagado real del microservicio (conexión rechazada a `127.0.0.1:1`) |
| PU-23 | `evaluarRiesgoVencimiento()` con estado `PROXIMO_A_VENCER` y emisión de notificación | No existe `evaluarRiesgoVencimiento` ni notificación de caducidad; `AlmacenServiceImpl.obtenerAlertasCaducidad(idLocal)` devuelve las alertas de **< 15 días** | Test nuevo que afirma `diasParaCaducar = 10` y que el producto a 30 días queda fuera |
| PU-25 | `verificarFondos(id, "VERIFICADO")` y sumatoria global | Ya existe y está cubierto (`verificaAporte`, `consolidaSoloVerificadas`, `totalFondos`) | Cubierto antes de mis cambios |

**Conclusión:** fuera de la PU-05 (aprobada por el usuario) y del bug de `Kit.detalles`, **no se modificó ninguna regla de negocio** para hacer pasar un test.

---

## 4. Mapa de cobertura PU-01 … PU-25

| PU | Archivo de test | Estado |
|---|---|---|
| PU-01 Registro donante | `service/AuthServiceRegistroTest.java` | **Nuevo** |
| PU-02 DNI duplicado | `service/AuthServiceRegistroTest.java` | **Nuevo** |
| PU-03 Login OK | `service/AuthServiceTest.java` | Ya existía |
| PU-04 Contraseña incorrecta | `service/AuthServiceTest.java` | Ya existía |
| PU-05 Baja lógica trabajador | `service/TrabajadorServiceTest.java` | **Nuevo** (+ código de producción) |
| PU-06 Locales activos | `service/LocalServiceTest.java` | Ya existía |
| PU-07 Capacidad del almacén | `service/DonacionServiceCapacidadTest.java` | Ya existía |
| PU-08 Teléfono del local | `dto/request/LocalRequestValidationTest.java` | Existía + **casos nuevos** (letras/símbolos) |
| PU-09 Registro de donación + código | `service/DonacionServiceTest.java` | Ya existía |
| PU-10 Cantidades ≤ 0 | `controller/CantidadProductoValidationTest.java` | Ya existía |
| PU-11 Anulación válida | `service/DonacionEstadoPermisoTest.java` | Ya existía |
| PU-12 Bloqueo de anulación en almacén | `service/DonacionEstadoPermisoTest.java` | **Nuevos** (2 tests) |
| PU-13 Inventario por categoría | `service/InventarioConsolidadoTest.java` | Existía + **test nuevo (30 kg)** |
| PU-14 Búsqueda + paginación | `VerificacionDonacionServiceTest`, `BusquedaInventarioTest`, `DonacionMonetariaServiceTest` | Ya existía |
| PU-15 Incidencia excedente | `service/AlmacenServiceTest.java` | **Nuevo** |
| PU-16 Incidencia faltante | `service/AlmacenServiceTest.java` | Ya existía |
| PU-17 Alerta > 50 % incidencias | `service/AlmacenServiceTest.java` | **Nuevos** (2 tests) |
| PU-18 Kits FIFO | `service/KitServiceTest.java` | **Nuevo** (+ bugfix en `Kit`) |
| PU-19 Stock insuficiente | `service/KitServiceTest.java` | **Nuevo** |
| PU-20 Cliente IA DNI | `service/IaVerificationServiceTest.java` | **Nuevo** (multipart + mapeo) |
| PU-21 Purga biométrica | `service/BiometriaPurgaTest.java` | **Nuevo** (3 tests) |
| PU-22 Fallback IA | `service/IaVerificationServiceTest.java` | **Nuevos** (2 tests) |
| PU-23 Alerta de caducidad | `service/AlmacenServiceTest.java` | **Nuevo** |
| PU-24 Notificación no leída | `service/NotificacionServiceTest.java` | **Nuevos** (2 tests) |
| PU-25 Donación monetaria | `service/DonacionMonetariaServiceTest.java` | Ya existía |

### Archivos de test creados
* `src/test/java/com/donaciones/service/AuthServiceRegistroTest.java`
* `src/test/java/com/donaciones/service/TrabajadorServiceTest.java`
* `src/test/java/com/donaciones/service/KitServiceTest.java`
* `src/test/java/com/donaciones/service/IaVerificationServiceTest.java`
* `src/test/java/com/donaciones/service/BiometriaPurgaTest.java`

### Archivos de test modificados
* `src/test/java/com/donaciones/service/AlmacenServiceTest.java` (PU-15, PU-17, PU-23)
* `src/test/java/com/donaciones/service/DonacionEstadoPermisoTest.java` (PU-12)
* `src/test/java/com/donaciones/service/InventarioConsolidadoTest.java` (PU-13)
* `src/test/java/com/donaciones/service/NotificacionServiceTest.java` (PU-24)
* `src/test/java/com/donaciones/dto/request/LocalRequestValidationTest.java` (PU-08)

---

## 5. Recomendaciones pendientes (no aplicadas a propósito)

1. **`DELETE /trabajadores/{id}` sigue borrando físicamente.** Para cumplir del todo el RF10 habría que convertirlo en baja lógica (o eliminarlo) y migrar los registros existentes; se decidió no cambiarlo para no alterar el contrato actual de la API.
2. **Migración de la columna `estadoActivo`.** Con `ddl-auto=update` se crea sola; si el proyecto pasa a esquemas gestionados (Flyway/Liquibase) conviene dejar un `ALTER TABLE trabajador ADD COLUMN estadoActivo BOOLEAN DEFAULT TRUE`.
3. **`evaluarRiesgoVencimiento` / notificación de caducidad (PU-23)** y el **`alertaAltaIncidencia` (PU-17)** no existen como tal: si el PUS es contrato formal, deberían implementarse (y ahí sí habría que volver a tocar `src/main`).
4. **`CapacidadExcedidaException` (PU-07)**: si se quiere respetar el texto del PUS, habría que crear la excepción y/o registrar volumen en m³ por donación, cosa que el esquema actual no soporta.
5. **`AyudaYaBackendApplicationTests.contextLoads`** necesita una base de datos; conviene marcarlo con `@DisabledIf`/perfil `test` con H2 o levantar MySQL en CI para que la suite pase completa.

---

## 6. Nota sobre cambios ajenos en el working tree

No forman parte de este trabajo (ya estaban modificados antes de empezar y **no los toqué**):
`controller/LocalController.java`, `service/LocalService.java`, `dto/request/LocalEstadoRequest.java` (nuevo), y los borrados de `DESPLIEGUE-RENDER.md` y `seed-admin-usuario.sql`.
