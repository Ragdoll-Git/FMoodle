# 📸 Resumen IA de Pantalla
#### (Versión Local - Multi-Provider Edition)

Extensión de Chrome para uso personal que captura la pantalla actual y permite elegir entre **Google Gemini** o **Groq (Llama 4)** para realizar consultas técnicas, resúmenes o extracción de código.

* **Versión Actual:** 3.0.0 (Groq Integration Update)
* **Arquitectura:** Multi-Modelo con optimización de memoria.

## ✨ Características Principales

* **🧠 Doble Inteligencia (Nuevo):**
    * **Google Gemini:** Usa `Gemini 2.5 Flash` (con fallback a `Lite`). Ideal para uso general.
    * **Groq Cloud:** Integra **`Llama 4 Scout`** (Vision), un modelo ultrarrápido de Meta como alternativa robusta.
    * **Selector en Vivo:** Elige qué IA usar desde el popup antes de enviar tu pregunta.
* **🚀 Optimización de Rendimiento:**
    * **Cero Latencia de Imagen:** Nueva arquitectura que procesa la imagen en segundo plano sin transferir datos pesados a la interfaz, reduciendo el uso de RAM y CPU.
    * **Retry Inteligente:** Sistema de "Exponential Backoff" que reintenta automáticamente si Google devuelve errores 503 o 429.
* **📸 Captura Instantánea:** Atajo `Alt+Shift+Z` o Click Derecho.
* **💬 Interfaz Avanzada:**
    * Modos: Ventana Flotante, Pin Mode (📌) y Burbuja Minimizada.
    * Prompts Predefinidos: Menú para instrucciones técnicas rápidas.
* **⚙️ Configuración Segura:** Las API Keys (Gemini y Groq) se gestionan de forma independiente desde el panel de opciones.

## ℹ️ Instalación y Uso

Para obtener las API Keys y configurar la extensión, sigue las [**`INSTRUCCIONES.md (clic aquí)`**](./INSTRUCCIONES.md).

## 🛠️ Estructura Técnica

La extensión ahora opera como un Módulo ES6. La carpeta debe contener estos **8 archivos obligatorios**:

* `manifest.json`: Permisos actualizados para CORS (Google + Groq) y background tipo `module`.
* `background.js`: Controlador principal ("Router") que decide a qué IA llamar.
* `groq.js`: **(Nuevo)** Módulo encapsulado para la lógica de Llama 4 Scout.
* `content.js`: Interfaz visual con selector de proveedor y optimización de payload.
* `prompts.js`: Lista de prompts.
* `options.html` & `options.js`: Panel para guardar múltiples keys.
* `/images/`: Iconos.

## 🐛 Solución de Errores Comunes

* **`Error: The model has been decommissioned`**: Asegúrate de usar la versión más reciente de `groq.js` que apunta a *Llama 4 Scout* (los modelos beta cambian rápido).
* **`Network Error / Failed to fetch`**: Revisa tu conexión. Si usas Groq, verifica que la API Key sea correcta en Opciones.
* **`Extension context invalidated`**: Si actualizas la extensión, debes recargar la página web (F5) donde la estés usando.
* **`Error 503 (Service Unavailable)`**: Saturación de Google. La extensión intentará usar el modelo "Lite" automáticamente.
* **`Error 404 (Not Found)`**: Indica que el modelo buscado ya no existe (solucionado en esta versión al migrar de 1.5 a 2.5).

## 📜 Historial de Versiones

### v3.0.0 - La Actualización "Groq" (Actual)
* **Nuevo Proveedor:** Integración completa de **Groq Cloud** con soporte para visión (Llama 4 Scout).
* **Optimización Crítica:** Se eliminó el envío de Base64 entre procesos. La imagen se almacena temporalmente en el Service Worker para reducir el consumo de memoria.
* **UI:** Nuevo selector "Gemini / Groq" en la barra de título.
* **Resiliencia:** Implementación de reintentos automáticos (Exponential Backoff) para saturación de servidores (errores 429/503).

### v2.5.1 - Migración & Estabilidad
* **Migración de Modelos:** Se eliminó el soporte para `gemini-1.5-flash` (deprecado). Ahora el sistema de fallback alterna entre **2.5 Flash** y **2.5 Flash Lite**.
* **UI Informativa:** El título de la ventana ahora confirma la versión del modelo utilizado.
* **Fix "Hot Reload":** Se cambiaron las declaraciones de variables (`const` a `var`) y se agregó protección en `content.js` para evitar errores al recargar la extensión mientras se desarrolla.
* **Fix Contexto:** Validación añadida en `savePosition` para evitar errores de consola al perder la conexión con el Service Worker.

### v2.5 - Seguridad y UI Refinada
* **Nueva Configuración:** Se eliminó la API Key del código (hardcoded). Ahora se usa una página de Opciones (`options.html`) y se guarda en `chrome.storage`.
* **Minimizar:** Se mejoró el modo "burbuja" con un botón flotante dedicado para restaurar la ventana.
* **Permisos:** Migración a inyección programática (`scripting`) para mejor rendimiento y cumplimiento de Manifest V3.

### v2.4 - Inteligencia
* **Selector de Prompts:** Menú desplegable añadido para seleccionar instrucciones rápidas predefinidas (ej: Programación C++, Señales).
