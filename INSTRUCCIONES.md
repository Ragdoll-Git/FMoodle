# Instrucciones de Uso y Compilación 🛠️

Este documento detalla cómo utilizar, instalar y compilar **FMoodle Desktop** desde cero.

---

## 1. Instalación Rápida (Usuarios Finales)

Si solo quieres usar el programa, dirígete a la carpeta `Releases/` en el código fuente (o descárgalos desde GitHub Releases) y elige tu versión preferida:

### Opción A: Instalador Persistente (`FMoodle_Installer.exe`)
Ideal para tu computadora personal de uso diario.
1. Ejecuta `FMoodle_Installer.exe`.
2. Sigue el asistente de instalación clásico (Siguiente > Instalar).
3. Una vez instalado, ábrelo. Ve a la pestaña **Ajustes** (ícono del engranaje).
4. Introduce tus API Keys (se guardarán en el *Administrador de Credenciales de Windows*, jamás en texto plano).
5. (Opcional) Activa "Iniciar con Windows" para que el asistente esté siempre activo al encender tu PC.

### Opción B: Modo Portable (`FMoodle_Portable.exe`)
Ideal para computadoras de terceros, bibliotecas, oficinas o pendrives.
1. Copia `FMoodle_Portable.exe` a tu pendrive.
2. Ejecútalo. **No pedirá permisos de administrador**.
3. Pon tus API Keys temporalmente en Ajustes.
4. Cuando cierres la ventana, la memoria RAM se vaciará y la PC quedará sin ningún rastro de tus configuraciones o claves.

---

## 2. Configuración para Desarrolladores

Si quieres modificar el código de FMoodle en tu computadora, sigue estos pasos.

### Prerrequisitos
* **Python 3.10+** (Recomendado 3.11 o superior).
* Entorno Windows 10 u 11 (Usa la API `winreg` y el `Credential Manager` de Windows).

### Configuración del Entorno Virtual
1. Abre tu terminal (PowerShell o CMD).
2. Clona el repositorio y entra a la carpeta:
   ```powershell
   git clone https://github.com/Lautaro-cloud/FMoodle.git
   cd FMoodle/FMoodle
   ```
3. Crea y activa tu entorno virtual:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
4. Instala las dependencias:
   ```powershell
   pip install -r requirements.txt
   ```
   *(Asegúrate de instalar PySide6, keyring, requests, mcp, etc)*

### Ejecutar en Desarrollo
Puedes ejecutar las dos versiones directo desde el intérprete:
- **Modo normal:** `python main.py`
- **Modo en RAM (Portable):** `python portable.py`

---

## 3. Compilación y Empaquetado

Para generar tus propios `.exe`, FMoodle cuenta con un script de compilación inteligente que usa `PyInstaller` encapsulado.

1. Asegúrate de tener tu entorno virtual activo (`.\.venv\Scripts\activate`).
2. Verifica que `pyinstaller` esté instalado:
   ```powershell
   pip install pyinstaller
   ```
3. Ejecuta el empaquetador:
   ```powershell
   python build.py
   ```
4. Esto limpiará las builds anteriores y creará una carpeta `dist/` con las nuevas compilaciones y la carpeta `Releases/` lista para distribuir.

### Crear un Instalador Profesional
Si deseas generar un instalador con formato asistente (Next > Next > Install), puedes descargar **Inno Setup Compiler**. 
Abre el archivo `inno_setup.iss` con este programa y dale al botón "Compile". Generará el instalador automáticamente en la carpeta `Output/`.
