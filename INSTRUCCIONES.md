# ℹ️ Instrucciones de Instalación y Uso

Sigue estos pasos para instalar y configurar la extensión con soporte para múltiples inteligencias artificiales.

## 1. Requisitos Previos

Asegúrate de tener la carpeta de la extensión con los siguientes **8 archivos** (se agregó uno nuevo) y la carpeta de imágenes:

1.  `manifest.json`
2.  `background.js`
3.  `groq.js` (**Nuevo**: Archivo de lógica Groq)
4.  `content.js`
5.  `prompts.js`
6.  `options.html`
7.  `options.js`
8.  `Carpeta /images/` (con los iconos)

## 2. Obtener tus Claves (API Keys)

Ahora puedes usar dos "cerebros". Te recomendamos configurar ambos para tener siempre un respaldo.

### A. Google Gemini (Principal)
1.  Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Inicia sesión y haz clic en **"Create API key"**.
3.  Copia la clave (empieza con `AIzaSy...`).

### B. Groq Cloud (Opcional / Respaldo)
1.  Ve a [Groq Console](https://console.groq.com/keys).
2.  Inicia sesión y ve a la sección **API Keys**.
3.  Haz clic en **"Create API Key"**.
4.  Ponle un nombre (ej: `ChromeExt`) y copia la clave (empieza con `gsk_...`).

## 3. Instalar en Chrome

1.  Abre Chrome y ve a: `chrome://extensions`.
2.  Activa el **"Modo de desarrollador"** (arriba a la derecha).
3.  Haz clic en **"Cargar descomprimida"** (Load unpacked).
4.  Selecciona la carpeta de la extensión.

## 4. Configurar las Claves

1.  Busca el icono de la extensión (💼) en la barra de Chrome.
2.  Haz **Click Derecho** sobre el icono y elige **"Opciones"**.
3.  Verás dos casilleros:
    * **Google Gemini:** Pega tu clave `AIzaSy...`
    * **Groq Cloud:** Pega tu clave `gsk_...`
4.  Dale a **Guardar**. ¡Listo!

## 5. Cómo Usar

### Capturar Pantalla
* Atajo: `Alt + Shift + Z`.
* O click derecho: "Preguntar a la IA sobre esta pantalla".

### Elegir tu IA (Nuevo)
En la ventana que aparece, verás un selector azul pequeño arriba a la derecha (junto a los Prompts):
* **Gemini:** Usará los modelos de Google (Flash 2.5).
* **Groq:** Usará el modelo Llama 4 Scout (¡Muy rápido!).

Si uno falla o está lento, ¡simplemente cambia al otro en el selector y vuelve a enviar!