# Matriz Completa de Requerimientos de Software - Proyecto "AyudaYa"

> Copia histórica de consulta. La fuente única vigente de numeración y alcance es [`../requerimientos.md`](../requerimientos.md). En particular, RF42–RF44 aquí no deben reutilizarse para funciones monetarias: corresponden a logística/caducidad; las funciones monetarias son RF59–RF61 en la matriz vigente.

**Proyecto:** Sistema Web de Gestión, Trazabilidad e Inteligencia Artificial para Donaciones y Asistencia Social "AyudaYa"  
**Organización Beneficiaria:** Misión Caritas Felices

**Stack Tecnológico:** Angular 17+ (Frontend) | Spring Boot 3 + Python/Flask (Backend) | MySQL  

---

## 📋 1. Requerimientos Funcionales (RF01 - RF54)

### Módulo 1: Identificación, Autenticación y Gestión de Usuarios

#### RF01 - Identificación de Acceso
* **Descripción:** Apenas se ingresa al sistema web, se indicará al usuario identificarse a través de un inicio de sesión. En caso de no contar con una cuenta, se le permitirá crear una nueva.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Identificación | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF02 - Ingreso de Información del Usuario (Donador)
* **Descripción:** El sistema de donaciones contará con una interfaz donde el usuario ingresará información como: nombres y apellidos, número de DNI o RUC, correo y número de teléfono.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Muy Alta | **Versión:** 1.0
* **Entregable:** Registrar usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF03 - Verificación de Identidad del Usuario (Donador)
* **Descripción:** Luego de que la información del usuario sea ingresada, el sistema deberá verificar su identidad a través de una foto de su DNI, por adelante y por detrás.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Identificación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF04 - Registro de Información en la Base de Datos
* **Descripción:** Luego de la verificación de identidad, el sistema registrará al nuevo usuario dentro de la base de datos MySQL.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF05 - Confirmación Visual de Registro de Usuario
* **Descripción:** La interfaz del sistema web deberá mostrar que se registró el nuevo usuario donador y redireccionar al inicio del sistema web.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Registro de usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF06 - Gestión de Trabajadores Existentes
* **Descripción:** El sistema deberá contar con los trabajadores de la organización preexistentes cargados dentro de la base de datos.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de trabajadores | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF07 - Registro de Nuevos Trabajadores
* **Descripción:** A través de la interfaz del sistema web, se permitirá a la organización registrar un nuevo usuario con el rol de trabajador.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de trabajadores | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF08 - Edición de Información de Trabajadores
* **Descripción:** A través de la interfaz se podrá ingresar y modificar la información de cada trabajador, pero esta función será exclusiva del rol organización/administrador.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Editar trabajador | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF09 - Visualización de Datos de Trabajadores
* **Descripción:** La interfaz del sistema web deberá mostrar los datos de los trabajadores registrados como: local asignado, cargo y fecha de contratación.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Baja | **Versión:** 1.0
* **Entregable:** Visualizar trabajador | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF10 - Inmutabilidad y Borrado Lógico de Trabajadores
* **Descripción:** El sistema no permitirá eliminar trabajadores o sus datos de manera permanente de la base de datos; contarán con un historial y solo se ocultarán de la interfaz mediante eliminación lógica (`estadoActivo = 0`).
* **Responsable:** Brigitte Vasquez | **Prioridad:** Muy Alta | **Versión:** 1.0
* **Entregable:** Eliminar trabajador | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

---

### Módulo 2: Registro e Intención de Donación Material

#### RF11 - Ingreso de Nueva Donación
* **Descripción:** El usuario donante contará con la función de agregar una nueva donación material donde podrá especificar e ingresar los productos que desea aportar.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF12 - Visualización de Donaciones Ingresadas
* **Descripción:** A través de la interfaz, el usuario visualizará las donaciones ingresadas mediante una lista resumida en la sección lateral derecha.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Baja | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado
* **ODS:** ODS 10 (Reducción de las Desigualdades) | **FURPS+:** F (Funcionalidad)

#### RF13 - Generación de Código Único de Verificación
* **Descripción:** Luego de que el usuario registre la donación, el sistema generará un código de verificación alfanumérico único de 15 caracteres (ej. `DON-2026-X80192`) y su equivalente en código QR.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Muy Alta | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF14 - Validación y Confirmación de la Donación
* **Descripción:** Cuando se realice la entrega física en el local de acopio, el sistema validará la donación y actualizará su estado oficial en la base de datos.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF15 - Edición de Donación Previa a la Validación
* **Descripción:** En el proceso de recepción física, el trabajador podrá editar la donación para ajustar las cantidades por si el donador entregó la donación incompleta o con ítems adicionales.
* **Responsable:** Brigitte Vasquez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

---

### Módulo 3: Inteligencia Artificial, Biometría y Purga de Datos

#### RF16 - Captura Fotográfica de DNI
* **Descripción:** Al momento de registrar un usuario donante, el sistema permitirá tomar o subir una fotografía legible del anverso y reverso del documento de identidad.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF17 - Análisis de Autenticidad de DNI mediante IA
* **Descripción:** Luego de subir las imágenes del DNI, el sistema las enviará a un modelo de Inteligencia Artificial en Flask para verificar que corresponda a un documento válido y a una persona real.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF18 - Purga Biométrica Automática
* **Descripción:** Una vez verificada la identidad del usuario, el sistema eliminará físicamente del servidor las imágenes y resultados detallados de la validación (`Files.deleteIfExists()`), conservando solo el indicador booleano de verificación para proteger los datos personales.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de usuario | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF19 - Carga Serializada de Modelo Predictivo (`.pkl`)
* **Descripción:** Al iniciar el servicio backend en Flask que atiende las solicitudes de verificación de identidad, se cargará el modelo entrenado serializado (`.pkl`) mediante Joblib en memoria para agilizar las respuestas sin reentrenarlo en cada petición.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Verificación de identidad | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

---

### Módulo 4: Trazabilidad, Tracking y Línea de Tiempo

#### RF20 - Registro del Estado Actual de la Donación
* **Descripción:** El sistema registrará en la base de datos el estado actual de cada paquete desde que el donante confirma su intención de donación hasta la entrega final.
* **Responsable:** Favio Canevaro | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Seguimiento de donación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF21 - Manejo de Fases de Seguimiento Inmutables
* **Descripción:** El sistema gestionará secuencialmente las 4 fases de seguimiento: `REGISTRADO`, `EN ALMACÉN`, `EN TRÁNSITO` y `ENTREGADO`.
* **Responsable:** Favio Canevaro | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Seguimiento de donación | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF22 - Línea de Tiempo Gráfica de Avance
* **Descripción:** El sistema mostrará al donante una línea de tiempo gráfica e interactiva (Stepper) indicando el avance físico y logístico de su paquete.
* **Responsable:** Favio Canevaro | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Vista de seguimiento | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF23 - Actualización Dinámica de la Línea de Tiempo
* **Descripción:** La línea de tiempo del donante se actualizará de forma automática consultando los cambios registrados en la tabla de historial de estados de la base de datos.
* **Responsable:** Favio Canevaro | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Vista de seguimiento | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF24 - Historial Cronológico de Cambios de Estado
* **Descripción:** El sistema registrará la fecha, hora exacta y responsable de cada transición de estado en la cadena logística.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Historial de estados | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF25 - Privacidad y Aislamiento de Tracking por Cuenta
* **Descripción:** Cada donante autenticado solo podrá consultar el detalle, historial, evidencias y ubicación GPS exacta de sus propias donaciones. El personal autorizado podrá consultar estos datos según su rol. El rastreo público por código mostrará únicamente estado, fechas y nombre del centro de acopio, sin coordenadas GPS, dirección exacta, datos personales ni observaciones libres.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.1
* **Entregable:** Seguimiento de donación | **Estado:** Implementado; pendiente validación integral con BD | **FURPS+:** F (Funcionalidad)

---

### Módulo 5: Analítica Predictiva e IA para Gestión de Escasez

#### RF26 - Consumo Backend del Modelo Predictivo
* **Descripción:** El sistema consumirá desde el backend en Flask un modelo predictivo procesando las métricas de stock e inventario actual acumulado.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Predicción de demanda | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF27 - Panel de Proyecciones de Escasez por Categoría
* **Descripción:** El sistema mostrará a los administradores de la organización un panel gráfico comparando la tasa de donaciones recibidas versus el ritmo de consumo estimado por categoría.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Panel de predicciones | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF28 - Alertas Automáticas de Categorías Críticas
* **Descripción:** El sistema emitirá una alerta visual inmediata sobre aquellas categorías clasificadas por el modelo predictivo en riesgo alto/crítico de desabastecimiento.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Alerta de suministros | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

#### RF29 - Filtrado Multicriterio de Proyecciones
* **Descripción:** El sistema permitirá filtrar el panel de predicciones de demanda por categoría de producto y por zona de emergencia o desastre específica.
* **Responsable:** Favio Canevaro | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Panel de predicciones | **Estado:** Documentado | **FURPS+:** F (Funcionalidad)

---

### Módulo 6: Corroboración en Almacén, Incidencias y Poka-Yoke

#### RF30 - Cálculo Dinámico de Resumen e Incidencias
* **Descripción:** Durante la corroboración en almacén, el sistema calculará y actualizará dinámicamente en tiempo real los contadores de "Total Items" e "Items con Incidencias" sin recargar la página.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Panel de Resumen Dinámico | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF31 - Regla Poka-Yoke de Botón de Confirmación
* **Descripción:** El sistema mantendrá deshabilitado (`disabled = true`) el botón "Validar y Confirmar Recepción" en la pantalla del trabajador hasta que todas las filas de la tabla de insumos tengan un valor registrado en la columna "Recibido (Real)".
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Validación de Formulario | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF32 - Restricción de Evidencia Fotográfica (Máximo 3 Imágenes)
* **Descripción:** El sistema permitirá seleccionar y cargar un máximo estricto de 3 imágenes simultáneas como evidencia fotográfica durante el proceso de recepción física en almacén.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Módulo Carga de Imágenes | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF33 - Autocompletado de Incidencias ("Excedente" / "Faltante")
* **Descripción:** Si el trabajador ingresa en la columna "Recibido (Real)" un valor superior a lo "Prometido", el menú de incidencia cambiará automáticamente a "Excedente". Si es menor, cambiará automáticamente a "Faltante".
* **Responsable:** Juan Diego Camacho | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Lógica de Incidencias | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF34 - Captura de Coordenadas GPS en Recepción
* **Descripción:** Al presionar "Validar y Confirmar Recepción", el sistema solicitará en segundo plano la ubicación georreferenciada del dispositivo y guardará la latitud y longitud exacta en el registro del escaneo.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** API de Geolocalización | **Estado:** Documentado
* **ODS:** ODS 16 (Paz, Justicia e Instituciones Sólidas) | **FURPS+:** F (Funcionalidad)

#### RF35 - Generación de Comprobantes PDF
* **Descripción:** El sistema permitirá al donante descargar un comprobante formal en PDF que incluirá el código QR, la hoja de ruta, la tabla comparativa de insumos e historial de movimientos.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Generador de PDF | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF36 - Notificaciones Automáticas por Correo Electrónico
* **Descripción:** El sistema disparará un correo electrónico automático al donante informando los avances de su paquete cuando cambie a estado `EN_ALMACEN`, `EN_TRANSITO` o `ENTREGADO`.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Servicio de Notificaciones | **Estado:** Documentado
* **ODS:** ODS 10 (Reducción de las Desigualdades) | **FURPS+:** F (Funcionalidad)

#### RF37 - Regla de Anulación de Donación por el Donante
* **Descripción:** El sistema permitirá al donante anular su intención de donación únicamente si esta se encuentra en su estado inicial `REGISTRADO` y aún no ha sido recibida en almacén.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Botón de Anulación | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF38 - Alertas Internas por Alto Porcentaje de Discrepancias
* **Descripción:** Si la corroboración finaliza con más del 50% de sus ítems etiquetados "Con Incidencias", el sistema creará automáticamente una alerta en el panel directivo de la organización.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Baja | **Versión:** 1.0
* **Entregable:** Sistema de Alertas Internas | **Estado:** Documentado
* **ODS:** ODS 16 (Paz, Justicia e Instituciones Sólidas) | **FURPS+:** F (Funcionalidad)

#### RF39 - Buscador Público por Código de Rastreo
* **Descripción:** El sistema dispondrá de una barra de búsqueda en la página principal donde cualquier ciudadano podrá digitar un código de seguimiento alfanumérico para ver la línea de tiempo pública de la donación.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Buscador de Rastreo | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF40 - Sincronización de Ubicación Actual en Mapa
* **Descripción:** El sistema actualizará el texto y marcador de "Ubicación Actual" en la interfaz del donante tomando la localización física del último centro logístico o de acopio donde se escaneó el paquete.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Sincronización de Ubicación | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF41 - Modal Emergente de Advertencia (Pop-Up)
* **Descripción:** Si existen discrepancias o ítems con estado "Faltante", el sistema mostrará un cuadro modal emergente advirtiendo al trabajador antes de impactar el inventario.
* **Responsable:** Juan Diego Camacho | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Modal de Confirmación | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

---

### Módulo 7: Logística Externa, Inventario y Auditoría

#### RF42 - Gestión de Lotes de Distribución
* **Descripción:** El sistema permitirá a la organización agrupar múltiples donaciones verificadas en un "Lote de Distribución" único, asignándolo a un vehículo y a un conductor para su traslado.
* **Responsable:** Mauricio Rebaza | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Gestión de Lotes | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura), ODS 11 (Ciudades y Comunidades Sostenibles) | **FURPS+:** F (Funcionalidad)

#### RF43 - Registro de Entrega Final en Zona de Impacto
* **Descripción:** El sistema permitirá al trabajador registrar la entrega final del lote en la zona de desastre, adjuntando prueba fotográfica y la firma digital o código del representante comunitario.
* **Responsable:** Mauricio Rebaza | **Prioridad:** Muy Alta | **Versión:** 1.0
* **Entregable:** Registro de entrega | **Estado:** Documentado
* **ODS:** ODS 16 (Paz, Justicia e Instituciones Sólidas) | **FURPS+:** F (Funcionalidad)

#### RF44 - Alerta de Caducidad de Insumos Perecibles
* **Descripción:** El sistema evaluará diariamente las fechas de vencimiento de productos perecibles (alimentos/medicina) y generará una alerta si están a menos de 15 días de caducar.
* **Responsable:** Mauricio Rebaza | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Alerta de caducidad | **Estado:** Documentado
* **ODS:** ODS 2 (Hambre Cero) | **FURPS+:** F (Funcionalidad)

#### RF45 - Registro Inmutable de Auditoría (Audit Trail)
* **Descripción:** El sistema registrará de forma inalterable todas las modificaciones críticas (cambios de stock, anulaciones, incidencias), guardando el ID de usuario, fecha, hora e IP de la petición.
* **Responsable:** Mauricio Rebaza | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Historial de auditoría | **Estado:** Documentado
* **ODS:** ODS 16 (Paz, Justicia e Instituciones Sólidas) | **FURPS+:** F (Funcionalidad)

#### RF46 - Registro de Atributos Críticos de Productos
* **Descripción:** A través del módulo de inventario, la organización podrá ingresar productos especificando: nombre, descripción, categoría, cantidad, unidad de medida y tipo.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Registro de donación | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF47 - Validaciones Simétricas de Entrada (Poka-Yoke)
* **Descripción:** El sistema ejecutará validaciones en Frontend y Backend para bloquear el envío de cantidades negativas o caracteres no numéricos en campos de inventario.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Validación de Formulario | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF48 - Eliminación Lógica de Productos del Catálogo
* **Descripción:** Al desactivar un producto, el sistema cambiará su estado a inactivo en lugar de borrarlo físicamente de la base de datos MySQL, preservando la integridad referencial.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Gestión de Productos | **Estado:** Documentado
* **ODS:** ODS 16 (Paz, Justicia e Instituciones Sólidas) | **FURPS+:** F (Funcionalidad)

#### RF49 - Gestión del Catálogo de Categorías
* **Descripción:** La organización podrá crear, editar y deshabilitar categorías de productos (alimentos, medicinas, abrigo, etc.) desde el panel administrativo.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Módulo Categorías | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF50 - Despliegue Exclusivo de Categorías Activas
* **Descripción:** Los menús desplegables en los formularios de registro solo mostrarán aquellas categorías que se encuentren en estado activo.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Formulario de Registro | **Estado:** Documentado
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** F (Funcionalidad)

#### RF51 - Consolidado Total de Productos por Categoría
* **Descripción:** El sistema calculará y mostrará el acumulado total de existencias físicas disponibles organizadas por cada categoría de producto.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Alta | **Versión:** 1.0
* **Entregable:** Panel de Inventario | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF52 - Búsqueda de Productos en Tiempo Real
* **Descripción:** En la vista de inventario, el sistema filtrará automáticamente los productos a medida que el usuario digite coincidencias por nombre o descripción.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Buscador de Inventario | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

#### RF53 - Filtro Multicriterio de Inventarios
* **Descripción:** La interfaz permitirá combinar filtros como categoría, estado de conservación y cercanía a la fecha de vencimiento para agilizar la búsqueda de insumos.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Filtro multicriterio | **Estado:** Documentado
* **ODS:** ODS 2 (Hambre Cero) | **FURPS+:** F (Funcionalidad)

#### RF54 - Visualización Paginada del Inventario
* **Descripción:** La tabla de productos presentará la información dividida en páginas con actualización inmediata para optimizar la velocidad de carga de la interfaz.
* **Responsable:** Fabricio Alvarez | **Prioridad:** Media | **Versión:** 1.0
* **Entregable:** Tabla de Inventario Paginada | **Estado:** Documentado
* **ODS:** ODS 9 (Industria, Innovación e Infraestructura) | **FURPS+:** F (Funcionalidad)

---

## ⚙️ 2. Requerimientos No Funcionales (RFN01 - RFN12)

#### RFN01 - Control de Acceso Autenticado
* **Descripción:** La API interna exigirá un JWT válido y verificará rol y propiedad del recurso en el backend. El registro público creará solo donantes; el administrador gestionará las cuentas de personal. Las rutas públicas serán login, registro, salud, comprobación previa de legibilidad del DNI y rastreo resumido por código. La API no aceptará IDs de usuario enviados en cabeceras como prueba de identidad. Los archivos privados requerirán autenticación.
* **Prioridad:** Alta | **Versión:** 1.1 | **Entregable:** Login y autorización de API | **Estado:** Implementado; pendiente validación integral con BD | **FURPS+:** U (Usabilidad)

#### RFN02 - Interfaz Intuitiva
* **Descripción:** La interfaz de usuario debe estar diseñada de manera limpia y clara para que los trabajadores de almacén puedan operar las funciones sin requerir capacitaciones extensas.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Vista | **FURPS+:** U (Usabilidad)

#### RFN03 - Seguridad y Respaldos
* **Descripción:** Garantizar la seguridad de la información limitando accesos por rol (RBAC) y programando respaldos periódicos de la base de datos MySQL.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Seguridad | **FURPS+:** P (Performance / Confiabilidad)

#### RFN04 - Control de Stock Anti-Fraude
* **Descripción:** El sistema evitará discrepancias o alteraciones no autorizadas en los inventarios bloqueando duplicados y registros sin auditoría.
* **Prioridad:** Baja | **Versión:** 1.0 | **Entregable:** Control productos
* **ODS:** ODS 12 (Producción y Consumo Responsables) | **FURPS+:** P (Performance)

#### RFN05 - Confidencialidad de la Información
* **Descripción:** El sistema asegurará que los datos personales de los donantes y beneficiarios sean privados y protegidos contra accesos no autorizados o filtraciones.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Seguridad | **FURPS+:** U (Usabilidad / Seguridad)

#### RFN06 - Exactitud en Cálculos Logísticos
* **Descripción:** Todas las operaciones numéricas del sistema (totales consolidados, volumen en $m^3$, diferencias por incidencias y deducción por Kits) deben ser 100% exactas.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Cálculos | **FURPS+:** + (Soporte / Funcionalidad Extendida)

#### RFN07 - Umbral Máximo de Respuesta (Timeout)
* **Descripción:** El tiempo de respuesta máximo para cualquier petición a la API será de 30 segundos; en caso de demora, enviará una alerta de tiempo de espera agotado.
* **Prioridad:** Media | **Versión:** 1.0 | **Entregable:** Tiempo de respuesta | **FURPS+:** P (Performance)

#### RFN08 - Tiempo de Transición entre Pantallas (<3s)
* **Descripción:** La navegación entre vistas y el renderizado en la SPA de Angular responderá en un tiempo menor a 3 segundos.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Tiempo de respuesta | **FURPS+:** P (Performance)

#### RFN09 - Estética Visual Cohesiva
* **Descripción:** La interfaz mantendrá coherencia visual alineada a la identidad corporativa de AyudaYa, usando la paleta institucional (Naranja `#FF7717`).
* **Prioridad:** Baja | **Versión:** 1.0 | **Entregable:** Vista | **FURPS+:** U (Usabilidad)

#### RFN10 - Compatibilidad con Navegadores Modernos
* **Descripción:** La aplicación estará optimizada para navegadores web modernos con soporte HTML5 y JavaScript (Chrome, Edge, Firefox, Safari).
* **Prioridad:** Media | **Versión:** 1.0 | **Entregable:** Compatibilidad | **FURPS+:** S (Soporte)

#### RFN11 - Arquitectura Backend en Java / Spring Boot
* **Descripción:** El backend principal del sistema se desarrollará con Java 17/21 y Spring Boot por su capacidad de escalabilidad, seguridad y arquitectura en capas.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Lenguaje | **FURPS+:** + (Soporte de Infraestructura)

#### RFN12 - Motor de Base de Datos Relacional SQL
* **Descripción:** La persistencia de datos se realizará en un motor relacional SQL (MySQL / SQL Server) asegurando integridad referencial, transacciones `@Transactional` y autenticación segura.
* **Prioridad:** Alta | **Versión:** 1.0 | **Entregable:** Lenguaje | **FURPS+:** + (Soporte de Infraestructura)
