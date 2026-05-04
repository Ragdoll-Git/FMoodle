# FMoodle Desktop 🚀

FMoodle es una aplicación de escritorio nativa para Windows, diseñada para integrar y gestionar de forma centralizada múltiples proveedores de Inteligencia Artificial (Gemini, Claude, OpenAI, Groq y Nvidia Kimi K2.5).

Originalmente nacida como una extensión web, FMoodle ha evolucionado a un robusto sistema de escritorio con soporte para el protocolo MCP (Model Context Protocol), operación en memoria (Zero-Knowledge) y soporte nativo del sistema operativo.

## ✨ Características Principales

* **🤖 Soporte Multi-Proveedor:**
  * **Google Gemini**
  * **Anthropic Claude 3.5 Sonnet**
  * **OpenAI (ChatGPT)**
  * **Groq**
  * **Nvidia Labs (Kimi K2.5)**
* **🔒 Seguridad Zero-Knowledge:** Todas las claves de API (API Keys) se almacenan de manera completamente segura utilizando el Administrador de Credenciales nativo de Windows (Windows Credential Vault). Las claves jamás se guardan en texto plano.
* **🌐 Soporte MCP (Model Context Protocol):** Integración nativa para consumir recursos y herramientas desde servidores MCP remotos o locales, ampliando las capacidades del asistente de IA.
* **🚀 Modo Portable (RAM-Only):** Puede ejecutarse en modo 100% portable donde los datos residen únicamente en la memoria RAM, sin dejar rastros de configuración o claves en el disco de la computadora.
* **💻 Interfaz Moderna (PySide6):** UI construida con Qt/PySide6, con soporte de temas, modo siempre-visible (Always on Top) y diseño responsivo.
* **⚡ Autoinicio de Windows:** Se integra silenciosamente con Windows, ejecutándose en segundo plano al iniciar sesión mediante el registro de Windows (`winreg`).

## 📁 Estructura del Proyecto

* `core/`: Contiene el enrutador de IA (`providers.py`) y la lógica de conexión al servidor MCP (`mcp.py`).
* `ui/`: Todos los componentes visuales interactivos (`overlay.py`, `settings.py`, `theme.py`).
* `utils/`: Herramientas del sistema, persistencia y capturas (`config.py`, `capture.py`, `autostart.py`).
* `main.py`: Punto de entrada clásico para la aplicación instalable persistente.
* `portable.py`: Punto de entrada especial que bloquea la escritura en disco (Modo RAM).

## 🛡️ Versiones y Distribución

El proyecto incluye un script de automatización (`build.py`) impulsado por **PyInstaller** que compila la aplicación en dos formatos listos para usar en la carpeta `/Releases`:

1. **FMoodle Installer:** Versión estándar para instalar permanentemente en el sistema.
2. **FMoodle Portable:** Un solo `.exe` que puedes llevar en un USB, ejecutar sin permisos de administrador y usar con privacidad absoluta.

---
Para aprender cómo instalar, compilar desde el código fuente o configurar tu versión portable, por favor lee la guía en el archivo **[INSTRUCCIONES.md](INSTRUCCIONES.md)**.

## ❓ Preguntas Frecuentes (FAQ)

**¿El instalador es persistente? ¿Iniciará con Windows al reiniciar?**
Sí. La versión instalada (persistente) guarda sus datos en tu carpeta secreta de usuario (`AppData`) para no tener problemas de permisos. Además, si activas la opción "Iniciar automáticamente con Windows" en la configuración, el programa se añadirá al registro interno de tu sistema (`winreg`) y se ejecutará silenciosamente en segundo plano cada vez que enciendas tu computadora.

**¿Dónde se guarda o cómo funciona exactamente la versión Portable?**
La versión portable (`FMoodle_Portable.exe`) es un archivo único que se genera en la carpeta `dist/` al compilar. Puedes llevarte ese ejecutable en un pendrive a cualquier PC. Al ejecutarse, entra en modo "Zero-Knowledge": no escribe NADA en el disco duro (ni archivos de configuración, ni guarda contraseñas en el administrador de credenciales de Windows). Todo se guarda exclusivamente en la memoria RAM y se pierde de forma segura en cuanto cierras la aplicación.

**¿Qué pasa con los "warnings" o advertencias naranjas de Inno Setup al compilar el instalador?**
En versiones modernas de Inno Setup (6+), advertencias como `Warning: Architecture identifier "x64" is deprecated` o referidas al uso de `{pf}` son normales y no rompen tu instalador. De todas formas, la plantilla `inno_setup.iss` de este proyecto ya utiliza la sintaxis moderna (`x64compatible` y `{autopf}`) para evitar esas alertas.

**Para usar la integración MCP (Model Context Protocol), ¿es necesario instalar Docker localmente?**
No. El sistema MCP de FMoodle se comunica enviando peticiones web (HTTP POST) a la URL que le indiques. Puedes autohostear tu servidor MCP en cualquier máquina remota, servidor local o a través de una VPN (por ejemplo, `http://10.0.0.5:8080`) y FMoodle consumirá esos recursos directamente, sin requerir Docker ni otras herramientas instaladas en tu computadora local.
