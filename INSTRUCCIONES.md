# ℹ️ Instrucciones de Instalación y Uso

Sigue estos pasos para instalar y configurar la extensión con soporte para múltiples inteligencias artificiales.

## 1. Requisitos Previos

Asegúrate de tener la carpeta de la extensión descargada.

## 2. Obtener tus Claves (API Keys)

### A. Google Gemini (Principal)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión y crea una API Key.
3. **Nota:** Esta key te dará acceso automático a **Gemini 3.0 Preview** y **Gemini 2.5**. No necesitas configurar nada extra.

### B. Groq Cloud (Respaldo Recomendado)

1. Ve a [Groq Console](https://console.groq.com/keys).
2. Crea una API Key para tener un respaldo ultrarrápido si Google se satura.

## 3. Instalar en Chrome

1. Abre Chrome y ve a: `chrome://extensions`.
2. Activa el **"Modo de desarrollador"**.
3. Haz clic en **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta de la extensión.

## 4. Configurar las Claves

1. Busca el icono de la extensión (💼) en la barra de Chrome.
2. Haz **Click Derecho** sobre el icono y elige **"Opciones"**.
3. Verás dos casilleros:
    * **Google Gemini:** Pega tu clave `AIzaSy...`
    * **Groq Cloud:** Pega tu clave `gsk_...`
4. Dale a **Guardar**. ¡Listo!

## 5. Cómo Usar

### Capturar Pantalla

* Atajo: `Alt + Shift + Z`.
* O click derecho: "Preguntar a la IA sobre esta pantalla".

### La Inteligencia Automática

Por defecto, la extensión intentará usar el mejor modelo disponible:

1. **Gemini 3.0 Flash Preview** (El más inteligente).
2. Si falla, baja a **Gemini 2.5 Flash**.
3. Si falla, baja a **Groq**.

Tú solo preocupate de preguntar, la extensión se encarga de buscar quien responda mejor.
Puedes forzar el uso de Groq desde el selector en la ventana de chat si lo prefieres para casos de velocidad extrema.
