# ℹ️ Instrucciones de Instalación y Uso

## 1. Requisitos Previos

Descargar la extension desde el archivo .zip de GitHub.

1. Te diriges a `<Code>` y seleccionas `Descargar ZIP`.
2. Te diriges a la carpeta donde se descargo el archivo .zip y descomprimelo.

## 2. Obtener tus Claves (API Keys)

### A. Google Gemini (Principal)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión y crea una API Key.

*Nota: Esta key te dará acceso automático a **Gemini 3.0 Preview** y **Gemini 2.5**.*

### B. Groq Cloud (Respaldo Recomendado)

1. Ve a [Groq Console](https://console.groq.com/keys).
2. Crea una API Key para tener un respaldo si Google se satura.

### C. OpenAI (Opcional)

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys).
2. Crea una API Key si tienes créditos disponibles (requiere pago por uso).

## 3. Instalar en Chrome

1. Abre Chrome y ve a: `chrome://extensions`.
2. Activa el **"Modo de desarrollador"**.
3. Haz clic en **"Cargar descomprimida"**.
4. Selecciona la carpeta de la extensión
5. Recarga la pagina web donde quieras usar la extension, podes recargarla con `Shift + F5` o `Ctrl + Shift + R`.

## 4. Configurar las Claves

1. Busca el icono de la extensión con un maletin amarillo en la barra de Chrome.
2. Haz **click derecho** sobre el icono y elige **"Opciones"**.
3. Verás dos casilleros:
    * **Google Gemini:** Pega tu clave `AIzaSy...`
    * **Groq Cloud:** Pega tu clave `gsk_...`
    * **OpenAI:** Pega tu clave `sk-...`
4. Dale a **Guardar**. ¡Listo!

## 5. Cómo Usar

### Capturar Pantalla

* Puedes abrir la extension a traves de un atajo o desde el menu derecho de la extension.

    1. Click derecho en la extension y despues en "Gestionar extension"
    2. Click en Accesos directos.
    3. Agregar el atajo `Alt + Shift + Z`

* Click derecho en cualquier lugar de la pagina web y seleccionar: "Preguntar a la IA sobre esta pantalla".

### Triple modelo para mayor estabilidad y fallback

Por defecto, la extensión intentará usar el mejor modelo disponible:

1. **Gemini 3.0 Flash Preview** *(Mayor razonamiento)*.
2. Si falla, baja a **Gemini 2.5 Flash**.
3. Si falla, baja a **Gemini 2.5 Flash Lite**.
4. Si falla, baja a **Groq** *(Mayor velocidad)*.

Puedes forzar el uso de Groq desde el selector en la ventana de chat si lo prefieres para casos de mayor velocidad.
