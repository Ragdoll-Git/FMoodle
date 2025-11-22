# ℹ️ Instrucciones de Instalación y Uso

Sigue estos pasos para instalar la extensión "Resumen IA de Pantalla" en tu navegador Google Chrome (o navegadores basados en Chromium como Edge o Brave).

## 1. Requisitos Previos

Asegúrate de tener la carpeta de la extensión con los siguientes 7 archivos y la carpeta de imágenes:

1.  `manifest.json`
2.  `background.js`
3.  `content.js`
4.  `prompts.js`
5.  `options.html`
6.  `options.js`
7.  `Carpeta /images/` (con los iconos)

## 2. Obtener tu Clave (API Key)

La extensión necesita un "cerebro" para funcionar. Usamos Google Gemini.

1.  Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Inicia sesión con tu cuenta de Google.
3.  Haz clic en **"Create API key"**.
4.  Copia esa clave (empieza con `AIzaSy...`). Tenla a mano.

## 3. Instalar en Chrome

1.  Abre Chrome y escribe en la barra de direcciones: `chrome://extensions`.
2.  En la esquina superior derecha, activa el interruptor **"Modo de desarrollador"**.
3.  Aparecerán botones nuevos. Haz clic en **"Cargar descomprimida"** (Load unpacked).
4.  Busca y selecciona la carpeta donde tienes guardados los archivos de la extensión.
5.  La extensión aparecerá en tu lista.

## 4. Configurar la Clave (Paso Nuevo)

**Ya no hace falta editar código.** Sigue estos pasos una sola vez:

1.  Busca el icono de la extensión (el maletín amarillo 💼) en la barra de Chrome (si no lo ves, toca la pieza de rompecabezas y fíjalo).
2.  Haz **Click Derecho** sobre el icono de la extensión.
3.  En el menú, selecciona **"Opciones"** (u "Options").
4.  Se abrirá una ventanita. **Pega tu API Key** ahí y dale a **Guardar**.
5.  Si dice "¡Clave guardada correctamente!", ya estás listo.

## 5. Cómo Usar

### Capturar Pantalla
Navega a la web que quieras analizar y tienes dos formas de activarla:
* **Opción A:** Atajo de teclado `Alt + Shift + Z`.
* **Opción B:** Click derecho en la página -> "Preguntar a la IA sobre esta pantalla".

### Usar la Ventana
* **Escribir:** Escribe tu duda en el recuadro.
* **Prompts:** Usa el menú desplegable de arriba para elegir instrucciones pre-cargadas (ej: C++, Señales).
* ** Minimizar:** Si la respuesta tarda o quieres ver la pantalla, toca el guion (`-`) arriba a la derecha. La ventana se convertirá en una burbuja blanca flotante.
* **Fijar:** Toca el pin (📌) para que la ventana no se cierre si haces clic fuera de ella.