# 📸 Resumen IA de Pantalla
##### (Versión Local)

Extensión de Chrome para uso personal que captura la pantalla actual, la analiza con **Google Gemini** y permite realizar consultas técnicas, resúmenes o extracción de código.

**Versión Actual:** 2.5 (Stable)
**Modelos:** Gemini 2.5 Flash (con fallback automático a 1.5 Flash).

## ✨ Características Principales

* **📸 Captura Instantánea:** Captura la pestaña visible mediante Click Derecho o Atajo de Teclado (`Alt+Shift+Z`).
* **🧠 IA Robusta:** Usa el modelo más reciente de Google. Si el servidor está saturado, cambia automáticamente a un modelo de respaldo.
* **💬 Interfaz Avanzada:**
    * **Movible:** Arrastra la ventana por toda la pantalla.
    * **Pin Mode (📌):** Fija la ventana para que no se cierre.
    * **Modo Burbuja (Minimizar):** Convierte la ventana en un icono flotante blanco para liberar espacio visual.
* **📝 Prompts Predefinidos:** Menú desplegable con instrucciones guardadas (ej: "Programación C/C++", "Tratamiento de Señales").
* **⚙️ Configuración Segura (BYOK):** Ya no es necesario editar el código. La API Key se configura desde un menú de opciones visual y se guarda en el navegador.

## 📂 Estructura del Proyecto

Para que la extensión funcione, la carpeta debe contener estos archivos obligatorios:

* `manifest.json`: Configuración y permisos (v3).
* `background.js`: Lógica de conexión con API y manejo de claves.
* `content.js`: Interfaz visual (Ventana, burbuja, chat).
* `prompts.js`: Lista de prompts predefinidos.
* `options.html` & `options.js`: Panel de configuración de la API Key.
* `/images/`: Iconos de la extensión.

## 📜 Historial de Versiones

### v2.5 (Actual) - Seguridad y UI Refinada
* **Nueva Configuración:** Se eliminó la API Key del código (`secrets.js`/`background.js`). Ahora se usa una página de Opciones.
* **Minimizar:** Se mejoró el modo "burbuja" con un botón blanco flotante y lógica para evitar maximizado accidental al arrastrar.
* **Correcciones:** Solucionado el bug del scroll en textos largos y la deformación del cuadro de texto al restaurar.
* **Permisos:** Se migró a inyección programática (`scripting`) para mejorar el rendimiento (ya no se inyecta en todas las webs al inicio).

### v2.4 - Inteligencia y Prompts
* **Selector de Prompts:** Se agregó un menú desplegable en la cabecera para insertar instrucciones rápidas.
* **Fallback de Modelos:** Si Gemini 2.5 da error 503 (saturado), la extensión reintenta automáticamente con 1.5.

### v2.0 - Interfaz Movible
* Ventana arrastrable.
* Botón de fijar (Pin).
* Eliminación de alertas molestas ("Carga silenciosa").

## 🚀 Instalación Rápida

1.  Ve a `chrome://extensions/`.
2.  Activa **Modo de desarrollador**.
3.  Clic en **Cargar descomprimida** y selecciona esta carpeta.
4.  **IMPORTANTE:** Haz clic derecho en el icono de la extensión -> **Opciones** -> Pega tu API Key.

---
*Desarrollo local para uso personal.*
