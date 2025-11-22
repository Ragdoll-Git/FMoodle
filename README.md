# 📸 Resumen IA de Pantalla
#### (Versión Local)

Extensión de Chrome para uso personal que captura la pantalla actual, la analiza con **Google Gemini** y permite realizar consultas técnicas, resúmenes o extracción de código.

**Versión Actual:** 2.5 (Post-Migration Patch)
**Modelos:** Gemini 2.5 Flash (con fallback automático a Gemini 2.5 Flash Lite).

## ✨ Características Principales

* **📸 Captura Instantánea:** Captura la pestaña visible mediante Click Derecho o Atajo de Teclado (`Alt+Shift+Z`).
* **🧠 IA Actualizada (Nov 2025):** Migración completa a la familia **Gemini 2.5**.
    * **Modelo Principal:** Gemini 2.5 Flash.
    * **Modelo de Respaldo:** Gemini 2.5 Flash Lite (se activa automáticamente si el principal falla).
    * **Indicador de Modelo:** La barra de título muestra exactamente qué IA respondió (ej: *"Respuesta de la IA (2.5 Lite)"*).
* **💬 Interfaz Avanzada:**
    * **Movible:** Arrastra la ventana por toda la pantalla.
    * **Pin Mode (📌):** Fija la ventana para que no se cierre.
    * **Modo Burbuja (Minimizar):** Convierte la ventana en un icono flotante para liberar espacio.
* **📝 Prompts Predefinidos:** Menú desplegable con instrucciones técnicas (ej: "Programación C/C++", "Tratamiento de Señales").
* **⚙️ Configuración Segura (BYOK):** La API Key se gestiona desde el menú de Opciones y se guarda en el navegador.

## � Instalación y Uso

Para obtener la API Key, instalar y configurar la extensión, sigue las [**Instrucciones detalladas (clic aquí)**](./INSTRUCCIONES.md).

## �🛠️ Estructura y Cambios Técnicos

Para que la extensión funcione, la carpeta debe contener estos archivos obligatorios:

* `manifest.json`: Configuración y permisos (v3).
* `background.js`: Lógica de modelos (2.5 Flash / Lite) y manejo de errores 404/503.
* `content.js`: Interfaz visual. Incluye protección contra doble inyección.
* `prompts.js`: Lista de prompts predefinidos (usando `var` para hot-reloading).
* `options.html` & `options.js`: Panel de configuración de la API Key.
* `/images/`: Iconos de la extensión.

## 🐛 Solución de Errores Comunes

* **`Error 503 (Service Unavailable)`:** Saturación de Google. La extensión intentará usar el modelo "Lite" automáticamente.
* **`Error 404 (Not Found)`:** Indica que el modelo buscado ya no existe (solucionado en esta versión al migrar de 1.5 a 2.5).
* **`Extension context invalidated`:** Ocurre al recargar la extensión sin refrescar la página web. Se ha parcheado el código para que no interrumpa el uso normal.

## 📜 Historial de Versiones

### v2.5.1 - Migración & Estabilidad (Actual)
* **Migración de Modelos:** Se eliminó el soporte para `gemini-1.5-flash` (deprecado en v1beta). Ahora el sistema de fallback alterna entre **2.5 Flash** y **2.5 Flash Lite**.
* **UI Informativa:** El título de la ventana ahora confirma la versión del modelo utilizado.
* **Fix "Hot Reload":** Se cambiaron las declaraciones de variables (`const` a `var`) y se agregó protección en `content.js` para evitar el error *"Identifier has already been declared"* al recargar la extensión mientras se desarrolla.
* **Fix Contexto:** Validación añadida en `savePosition` para evitar errores de consola al perder la conexión con el Service Worker.

### v2.5 - Seguridad y UI Refinada
* **Nueva Configuración:** Se eliminó la API Key del código. Ahora se usa una página de Opciones.
* **Minimizar:** Se mejoró el modo "burbuja" con un botón flotante.
* **Permisos:** Migración a inyección programática (`scripting`) para mejor rendimiento.

### v2.4 - Inteligencia
* **Selector de Prompts:** Menú desplegable para instrucciones rápidas.

---
*Desarrollo local para uso personal.*
