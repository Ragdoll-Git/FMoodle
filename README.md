# 📸 Resumen IA de Pantalla

## 📦 (Versión Local - Multi-Model Edition)

Extensión de Chrome para uso personal que captura la pantalla actual y permite elegir entre:

- **Google Gemini** *(3.0 Flash Preview / 2.5 Flash / 2.5 Flash Lite)*
- **ChatGPT** *(GPT-5)*
- **Groq** *(Llama 4 Scout)*

para realizar consultas técnicas, resúmenes o extracción de código.

- **Versión Actual:** 3.3.0 (*OpenAI Support)
- **Arquitectura:** Multi-Modelo con sistema de respaldo (*para errores de saturación (500) y couta excedida (429)*).

## ✨ Características Principales

- **🧠 Inteligencia Adaptativa:**
  - **Principal:** **Gemini 3.0 Flash Preview**. Alta precisión y razonamiento.
  - **Respaldo Automático:** 3.0 -> 2.5 Flash -> 2.5 Lite -> Groq. (Incluye soporte para error de Cuota 429).
  - **Selector en Vivo:** Elige tu modelo preferido (Gemini / ChatGPT / Groq) desde el popup.
- **🤖 Soporte OpenAI:** Integración oficial con ChatGPT (GPT-5).
- **📸 Captura Instantánea:** Atajo `Alt+Shift+Z`.
- **💬 Interfaz Avanzada:**
  - Diseño renovado, centrado y con fondos aleatorios.
  - Modos: Ventana Flotante, Pin Mode (📌) y Burbuja Minimizada.
  - Prompts Predefinidos: Menú para instrucciones técnicas rápidas.
- **⚙️ Configuración Segura:** Las API Keys se gestionan de forma independiente `options.html`.

## ℹ️ Instalación y Uso

Para obtener las API Keys y configurar la extensión, sigue las [**`INSTRUCCIONES.md (clic aquí)`**](./INSTRUCCIONES.md).

## 🛠️ Estructura Técnica

La extensión opera como un Módulo ES6 con **8 archivos clave**:

- `manifest.json`: Permisos V3 para background modules.
- `background.js`: Router inteligente con lógica de fallback y reintentos (Exponential Backoff).
- `groq.js`: Cliente API para Llama 4.
- `content.js`: UI Reactiva con inyección inteligente.
- `prompts.js`: Biblioteca de instrucciones.
- `options.html` / `.js`: Gestión de Keys segura.
- `/images/`: Assets.

## 🐛 Solución de Errores Comunes

- **`Error: The model has been decommissioned`**: Asegúrate de usar la versión más reciente de `groq.js` que apunta a *Llama 4 Scout* (los modelos beta cambian rápido).
- **`Network Error / Failed to fetch`**: Revisa tu conexión. Si usas Groq, verifica que la API Key sea correcta en Opciones.
- **`Extension context invalidated`**: Si actualizas la extensión, debes recargar la página web (F5) donde la estés usando.
- **`Error 503 (Service Unavailable)`**: Saturación de Google. La extensión intentará usar el modelo "Lite" automáticamente.
- **`Error 404 (Not Found)`**: Indica que el modelo buscado ya no existe (solucionado en esta versión al migrar de 1.5 a 2.5).
- **`Error: not found for API version v1`**: Asegúrate de tener la última versión del código (el endpoint debe ser `v1beta` para Gemini 3).
- **`Error 503 / 429`**: Saturación de Google. El sistema cambiará automáticamente a un modelo más ligero o a Groq.

## 📜 Historial de Versiones

### v3.3.0 - La Actualización "OpenAI"

- **Nuevo Proveedor:** Soporte completo para **ChatGPT (GPT-5)**.
- **UI Revamp:** Diseño de opciones centrado y estilizado con fondos dinámicos.
- **Fallback Inteligente:** El sistema ahora detecta el error "Cuota Excedida" (429) y salta automáticamente de Gemini 3.0 -> 2.5 -> Lite, maximizando el uso gratuito.
- **Configuración:** Opción para guardar clave de OpenAI.

### v3.2.0 - La Actualización "Gemini 3" (Actual)

- **Motor:** Actualizado a **Gemini 3.0 Flash Preview**.
- **Estabilidad:** Eliminado el "Modo Live" para reducir complejidad y fallos.
- **Fallback:** Sistema de triple respaldo (3.0 -> 2.5 -> Lite -> Groq).

### v3.0.0 - La Actualización "Groq"

- **Nuevo Proveedor:** Integración completa de Groq Cloud (Llama 4 Scout).
- **Zero-Copy:** Optimización de memoria en manejo de imágenes.
- **Optimización Crítica:** Se eliminó el envío de Base64 entre procesos. La imagen se almacena temporalmente en el Service Worker para reducir el consumo de memoria.
- **UI:** Nuevo selector "Gemini / Groq" en la barra de título.
- **Resiliencia:** Implementación de reintentos automáticos (Exponential Backoff) para saturación de servidores (errores 429/503).

### v2.5.1 - Migración & Estabilidad

- **Migración de Modelos:** Se eliminó el soporte para `gemini-1.5-flash` (deprecado). Ahora el sistema de fallback alterna entre **2.5 Flash** y **2.5 Flash Lite**.
- **UI Informativa:** El título de la ventana ahora confirma la versión del modelo utilizado.
- **Fix "Hot Reload":** Se cambiaron las declaraciones de variables (`const` a `var`) y se agregó protección en `content.js` para evitar errores al recargar la extensión mientras se desarrolla.
- **Fix Contexto:** Validación añadida en `savePosition` para evitar errores de consola al perder la conexión con el Service Worker.

### v2.5 - Seguridad y UI Refinada

- **Nueva Configuración:** Se eliminó la API Key del código (hardcoded). Ahora se usa una página de Opciones (`options.html`) y se guarda en `chrome.storage`.
- **Minimizar:** Se mejoró el modo "burbuja" con un botón flotante dedicado para restaurar la ventana.
- **Permisos:** Migración a inyección programática (`scripting`) para mejor rendimiento y cumplimiento de Manifest V3.

### v2.4 - Inteligencia

- **Selector de Prompts:** Menú desplegable añadido para seleccionar instrucciones rápidas predefinidas (ej: Programación C++, Señales).
